import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { getStripe } from '$lib/server/stripe';

const addressSchema = z.object({
	addressLine: z.string().min(1),
	zip: z.string().min(1),
	city: z.string().min(1),
	state: z.string().optional(),
	details2: z.string().optional()
});

const requestSchema = z.object({
	clientSecret: z.string().min(1),
	subscriptionId: z.string().optional(),
	name: z.string().min(1).max(81),
	email: z.string().email(),
	country: z.string().length(2),
	birthdate: z.string().optional(),
	wantsReceipt: z.boolean(),
	newsletter: z.boolean().default(false),
	address: addressSchema.optional()
});

/**
 * Refreshes the donor details on an already-created intent, just before it gets
 * confirmed. Exists so that editing a name or spinning an iOS date wheel doesn't
 * have to recreate the intent — which would tear down and rebuild the mounted
 * Stripe Elements underneath the donor.
 *
 * Authorisation is the same proof-of-possession used elsewhere: you must hold the
 * intent's client secret. Amount is never touched here — only metadata — so this
 * cannot change what the donor is about to be charged.
 */
export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.json().catch(() => null);
	const parsed = requestSchema.safeParse(raw);
	if (!parsed.success) throw error(400, { message: 'Ungültige Eingabe.' });

	const { clientSecret, subscriptionId, name, email, country, birthdate, wantsReceipt, newsletter, address } =
		parsed.data;

	const intentId = clientSecret.split('_secret_')[0];
	if (!intentId.startsWith('pi_')) throw error(400, { message: 'Ungültige Eingabe.' });

	try {
		const stripe = getStripe();
		const intent = await stripe.paymentIntents.retrieve(intentId);
		if (intent.client_secret !== clientSecret) throw error(403, { message: 'Kein Zugriff.' });

		// Already paid (or being paid) — nothing to amend.
		if (!['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(intent.status)) {
			return json({ updated: false });
		}

		const metadata: Record<string, string> = {
			name,
			email,
			country,
			birthdate: birthdate ?? '',
			wantsReceipt: String(wantsReceipt),
			newsletter: String(newsletter),
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

		if (subscriptionId) {
			// Recurring: the webhook books every invoice off the SUBSCRIPTION's metadata,
			// so that's what has to be current. Only accept a subscription belonging to
			// the same customer as the verified intent — otherwise holding any valid
			// client secret would let you rewrite someone else's subscription.
			const sub = await stripe.subscriptions.retrieve(subscriptionId);
			const subCustomer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
			const intentCustomer =
				typeof intent.customer === 'string' ? intent.customer : intent.customer?.id;
			if (!intentCustomer || subCustomer !== intentCustomer) {
				throw error(403, { message: 'Kein Zugriff.' });
			}
			await stripe.subscriptions.update(subscriptionId, { metadata });
		} else {
			await stripe.paymentIntents.update(intentId, {
				metadata: { ...intent.metadata, ...metadata },
				receipt_email: email
			});
		}

		return json({ updated: true });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e; // our own 4xx
		console.error('[update-payment-intent] failed', e);
		throw error(502, { message: 'Aktualisierung fehlgeschlagen.' });
	}
};
