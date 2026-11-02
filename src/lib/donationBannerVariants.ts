/**
 * Headline variants for the donation banner A/B test.
 *
 * Each time the banner is shown, one variant is picked at random (no cookie or
 * storage — every impression is an independent draw). The banner reports to
 * Rybbit:
 *   - `Donation Banner Impression` { variant }
 *   - `Donation Banner Click`      { variant, amount }
 *   - `Donation Banner Dismiss`    { variant }
 * and the donate page tags `Donation Success` with { banner: variant }.
 *
 * Conversion rate per variant = clicks / impressions. To end the test, leave
 * only the winner here. Changing a variant's text means giving it a new `id`,
 * otherwise old and new numbers get mixed.
 */
export type DonationBannerVariant = { id: string; headline: string };

export const donationBannerVariants: DonationBannerVariant[] = [
	{ id: 'fakten', headline: 'Fakten statt Fake News – hilf uns, unabhängig zu bleiben!' },
	{
		id: 'projekte-2027',
		headline:
			'Das Klimadashboard ist auf Spenden angewiesen, um auch 2027 neue Projekte umzusetzen.'
	},
	{ id: 'steuer', headline: 'Deine Spende fürs Klimadashboard ist von der Steuer absetzbar.' }
];

export function pickDonationBannerVariant(): DonationBannerVariant {
	return donationBannerVariants[Math.floor(Math.random() * donationBannerVariants.length)];
}

/** Only known ids are passed on, so the query param can't inject arbitrary values into analytics. */
export function isDonationBannerVariantId(id: string | null): id is string {
	return !!id && donationBannerVariants.some((v) => v.id === id);
}
