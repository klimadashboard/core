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
export const SOURCE = 'Eurostat, Complete energy balances (nrg_bal_c)';

/** Countries with very small or distorted energy bases — dimmed + footnoted in charts. */
export const SMALL_COUNTRY_CODES = ['mt', 'cy', 'lu'];
export const SMALL_COUNTRY_NOTE =
	'* Malta, Cyprus, Luxembourg have very small or distorted energy bases.';

/** Charts default to this start year; early-1990s data is unreliable for several states. */
export const DISPLAY_START = 2000;

/** Proposed EU electrification targets, sorted by year. Value is a percentage (0-100). */
export const TARGETS = [
	{ year: 2030, value: 32 },
	{ year: 2040, value: 50 }
];

export interface SectorDef {
	key: string;
	label: string;
	short: string;
	color: string;
}

/** Sub-sectors of total final consumption. Colors reuse Klimadashboard's semantic sector palette
 *  where a direct match exists (industry, buildings, transport); "services" has no house
 *  equivalent so it borrows a ColorBrewer blue step per the multi-series guidance. */
export const SECTORS: SectorDef[] = [
	{ key: 'industry', label: 'Industry', short: 'Industry', color: '#373949' },
	{ key: 'residential', label: 'Residential buildings', short: 'Residential', color: '#4880A8' },
	{ key: 'services', label: 'Commercial & services', short: 'Services', color: '#2171B5' },
	{ key: 'transport', label: 'Transport', short: 'Transport', color: '#F5AF4A' }
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

export async function fetchElectrificationDataset(
	fetch: typeof globalThis.fetch
): Promise<ElectrificationDataset> {
	const directus = getDirectusInstance(fetch);

	const [regionRows, rateRows] = await Promise.all([
		directus.request(
			readItems('regions', {
				filter: { layer: { _in: ['country', 'union'] } },
				fields: ['id', 'code', 'slug', 'layer', 'translations.name'],
				deep: { translations: { _filter: { languages_code: { _eq: 'en' } } } },
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

// ---------------------------------------------------------------------------
// English-only formatting (no de-DE locale — this tracker ships English-only for now)
// ---------------------------------------------------------------------------

export function fmtPct(value: number, digits = 0): string {
	if (value == null || isNaN(value)) return '–';
	return `${value.toFixed(digits)}%`;
}

export function fmtPP(value: number, digits = 1): string {
	if (value == null || isNaN(value)) return '–';
	return `${value.toFixed(digits)}pp`;
}

/** Signed gap in percentage points, e.g. "+4.2pp" / "−8.6pp". */
export function fmtSignedPP(value: number, digits = 1): string {
	if (value == null || isNaN(value)) return '–';
	return (value >= 0 ? '+' : '−') + fmtPP(Math.abs(value), digits);
}
