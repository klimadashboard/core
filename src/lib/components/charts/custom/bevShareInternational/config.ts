// Battery-electric share of new passenger car registrations, Austria compared with other countries.
// Data (Directus, see docs/data-sources-mobility.md):
//   car_registrations_international  – all countries except Austria (Robbie Andrew, Collected vehicle registration data, CC BY 4.0;
//                                      synced weekly by flow/automated/carsales-international-weekly-sync.mjs)
//   vehicle_registrations            – Austria, passenger cars (Statistik Austria, Kfz-Statistik, Tabelle 2)
// Fuel categories differ per country (e.g. China only has internal_combustion / plugin_hybrid / electric), so everything that is
// neither battery electric nor plug-in hybrid counts as "fossil" (incl. non-plug-in hybrids).
import type { ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { formatNumber } from '$lib/utils/formatters';

const DIRECTUS = 'https://base.klimadashboard.org/items';
const AUSTRIA_REGION_ID = '3373d6d8-5fa2-4d5a-ac0b-790e69982f81';
export const SOURCE_URL = 'https://robbieandrew.github.io/carsales/';
// Card.svelte renders the source as HTML, so the links are shown directly
const SOURCE_HTML = `<a href="${SOURCE_URL}" target="_blank" rel="noopener" class="underline hover:no-underline">Robbie Andrew, Collected vehicle registration data</a> (CC BY 4.0); Österreich: <a href="https://www.statistik.at/statistiken/tourismus-und-verkehr/fahrzeuge/kfz-neuzulassungen" target="_blank" rel="noopener" class="underline hover:no-underline">Statistik Austria, Kfz-Statistik</a>`;
export const START = '2018-01';

// state code (as stored in car_registrations_international) → German label
export const COUNTRY_NAMES: Record<string, string> = {
	AL: 'Albanien', AT: 'Österreich', AU: 'Australien', BE: 'Belgien', BR: 'Brasilien', BG: 'Bulgarien', 'US-CA': 'Kalifornien',
	CA: 'Kanada', CL: 'Chile', CN: 'China', CO: 'Kolumbien', HR: 'Kroatien', CY: 'Zypern', CZ: 'Tschechien', DK: 'Dänemark',
	EC: 'Ecuador', EE: 'Estland', EU: 'EU', EU_EFTA_UK: 'Europa (EU, EFTA, UK)', FI: 'Finnland', FR: 'Frankreich', DE: 'Deutschland',
	GR: 'Griechenland', HU: 'Ungarn', IS: 'Island', IN: 'Indien', ID: 'Indonesien', IE: 'Irland', IL: 'Israel', IT: 'Italien',
	JP: 'Japan', LV: 'Lettland', LT: 'Litauen', LU: 'Luxemburg', MY: 'Malaysia', MT: 'Malta', MX: 'Mexiko', NP: 'Nepal',
	NL: 'Niederlande', NZ: 'Neuseeland', NO: 'Norwegen', PE: 'Peru', PL: 'Polen', PT: 'Portugal', RO: 'Rumänien', SG: 'Singapur',
	SK: 'Slowakei', SI: 'Slowenien', KR: 'Südkorea', ES: 'Spanien', SE: 'Schweden', CH: 'Schweiz', TW: 'Taiwan', TH: 'Thailand',
	TR: 'Türkei', US: 'USA', UA: 'Ukraine', GB: 'Vereinigtes Königreich', UY: 'Uruguay', VN: 'Vietnam'
};

export const HOME = 'AT';
export const DEFAULT_COMPARE = ['NO', 'DK', 'CN'];
// Austria + 5 = at most 6 countries, so the small multiples fit 1×6, 2×3 or 3×2
export const MAX_COMPARE = 5;
export const HOME_STYLE = { color: '#eb6834', dash: '6 3' as string | null };
// comparison slots: colour + dash, so lines never differ by colour alone; the first three keep the mockup colours
export const COMPARE_STYLES: { color: string; dash: string | null }[] = [
	{ color: '#2a78d6', dash: null },
	{ color: '#6250d6', dash: '9 3 2 3' },
	{ color: '#1baf7a', dash: '2 3' },
	{ color: '#c98500', dash: '10 4' },
	{ color: '#d55181', dash: '4 2' },
	{ color: '#4b5563', dash: '1 3' }
];

export const MIX = [
	{ key: 'bev', label: 'Batterieelektrisch', color: '#10B981' },
	{ key: 'phev', label: 'Plug-in-Hybrid', color: '#8B5CF6' },
	{ key: 'fossil', label: 'Verbrenner (inkl. Hybrid ohne Stecker)', color: '#9ca3af' }
] as const;

export type MonthRow = { month: string; bev: number; phev: number; fossil: number; total: number };
export type CarSalesData = Record<string, MonthRow[]>;

type Acc = Map<string, Map<string, { bev: number; phev: number; total: number }>>;
function add(acc: Acc, state: string, month: string, part: 'bev' | 'phev' | 'total', value: number) {
	if (!acc.has(state)) acc.set(state, new Map());
	const byMonth = acc.get(state)!;
	const r = byMonth.get(month) ?? { bev: 0, phev: 0, total: 0 };
	r[part] += value;
	byMonth.set(month, r);
}
const ym = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

/** loads all countries from Directus; pass the `fetch` of ChartFetchParams on the server (4 h cache) */
export async function fetchCarSales(fetchFn: typeof fetch = fetch): Promise<CarSalesData> {
	const [intlRes, atRes] = await Promise.all([
		fetchFn(
			`${DIRECTUS}/car_registrations_international?filter[date][_gte]=${START}-01&fields=state,year,month,fuel_type,value&limit=-1`
		),
		fetchFn(
			`${DIRECTUS}/vehicle_registrations?filter[region][_eq]=${AUSTRIA_REGION_ID}&filter[vehicle_class][_eq]=passenger_car_m1&filter[period][_eq]=month&fields=year,month,fuel_type,parent_fuel_type,value&limit=-1`
		)
	]);
	if (!intlRes.ok) throw new Error(`car_registrations_international: HTTP ${intlRes.status}`);
	if (!atRes.ok) throw new Error(`vehicle_registrations: HTTP ${atRes.status}`);
	const intl = ((await intlRes.json()).data ?? []) as { state: string; year: number; month: number; fuel_type: string; value: number }[];
	const at = ((await atRes.json()).data ?? []) as { year: number; month: number; fuel_type: string; parent_fuel_type: string | null; value: number }[];

	const acc: Acc = new Map();
	for (const r of intl) {
		const month = ym(r.year, r.month);
		const v = Number(r.value) || 0;
		add(acc, r.state, month, 'total', v);
		if (r.fuel_type === 'electric') add(acc, r.state, month, 'bev', v);
		if (r.fuel_type === 'plugin_hybrid') add(acc, r.state, month, 'phev', v);
	}
	// Austria (Tabelle 2): total row, electric, and plug-in hybrids as subsets of the hybrid rows
	for (const r of at) {
		const month = ym(r.year, r.month);
		if (month < START) continue;
		const v = Number(r.value) || 0;
		if (r.fuel_type === 'total') add(acc, HOME, month, 'total', v);
		else if (r.fuel_type === 'electric') add(acc, HOME, month, 'bev', v);
		else if (r.parent_fuel_type) add(acc, HOME, month, 'phev', v);
	}

	const out: CarSalesData = {};
	for (const [state, byMonth] of acc) {
		if (!COUNTRY_NAMES[state]) continue;
		out[state] = [...byMonth.entries()]
			.filter(([, r]) => r.total > 0)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([month, r]) => ({ month, bev: r.bev, phev: r.phev, fossil: r.total - r.bev - r.phev, total: r.total }));
	}
	return out;
}

