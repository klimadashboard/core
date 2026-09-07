import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

let stripePromise: Promise<Stripe | null> | null = null;

/** Lazily loads Stripe.js once and reuses the instance. */
export function getStripe(): Promise<Stripe | null> {
	if (!stripePromise) {
		stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
	}
	return stripePromise;
}
