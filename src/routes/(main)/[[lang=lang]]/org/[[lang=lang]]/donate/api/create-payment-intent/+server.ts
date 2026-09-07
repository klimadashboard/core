import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { getStripe, upsertStripeCustomer, createRecurringSubscription } from '$lib/server/stripe';
import { calculateCardFee, MIN_DONATION_EUR } from '$lib/utils/donationFee';

const addressSchema = z.object({
	addressLine: z.string().min(1),
	zip: z.string().min(1),
	city: z.string().min(1),
	state: z.string().optional(),
	details2: z.string().optional()
});

const requestSchema = z
	.object({
		amount: z.number().min(MIN_DONATION_EUR).max(200000),
		frequency: z.enum(['onetime', 'recurring']).default('onetime'),
		coverFee: z.boolean(),
		name: z.string().min(1).max(81),
		email: z.string().email(),
		country: z.string().length(2),
		birthdate: z.string().optional(),
		wantsReceipt: z.boolean(),
		newsletter: z.boolean().default(false),
		address: addressSchema.optional(),
		message: z.string().max(2000).optional()
	})
	.superRefine((data, ctx) => {
		const needsFullReceipt = data.country !== 'AT' && data.wantsReceipt;
		if ((data.country === 'AT' || needsFullReceipt) && !data.birthdate) {
			ctx.addIssue({ code: 'custom', message: 'Geburtsdatum fehlt.', path: ['birthdate'] });
		}
		if (needsFullReceipt && !data.address) {
			ctx.addIssue({ code: 'custom', message: 'Adresse fehlt.', path: ['address'] });
		}
	});

const debugId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const POST: RequestHandler = async ({ request }) => {
	const dbg = debugId();
	const raw = await request.json().catch(() => null);
	const parsed = requestSchema.safeParse(raw);
	if (!parsed.success) {
		console.warn(`[${dbg}] create-payment-intent validation failed`, parsed.error.flatten());
		throw error(400, { message: 'Ungültige Eingabe.' });
	}
	const {
		amount,
		frequency,
		coverFee,
		name,
		email,
		country,
		birthdate,
		wantsReceipt,
		newsletter,
		address,
		message
	} = parsed.data;

	const { fee } = calculateCardFee(amount);
	const chargeAmount = coverFee ? amount + fee : amount;
	const amountCents = Math.round(chargeAmount * 100);

	let customer;
	try {
		customer = await upsertStripeCustomer({ email, name });
	} catch (e) {
		console.error(`[${dbg}] Stripe customer upsert failed`, e);
		throw error(502, { message: 'Zahlung konnte nicht initialisiert werden.' });
	}

	// Everything the webhook needs to book this in Campai once payment is confirmed —
	// no Campai write happens here, only once payment succeeds.
	const metadata: Record<string, string> = {
		dbg,
		donationType: frequency,
		donationEUR: String(amount),
		name,
		email,
		country,
		birthdate: birthdate ?? '',
		wantsReceipt: String(wantsReceipt),
		newsletter: String(newsletter),
		message: message ?? '',
		...(address
			? {
					addressLine: address.addressLine,
					zip: address.zip,
					city: address.city,
					state: address.state ?? '',
					details2: address.details2 ?? ''
				}
			: {})
	};

	let clientSecret: string | null = null;
	let subscriptionId: string | null = null;
	try {
		if (frequency === 'recurring') {
			const sub = await createRecurringSubscription({
				amountCents,
				customerId: customer.id,
				metadata
			});
			clientSecret = sub.clientSecret;
			subscriptionId = sub.subscriptionId;
		} else {
			const pi = await getStripe().paymentIntents.create({
				amount: amountCents,
				currency: 'eur',
				customer: customer.id,
				receipt_email: email,
				description: 'Spende Klimadashboard',
				automatic_payment_methods: { enabled: true },
				metadata
			});
			clientSecret = pi.client_secret;
		}
	} catch (e) {
		console.error(`[${dbg}] Stripe payment create failed`, e);
		throw error(502, { message: 'Zahlung konnte nicht initialisiert werden.' });
	}

	if (!clientSecret) {
		throw error(502, { message: 'Zahlung konnte nicht initialisiert werden.' });
	}

	// Only the client secret (plus, for recurring, the subscription it belongs to)
	// goes back to the browser — never the customer id, which would otherwise let
	// anyone submitting this form with someone else's email walk away with an
	// identifier that opens that person's billing portal.
	return json({ clientSecret, subscriptionId });
};
