/**
 * Smallest card donation we accept. Shared by the form and the API so the two can
 * never drift apart — if they did, the form would happily submit an amount the
 * server then rejects.
 */
export const MIN_DONATION_EUR = 10;

/** Stripe EU card fee: 1.5% + €0.25, rounded up so the org's net never falls short. */
export function calculateCardFee(donationEUR: number): { fee: number; total: number } {
	const rate = 0.015;
	const fixed = 0.25;
	const rawFee = (donationEUR + fixed) / (1 - rate) - donationEUR;
	const fee = Math.ceil(rawFee * 100) / 100;
	const total = Math.round((donationEUR + fee) * 100) / 100;
	return { fee, total };
}
