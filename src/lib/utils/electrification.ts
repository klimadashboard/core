// $lib/utils/electrification.ts
//
// Shared data access + constants for the electrification charts
// (electrificationCountryPaths, electrificationDistanceToTarget, electrificationBySector).
// Source: Eurostat, Complete energy balances (nrg_bal_c), loaded into the
// `electrification_rates` Directus collection (see [[region-slug-urls-seo]] for the
// `regions` collection this joins against).

import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

export interface ElectrificationRegion {
	id: string;
	code: string; // lowercase iso (e.g. "fr"), or "eu27"
	slug: string;
	layer: 'country' | 'union';
	name: string; // English display name
}

export interface ElectrificationPoint {
	regionId: string;
	category: string;
	year: number;
	value: number; // percentage, 0-100
}

export interface ElectrificationDataset {
	regions: ElectrificationRegion[];
	points: ElectrificationPoint[];
	years: number[];
	latestYear: number;
	updateDate: string;
}

export const EU_REGION_CODE = 'eu27';

/** Fallback for ChartData.meta.source. In practice the Directus `source` field overrides this
 *  (Card.svelte resolves `chart.content?.source || chartData?.meta?.source`), and that field is
 *  already localised. The page footer uses `strings(lang).sourceName` instead. */
export const SOURCE = 'Eurostat, Complete energy balances (nrg_bal_c)';

/** Countries with very small or distorted energy bases — dimmed + footnoted in charts.
 *  The footnote text lives in electrification.i18n.ts (`smallNote`). */
export const SMALL_COUNTRY_CODES = ['mt', 'cy', 'lu'];

/** Charts default to this start year; early-1990s data is unreliable for several states. */
export const DISPLAY_START = 2000;

export type SourceKey = 'ec' | 'eap' | 'cop31' | 'esabcc';

export interface SourceRef {
	url: string;
	/** Anchor into the landing page's "Data & methodology" section. */
	anchor: string;
}

/** Language-neutral source data. Display labels live in electrification.i18n.ts
 *  (`sourceLabel`), so this module stays free of user-facing strings. */
export const SOURCES: Record<SourceKey, SourceRef> = {
	ec: {
		url: 'https://energy.ec.europa.eu/topics/eus-energy-system/electrification_en',
		anchor: '#targets'
	},
	eap: {
		// Electrification Action Plan, COM(2026) 595, adopted Brussels 17.7.2026. Action 1 states
		// the target verbatim: "An indicative electrification target of 46% by 2040 (electricity
		// share in final energy consumption)" — the same metric this tracker plots. The document
		// never uses the word "binding".
		url: 'https://energy.ec.europa.eu/document/download/0ac29166-0bf1-4174-98d9-50606d660025_en?filename=COM_2026_595_1_EN_ACT_part1_v7_0.pdf',
		anchor: '#targets'
	},
	cop31: {
		url: 'https://unfccc.int/news/cop31-presidency-announces-new-targets-on-global-electrification-cutting-waste-resilient-cities',
		anchor: '#benchmarks'
	},
	esabcc: {
		url: 'https://climate-advisory-board.europa.eu/reports-and-publications/towards-eu-climate-neutrality-progress-policy-gaps-and-opportunities',
		anchor: '#benchmarks'
	}
};


export interface Target {
	year: number;
	value: number;
	/** 'reference' = published EU reference point; 'proposed' = draft figure, final text pending. */
	status: 'reference' | 'proposed';
	sourceKey: SourceKey;
}

/** The EU's own electrification targets, sorted by year. Value is a percentage (0-100).
 *
 *  EXACTLY TWO ENTRIES — do not append. Consumers across five files read `TARGETS[0]` as
 *  "the 2030 target" and `TARGETS[TARGETS.length - 1]` as "the 2040 target"; a third entry
 *  would silently repoint the country-paths x-domain and mislabel the gap columns.
 *  Contextual benchmarks from other bodies belong in REFERENCE_TARGETS. */
export const TARGETS: Target[] = [
	{ year: 2030, value: 32, status: 'reference', sourceKey: 'ec' },
	{ year: 2040, value: 46, status: 'proposed', sourceKey: 'eap' }
];

export interface ReferenceTarget {
	id: string;
	/** True when the figure is a GLOBAL rate rather than an EU one. Surfaced in the toggle
	 *  label: the EU sits above the global baseline, so an unlabelled comparison misleads. */
	global: boolean;
	color: string;
	/** Reference lines must not be told apart by colour alone (a11y). */
	dash: string;
	points: { year: number; value: number }[];
	sourceKey: SourceKey;
}

/** Contextual benchmarks, off by default, grouped so one toggle drives one source.
 *  Display labels live in electrification.i18n.ts (`refLabel`). */
export const REFERENCE_TARGETS: ReferenceTarget[] = [
	{
		id: 'cop31',
		global: true,
		color: '#373949',
		dash: '2 3',
		points: [{ year: 2035, value: 35 }],
		sourceKey: 'cop31'
	},
	{
		id: 'esabcc',
		global: false,
		color: '#B7693D',
		dash: '7 3',
		points: [
			{ year: 2040, value: 50 },
			{ year: 2050, value: 60 }
		],
		sourceKey: 'esabcc'
	}
];

