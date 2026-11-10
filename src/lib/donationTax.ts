/**
 * Which tax rules apply to a donation, by donor country.
 *
 * Austria: the Verein reports donations to the Finanzamt automatically, matched
 * via name + birthdate (vbPK). No address is needed, a birthdate is.
 *
 * Germany: since 16.09.2026 the Verein is listed in the Zuwendungsempfängerregister
 * (BZSt, § 5 Abs. 1 Nr. 47 Buchstabe b) FVG). Donations from Germany are only
 * deductible if the donor receives a Zuwendungsbestätigung nach amtlich
 * vorgeschriebenem Muster (§ 50 Abs. 1 EStDV) — there is no simplified-proof route
 * for a foreign recipient, so the address is mandatory and a receipt is always
 * issued. A birthdate is irrelevant here.
 *
 * Everywhere else: not deductible, nothing required — but a donor may still opt
 * into a formal receipt, which then needs both.
 *
 * NOTE: the German ZER entry expires 15.09.2027 unless renewed (apply by ~June
 * 2027). Receipts may only be issued while it is valid.
 */
export type TaxRegime = 'AT' | 'DE' | 'none';

export const DE_REGISTRATION_VALID_UNTIL = '2027-09-15';

export function taxRegime(country: string): TaxRegime {
	if (country === 'AT') return 'AT';
	if (country === 'DE') return 'DE';
	return 'none';
}

/** Whether a donation from this country is tax-deductible for the donor. */
export function isDeductible(country: string): boolean {
	return taxRegime(country) !== 'none';
}

/** A birthdate is only ever needed for the Austrian Finanzamt match. */
export function needsBirthdate(country: string, wantsReceipt: boolean): boolean {
	const regime = taxRegime(country);
	if (regime === 'AT') return true;
	if (regime === 'DE') return false;
	return wantsReceipt;
}

/** Germany always needs one; elsewhere only for an opted-in formal receipt. */
export function needsAddress(country: string, wantsReceipt: boolean): boolean {
	const regime = taxRegime(country);
	if (regime === 'AT') return false;
	if (regime === 'DE') return true;
	return wantsReceipt;
}
