import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { getStripe, createPortalSession } from '$lib/server/stripe';

const requestSchema = z.object({ clientSecret: z.string().min(1) });

/**
 * Opens the Stripe Customer Portal for the donor who just paid.
 *
 * Authorisation is proof-of-payment: the caller must present the PaymentIntent
 * client secret, which only the person who actually went through checkout in this
 * browser holds. We re-retrieve the intent server-side, check the secret matches
 * (so a guessed intent id gets nothing) and that it actually got paid, then take the
 * customer from the intent itself. A customer id is never accepted from the client —
 * that would let anyone who can guess or obtain one open someone else's portal.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	const raw = await request.json().catch(() => null);
	const parsed = requestSchema.safeParse(raw);
	if (!parsed.success) throw error(400, { message: 'Ungültige Eingabe.' });

	const { clientSecret } = parsed.data;
	const intentId = clientSecret.split('_secret_')[0];
	if (!intentId.startsWith('pi_')) throw error(400, { message: 'Ungültige Eingabe.' });

	try {
		const intent = await getStripe().paymentIntents.retrieve(intentId);

		if (intent.client_secret !== clientSecret) {
			throw error(403, { message: 'Kein Zugriff.' });
		}
		if (intent.status !== 'succeeded' && intent.status !== 'processing') {
			throw error(403, { message: 'Kein Zugriff.' });
		}

		const customerId = typeof intent.customer === 'string' ? intent.customer : intent.customer?.id;
		if (!customerId) throw error(403, { message: 'Kein Zugriff.' });

		const session = await createPortalSession(customerId, `${url.origin}/donate`);
		return json({ url: session.url });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e; // re-throw our own 4xx
		console.error('[create-portal-session] failed', e);
		throw error(502, { message: 'Verwaltungslink konnte nicht erstellt werden.' });
	}
};
