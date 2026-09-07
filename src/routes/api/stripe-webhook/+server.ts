import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type Stripe from 'stripe';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { getStripe } from '$lib/server/stripe';
import {
	createDebtor,
	createRevenueReceipt,
	markReceiptPaid,
	createDonationReceipt,
	createAustrianDonationRecord,
	type Address
} from '$lib/server/campai';
import { subscribeToNewsletter } from '$lib/server/brevo';

/**
 * Stripe webhook — the only place a donation gets booked into Campai. Read the raw
 * body (not JSON) so the signature can be verified.
 *
 * payment_intent.succeeded only handles ONE-TIME donations (guarded by
 * metadata.donationType) — recurring donations are booked via invoice.paid instead,
 * since that fires uniformly for both the first charge and every renewal.
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
	const sig = request.headers.get('stripe-signature');
	if (!sig || !STRIPE_WEBHOOK_SECRET) throw error(400, 'Missing signature/secret');

	const body = await request.text();
	const stripe = getStripe();
	let event: Stripe.Event;
	try {
		event = await stripe.webhooks.constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET);
	} catch (e) {
		console.error('[stripe-webhook] signature verification failed:', e);
		throw error(400, 'Invalid signature');
	}

	try {
		switch (event.type) {
			case 'payment_intent.succeeded':
				await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, fetch);
				break;
			case 'payment_intent.payment_failed': {
				const pi = event.data.object as Stripe.PaymentIntent;
				console.warn('[stripe-webhook] payment failed', {
					dbg: pi.metadata?.dbg,
					reason: pi.last_payment_error?.message
				});
				break;
			}
			case 'invoice.paid':
				await handleInvoicePaid(event.data.object as Stripe.Invoice, fetch);
				break;
			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice;
				const subscription = invoice.parent?.subscription_details?.subscription;
				console.warn('[stripe-webhook] recurring charge failed', {
					subscription: typeof subscription === 'string' ? subscription : subscription?.id,
					attempt: invoice.attempt_count
				});
				break;
			}
			case 'customer.subscription.deleted': {
				const sub = event.data.object as Stripe.Subscription;
				// No donor identifiers in logs — look the subscription up in Stripe instead.
				console.info('[stripe-webhook] subscription cancelled', {
					dbg: sub.metadata?.dbg,
					subscription: sub.id
				});
				break;
			}
			default:
				break;
		}
	} catch (e) {
		console.error(`[stripe-webhook] handler error for ${event.type}:`, e);
		throw error(500, 'Handler error');
	}

	return json({ received: true });
};

interface DonorMeta {
	dbg: string;
	name: string;
	email: string;
	country: string;
	birthdate?: string;
	wantsReceipt: boolean;
	newsletter: boolean;
	address?: Address;
}

function parseDonorMeta(meta: Stripe.Metadata): DonorMeta | null {
	const dbg = meta.dbg || 'NOMETA';
	const name = meta.name;
	const email = meta.email;
	if (!name || !email) return null;

	const country = meta.country || 'AT';
	const birthdate = meta.birthdate || undefined;
	const wantsReceipt = meta.wantsReceipt === 'true';
	const needsFullReceipt = country !== 'AT' && wantsReceipt;
	const address: Address | undefined = needsFullReceipt
		? {
				country,
				zip: meta.zip || '',
				city: meta.city || '',
				addressLine: meta.addressLine || '',
				state: meta.state || undefined,
				details2: meta.details2 || undefined
			}
		: undefined;

	return {
		dbg,
		name,
		email,
		country,
		birthdate,
		wantsReceipt,
		newsletter: meta.newsletter === 'true',
		address
	};
}

/**
 * Newsletter opt-in, only ever after a payment actually succeeded. Deliberately
 * swallows its own errors: the donation is already booked by this point, and
 * throwing would make Stripe retry the whole webhook — re-booking it in Campai.
 */
async function maybeSubscribeToNewsletter(donor: DonorMeta, fetch: typeof globalThis.fetch) {
	if (!donor.newsletter) return;
	try {
		await subscribeToNewsletter({ fetch, email: donor.email });
	} catch (e) {
		console.error(`[${donor.dbg}] newsletter opt-in failed (non-fatal)`, e);
	}
}