export const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const monthLabel = (m: string) => `${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
export const share = (r: MonthRow | undefined, k: 'bev' | 'phev' | 'fossil' = 'bev') => (r && r.total ? (r[k] / r.total) * 100 : null);
export const nameOf = (country: string) => COUNTRY_NAMES[country] ?? country;

/** latest month that all given countries have */
export function commonLatestMonth(data: CarSalesData, countries: string[]): string | null {
	const lasts = countries.map((c) => data[c]?.at(-1)?.month).filter(Boolean) as string[];
	return lasts.length === countries.length ? lasts.sort()[0] : null;
}

// share as a fraction in words, for sentences like "… war {{austriaShareText}} der neuen Autos elektrisch":
// "gut ein Drittel", "rund die Hälfte", "fast neun Zehntel", "praktisch alle"
const FRACTIONS: [number, string][] = [
	[1 / 10, 'ein Zehntel'],
	[1 / 8, 'ein Achtel'],
	[1 / 7, 'ein Siebtel'],
	[1 / 6, 'ein Sechstel'],
	[1 / 5, 'ein Fünftel'],
	[1 / 4, 'ein Viertel'],
	[1 / 3, 'ein Drittel'],
	[2 / 5, 'zwei Fünftel'],
	[1 / 2, 'die Hälfte'],
	[3 / 5, 'drei Fünftel'],
	[2 / 3, 'zwei Drittel'],
	[3 / 4, 'drei Viertel'],
	[4 / 5, 'vier Fünftel'],
	[9 / 10, 'neun Zehntel']
];
export function fractionInWords(share: number | null): string {
	if (share == null || !isFinite(share)) return '';
	const s = share / 100;
	if (s >= 0.97) return 'praktisch alle';
	if (s < 0.09) return 'weniger als ein Zehntel';
	let [target, words] = FRACTIONS[0];
	for (const [f, w] of FRACTIONS) if (Math.abs(s - f) < Math.abs(s - target)) [target, words] = [f, w];
	const diff = (s - target) / target;
	return `${Math.abs(diff) <= 0.03 ? 'rund' : diff > 0 ? 'gut' : 'fast'} ${words}`;
}

/**
 * Placeholders for the CMS text, always for Norway, Denmark, China and Austria (independent of the country selection):
 *   {{latestMonth}}          "Oktober 2026"   latest month all four countries have
 *   {{norwayShare}} {{denmarkShare}} {{chinaShare}} {{austriaShare}}            BEV share in that month, e.g. "98,8"
 *   {{chinaShareYearAgo}} {{austriaShareYearAgo}}                                same month one year earlier
 *   {{yearAgoMonth}}         "Oktober 2025"
 *   {{chinaAustriaGap}}      "12,0"   percentage points China ahead of Austria
 *   {{norwayShareText}} {{denmarkShareText}} {{chinaShareText}} {{austriaShareText}}
 *                            the share in words, e.g. "gut ein Drittel", "fast neun Zehntel", "praktisch alle"
 */
export function textPlaceholders(data: CarSalesData): Record<string, string> {
	const story = ['NO', 'DK', 'CN', 'AT'].filter((c) => data[c]?.length);
	const latest = commonLatestMonth(data, story);
	if (!latest) return {};
	const yearAgo = `${Number(latest.slice(0, 4)) - 1}${latest.slice(4)}`;
	const at = (c: string, m: string) => share(data[c]?.find((r) => r.month === m));
	const f = (v: number | null) => (v == null ? '' : formatNumber(v, 1));
	const cn = at('CN', latest);
	const atNow = at('AT', latest);
	return {
		latestMonth: monthLabel(latest),
		norwayShare: f(at('NO', latest)),
		denmarkShare: f(at('DK', latest)),
		chinaShare: f(cn),
		austriaShare: f(atNow),
		yearAgoMonth: monthLabel(yearAgo),
		chinaShareYearAgo: f(at('CN', yearAgo)),
		austriaShareYearAgo: f(at('AT', yearAgo)),
		chinaAustriaGap: cn != null && atNow != null ? formatNumber(cn - atNow, 1) : '',
		norwayShareText: fractionInWords(at('NO', latest)),
		denmarkShareText: fractionInWords(at('DK', latest)),
		chinaShareText: fractionInWords(cn),
		austriaShareText: fractionInWords(atNow)
	};
}

export function buildChartData(data: CarSalesData, countries: string[] = [HOME, ...DEFAULT_COMPARE]): ChartData {
	const list = countries.filter((c) => data[c]);
	const months = [...new Set(list.flatMap((c) => data[c].map((r) => r.month)))].sort();
	const byMonth = Object.fromEntries(list.map((c) => [c, new Map(data[c].map((r) => [r.month, r]))]));
	const key = (c: string) => c.toLowerCase().replace(/[^a-z]+/g, '_');
	const rows = months.map((m) => ({
		month: monthLabel(m),
		...Object.fromEntries(list.map((c) => [key(c), share(byMonth[c].get(m))]))
	}));
	const fmt = (v: any) => (v == null ? '–' : `${formatNumber(v, 1)} %`);
	return {
		raw: data,
		table: {
			columns: [
				{ key: 'month', label: 'Monat', align: 'left' },
				...list.map((c) => ({ key: key(c), label: `${nameOf(c)} (BEV-Anteil)`, align: 'right' as const, format: fmt }))
			],
			rows,
			filename: 'e_auto_anteil_neuzulassungen_laendervergleich'
		},
		// text placeholders always for the four countries of the story, independent of the selection in the chart
		placeholders: textPlaceholders(data),
		meta: {
			source: SOURCE_HTML
		}
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	try {
		return buildChartData(await fetchCarSales(fetch));
	} catch {
		return null;
	}
}