/** Latest year any visible target refers to — drives x-domain extension. */
export function maxTargetYear(refs: ReferenceTarget[]): number {
	const years = [
		...TARGETS.map((t) => t.year),
		...refs.flatMap((r) => r.points.map((p) => p.year))
	];
	return Math.max(...years);
}

/** Highest value any visible target refers to — drives y-domain headroom. */
export function maxTargetValue(refs: ReferenceTarget[]): number {
	const values = [
		...TARGETS.map((t) => t.value),
		...refs.flatMap((r) => r.points.map((p) => p.value))
	];
	return Math.max(...values);
}

export interface SectorDef {
	key: string;
	color: string;
}

/** Sub-sectors of total final consumption. Colors reuse Klimadashboard's semantic sector palette
 *  where a direct match exists (industry, buildings, transport); "services" has no house
 *  equivalent so it borrows a ColorBrewer blue step per the multi-series guidance.
 *  Names live in electrification.i18n.ts (`sectorLabel` / `sectorShort`). */
export const SECTORS: SectorDef[] = [
	{ key: 'industry', color: '#373949' },
	{ key: 'residential', color: '#4880A8' },
	{ key: 'services', color: '#2171B5' },
	{ key: 'transport', color: '#F5AF4A' }
];

/** Total final consumption (all sectors combined) — Klimadashboard's "economy" teal. */
export const TOTAL_ECONOMY_COLOR = '#64AE9C';

/** Distinct hues for country comparison lines, apart from the sector hues above. */
export const COUNTRY_PALETTE = [
	'#2171B5', // blue-700
	'#CB181D', // red-700
	'#238B45', // green-700
	'#A50F15', // red-800
	'#08519C', // blue-800
	'#006D2C', // green-800
	'#FB6A4A', // red-500
	'#6BAED6' // blue-500
];

/** Color for a region (by id) given the current selection order (EU-27 fixed teal). */
export function countryColor(id: string, selected: string[], euId: string | undefined): string {
	if (id === euId) return TOTAL_ECONOMY_COLOR;
	const others = selected.filter((c) => c !== euId);
	const i = others.indexOf(id);
	return COUNTRY_PALETTE[(i < 0 ? others.length : i) % COUNTRY_PALETTE.length];
}

/** @param lang short locale ('de' | 'en') — selects the region-name translation. Region names are
 *  already translated in Directus (Österreich, Dänemark…), so this is all German names need. */
export async function fetchElectrificationDataset(
	fetch: typeof globalThis.fetch,
	lang: string = 'en'
): Promise<ElectrificationDataset> {
	const directus = getDirectusInstance(fetch);
	const languageCode = lang === 'de' ? 'de' : 'en';

	const [regionRows, rateRows] = await Promise.all([
		directus.request(
			readItems('regions', {
				filter: { layer: { _in: ['country', 'union'] } },
				fields: ['id', 'code', 'slug', 'layer', 'translations.name'],
				deep: { translations: { _filter: { languages_code: { _eq: languageCode } } } },
				limit: -1
			})
		),
		directus.request(
			readItems('electrification_rates', {
				fields: ['period', 'category', 'value', 'region', 'update'],
				limit: -1
			})
		)
	]);

	const regions: ElectrificationRegion[] = (regionRows as any[]).map((r) => ({
		id: r.id,
		code: r.code,
		slug: r.slug,
		layer: r.layer,
		name: r.translations?.[0]?.name ?? r.code
	}));

	const points: ElectrificationPoint[] = (rateRows as any[])
		.filter((r) => r.region != null)
		.map((r) => ({
			regionId: r.region,
			category: r.category,
			year: new Date(r.period).getUTCFullYear(),
			value: r.value
		}));

	const years = Array.from(new Set(points.map((p) => p.year))).sort((a, b) => a - b);
	const latestYear = years[years.length - 1];
	const updateDate = (rateRows as any[])[0]?.update ?? new Date().toISOString().slice(0, 10);

	return { regions, points, years, latestYear, updateDate };
}

/** [year, value] pairs for a region/sector, sorted ascending, from `start` onward. */
export function seriesFor(
	dataset: ElectrificationDataset,
	regionId: string,
	category: string,
	start: number = DISPLAY_START
): [number, number][] {
	return dataset.points
		.filter((p) => p.regionId === regionId && p.category === category && p.year >= start)
		.sort((a, b) => a.year - b.year)
		.map((p) => [p.year, p.value]);
}

/** Value at a specific year for a region/sector, or null if missing. */
export function valueAt(
	dataset: ElectrificationDataset,
	regionId: string,
	category: string,
	year: number
): number | null {
	const hit = dataset.points.find(
		(p) => p.regionId === regionId && p.category === category && p.year === year
	);
	return hit ? hit.value : null;
}

/** Latest available value (at dataset.latestYear) for a region/sector, or null if missing. */
export function latestValue(
	dataset: ElectrificationDataset,
	regionId: string,
	category: string
): number | null {
	return valueAt(dataset, regionId, category, dataset.latestYear);
}

export function regionByCode(
	dataset: ElectrificationDataset,
	code: string
): ElectrificationRegion | undefined {
	return dataset.regions.find((r) => r.code === code);
}

// Formatting is locale-dependent (23.4% vs 23,4 %) and lives in electrification.i18n.ts —
// see `formatters(lang)`.