/** Books one donation against an already-known debtor account. */
async function bookIntoCampai(opts: {
	fetch: typeof globalThis.fetch;
	donor: DonorMeta;
	debtorAccount: number;
	amountEUR: number;
	date: string;
	description: string;
}) {
	const { fetch, donor, debtorAccount, amountEUR, date, description } = opts;
	const needsFullReceipt = donor.country !== 'AT' && donor.wantsReceipt;

	if (needsFullReceipt && donor.address) {
		await createDonationReceipt({
			fetch,
			debtorAccount,
			debtorName: donor.name,
			name: donor.name,
			email: donor.email,
			birthdate: donor.birthdate,
			amountEUR,
			address: donor.address,
			intro: 'Vielen Dank für deine Unterstützung!',
			sendEmail: true,
			dbg: donor.dbg
		});
	} else {
		const receipt = await createRevenueReceipt({
			fetch,
			debtorAccount,
			accountName: donor.name,
			amountEUR,
			description,
			dbg: donor.dbg
		});
		await markReceiptPaid({ fetch, receiptId: receipt._id, debtorAccount, amountEUR, dbg: donor.dbg });
	}

	if (donor.country === 'AT') {
		await createAustrianDonationRecord({
			fetch,
			debtorAccount,
			name: donor.name,
			email: donor.email,
			amountEUR,
			date,
			description,
			dbg: donor.dbg
		});
	}
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent, fetch: typeof globalThis.fetch) {
	if (pi.metadata?.donationType !== 'onetime') return; // recurring is booked via invoice.paid

	const donor = parseDonorMeta(pi.metadata ?? {});
	if (!donor) {
		console.error(`[NOMETA] payment_intent.succeeded missing donor metadata`, pi.id);
		return;
	}

	const donationEUR = Number(pi.metadata.donationEUR || pi.amount / 100);
	const debtor = await createDebtor({
		fetch,
		name: donor.name,
		email: donor.email,
		birthdate: donor.birthdate,
		address: donor.address,
		dbg: donor.dbg
	});

	await bookIntoCampai({
		fetch,
		donor,
		debtorAccount: debtor.account,
		amountEUR: donationEUR,
		date: new Date().toISOString().slice(0, 10),
		description: 'Spende an den Verein Klimadashboard'
	});

	await maybeSubscribeToNewsletter(donor, fetch);

	console.info(`[${donor.dbg}] One-time donation booked`, { piId: pi.id, account: debtor.account });
}

async function handleInvoicePaid(invoice: Stripe.Invoice, fetch: typeof globalThis.fetch) {
	const subscription = invoice.parent?.subscription_details?.subscription;
	const subId = typeof subscription === 'string' ? subscription : subscription?.id;
	if (!subId) return; // not a subscription invoice

	const stripe = getStripe();
	const sub = await stripe.subscriptions.retrieve(subId);
	const donor = parseDonorMeta(sub.metadata ?? {});
	if (!donor) {
		console.error(`[NOMETA] invoice.paid missing donor metadata`, invoice.id);
		return;
	}

	const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
	const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;

	// Reuse the same Campai debtor across renewals — stored on the Stripe customer
	// after the first payment, so we never create a duplicate debtor each month.
	let debtorAccount = Number(customer.metadata?.campaiDebtorAccount || 0);
	if (!debtorAccount) {
		const debtor = await createDebtor({
			fetch,
			name: donor.name,
			email: donor.email,
			birthdate: donor.birthdate,
			address: donor.address,
			dbg: donor.dbg
		});
		debtorAccount = debtor.account;
		await stripe.customers.update(customerId, {
			metadata: { ...customer.metadata, campaiDebtorAccount: String(debtorAccount) }
		});
	}

	const isFirst = invoice.billing_reason === 'subscription_create';
	await bookIntoCampai({
		fetch,
		donor,
		debtorAccount,
		amountEUR: invoice.amount_paid / 100,
		date: new Date(invoice.created * 1000).toISOString().slice(0, 10),
		description: 'Monatliche Spende an den Verein Klimadashboard'
	});

	// Only on sign-up — renewals must not re-trigger the opt-in every month.
	if (isFirst) await maybeSubscribeToNewsletter(donor, fetch);

	console.info(`[${donor.dbg}] Recurring donation booked`, {
		invoiceId: invoice.id,
		account: debtorAccount,
		isFirst
	});
}
