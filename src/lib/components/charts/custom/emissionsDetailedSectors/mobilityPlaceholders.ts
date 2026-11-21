// Placeholders about international aviation for the CMS text of the emissions chart (mobility page):
//   "Die Emissionen aus dem internationalen Flugverkehr lagen {{aviationPeakYear}} mit {{aviationPeak}} Millionen Tonnen
//    CO₂-Äquivalent so hoch wie nie zuvor, und damit über dem bisherigen Höchstwert von {{aviationPreviousPeakYear}}."
// They update automatically when a new inventory year is loaded. Values are greenhouse gases (THG) in million tonnes CO₂e.
//
// {{aviationPeakYear}}          year with the highest international aviation emissions (e.g. "2024")
// {{aviationPeak}}              value in that year (e.g. "2,95")
// {{aviationPreviousPeakYear}}  highest year before the peak year (e.g. "2019")

type Subsector = { code: string; absolute: number[] };
type Sector = { key: string; absolute: number[]; sectors: Subsector[] };

const AVIATION = 'Memo 1 D 1 a';

export function mobilityPlaceholders(thg: Sector[] | undefined, firstYear = 1990): Record<string, string> {
	const aviation = thg?.find((s) => s.key === 'memo')?.sectors.find((s) => s.code === AVIATION)?.absolute;
	if (!aviation?.some((v) => v > 0)) return {};

	const peakIndex = aviation.reduce((best, v, i) => (v > aviation[best] ? i : best), 0);
	const before = aviation.slice(0, peakIndex);
	const prevIndex = before.length ? before.reduce((best, v, i) => (v > before[best] ? i : best), 0) : -1;

	return {
		aviationPeakYear: String(firstYear + peakIndex),
		aviationPeak: aviation[peakIndex].toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		aviationPreviousPeakYear: prevIndex >= 0 ? String(firstYear + prevIndex) : ''
	};
}
