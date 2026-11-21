// Placeholders about international aviation for the CMS text of the emissions chart (mobility page):
//   "Die Emissionen aus dem internationalen Flugverkehr lagen {{aviationPeakYear}} mit {{aviationPeak}} Millionen Tonnen
//    CO₂-Äquivalent so hoch wie nie zuvor, und damit über dem bisherigen Höchstwert von {{aviationPreviousPeakYear}}."
// They update automatically when a new inventory year is loaded. Values are greenhouse gases (THG) in million tonnes CO₂e.
//
// {{aviationPeakYear}}          year with the highest international aviation emissions (e.g. "2024")
// {{aviationPeak}}              value in that year (e.g. "2,95")
// {{aviationPreviousPeakYear}}  highest year before the peak year (e.g. "2019")
//
// Rank of the transport sector (national inventory, latest year, without international aviation/shipping):
//   "Der Verkehr ist {{transportRankText}} Verursacher von Treibhausgasen in Österreich{{#if transportAbove1990}} –
//    und seine Emissionen liegen heute über dem Niveau von 1990{{/if}}."
// {{transportRankText}}    "der größte" if transport is the largest sector, otherwise "einer der größten"
// {{transportRank}}        rank among the sectors (e.g. "2")
// {{transportShare}}       share of total emissions in % (e.g. "28,0")
// {{transportAbove1990}}   "ja" if emissions in the latest year are above 1990, otherwise empty (for {{#if}})

type Subsector = { code: string; absolute: number[] };
type Sector = { key: string; absolute: number[]; sectors: Subsector[] };

const AVIATION = 'Memo 1 D 1 a';
const TRANSPORT = 'traffic';

export function transportRankPlaceholders(thg: Sector[] | undefined): Record<string, string> {
	const sectors = thg?.filter((s) => s.key !== 'memo') ?? [];
	const transport = sectors.find((s) => s.key === TRANSPORT)?.absolute;
	if (!transport?.length) return {};

	const last = transport.length - 1;
	const latest = (s: Sector) => s.absolute[last] ?? 0;
	const total = sectors.reduce((sum, s) => sum + latest(s), 0);
	const rank = 1 + sectors.filter((s) => s.key !== TRANSPORT && latest(s) > transport[last]).length;

	return {
		transportRank: String(rank),
		transportRankText: rank === 1 ? 'der größte' : 'einer der größten',
		transportShare: total
			? ((transport[last] / total) * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
			: '',
		transportAbove1990: transport[last] > transport[0] ? 'ja' : ''
	};
}

export function mobilityPlaceholders(thg: Sector[] | undefined, firstYear = 1990): Record<string, string> {
	return { ...transportRankPlaceholders(thg), ...aviationPlaceholders(thg, firstYear) };
}

function aviationPlaceholders(thg: Sector[] | undefined, firstYear: number): Record<string, string> {
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
