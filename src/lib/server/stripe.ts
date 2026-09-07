import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const DONATION_PRODUCT_METADATA_KEY = 'klimadashboard_product';
const DONATION_PRODUCT_METADATA_VALUE = 'recurring_donation';

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
	if (_stripe) return _stripe;
	if (!STRIPE_SECRET_KEY) {
		throw new Error('Server misconfiguration: STRIPE_SECRET_KEY is not set');
	}
	// No explicit apiVersion — let the SDK use its own pinned default, so the
	// bundled TypeScript types always match what's actually sent/received.
	_stripe = new Stripe(STRIPE_SECRET_KEY);
	return _stripe;
}

/**
 * Find an existing Stripe customer by email, or create one. An existing record is
 * returned untouched: this runs on an unauthenticated endpoint, so writing the
 * submitted name onto it would let anyone overwrite a real donor's name by
 * submitting the form with their email. Per-donation names live in the payment
 * metadata anyway, which is what the Campai booking actually uses.
 */
export async function upsertStripeCustomer(opts: {
	email: string;
	name: string;
}): Promise<Stripe.Customer> {
	const stripe = getStripe();
	const existing = await stripe.customers.list({ email: opts.email, limit: 1 });
	if (existing.data[0]) return existing.data[0];
	return stripe.customers.create({ email: opts.email, name: opts.name });
}

/** Find a Stripe customer by email only (no create) — used for the manage-subscription lookup. */
export async function findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
	const res = await getStripe().customers.list({ email, limit: 1 });
	return res.data[0] ?? null;
}

/**
 * Recurring donations use one dynamic price per amount, attached to a single
 * reusable "donation" Product (Stripe requires a Product for subscription
 * price_data — it can't take inline product_data like one-time PaymentIntents).
 * Found by metadata so repeated calls never create duplicates.
 */
let _donationProductId: string | null = null;
async function ensureDonationProduct(): Promise<string> {
	if (_donationProductId) return _donationProductId;
	const stripe = getStripe();
	const found = await stripe.products.search({
		query: `metadata['${DONATION_PRODUCT_METADATA_KEY}']:'${DONATION_PRODUCT_METADATA_VALUE}' AND active:'true'`,
		limit: 1
	});
	if (found.data[0]) {
		_donationProductId = found.data[0].id;
		return _donationProductId;
	}
	const product = await stripe.products.create({
		name: 'Klimadashboard Spende (monatlich)',
		metadata: { [DONATION_PRODUCT_METADATA_KEY]: DONATION_PRODUCT_METADATA_VALUE }
	});
	_donationProductId = product.id;
	return _donationProductId;
}

/**
 * Creates an incomplete monthly subscription and returns the client secret needed
 * to confirm its first invoice via the same Payment/Express Checkout Element used
 * for one-time donations. Donor metadata lives on the subscription — the webhook
 * reads it from there for every renewal, not from the invoice's PaymentIntent.
 */
export async function createRecurringSubscription(opts: {
	amountCents: number;
	customerId: string;
	metadata: Record<string, string>;
}): Promise<{ subscriptionId: string; clientSecret: string | null }> {
	const stripe = getStripe();
	const productId = await ensureDonationProduct();

	const sub = await stripe.subscriptions.create({
		customer: opts.customerId,
		description: 'Klimadashboard Spende (monatlich)',
		items: [
			{
				price_data: {
					currency: 'eur',
					product: productId,
					unit_amount: opts.amountCents,
					recurring: { interval: 'month' }
				}
			}
		],
		payment_behavior: 'default_incomplete',
		payment_settings: { save_default_payment_method: 'on_subscription' },
		// confirmation_secret is a plain field but still needs an explicit expand —
		// omitting it silently comes back undefined even though it isn't a reference.
		expand: ['latest_invoice.confirmation_secret'],
		metadata: opts.metadata
	});

	const invoice = sub.latest_invoice as Stripe.Invoice | null;
	return { subscriptionId: sub.id, clientSecret: invoice?.confirmation_secret?.client_secret ?? null };
}

/** Hosted Stripe Customer Portal session — must be created fresh each time, not bookmarked. */
export async function createPortalSession(
	customerId: string,
	returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
	return getStripe().billingPortal.sessions.create({
		customer: customerId,
		return_url: returnUrl
	});
}
