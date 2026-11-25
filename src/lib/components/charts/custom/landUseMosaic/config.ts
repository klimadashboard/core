import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { formatNumber, formatPercent } from '$lib/utils/formatters';
import getDirectusInstance from '$lib/utils/directus';
import { isSubnationalRegion } from '$lib/utils/regionAggregation';
import { readItem } from '@directus/sdk';

/** Integriertes Umweltprogramm 2030 des Bundesumweltministeriums: 20 ha pro Tag bis 2030 */
export const TARGET_2030_HA_PER_DAY = 20;
/** Football pitch of standard size (105 × 68 m), in ha */
export const FOOTBALL_PITCH_HA = (105 * 68) / 10_000;

export const USES = [
	{ key: 'industry', name: 'Industrie und Gewerbe', color: '#E0832F' },
	{ key: 'residential', name: 'Wohnen', color: '#DD5878' },
	{ key: 'other', name: 'Übrige Nutzungen', color: '#1FA9BB' }
] as const;
export type UseKey = (typeof USES)[number]['key'];

export interface LandUsePart {
	id: string;
	name: string;
	layer: string;
	residential: number;
	industry: number;
	/** All other settlement uses (without mining) plus transport */
	other: number;
	/** Net increase of the Siedlungs- und Verkehrsfläche */
	suv: number;
}

export interface LandUseMosaicData {
	regionName: string;
	regionLayer: string;
	year: string;
	previousYear: string;
	/** All years that can be shown, ascending */
	years: string[];
	parts: LandUsePart[];
	/** Net increase of the whole region, in ha */
	net: number;
	/** Days between the two year ends (365 or 366), to express values per day */
	days: number;
	/** Region's share of the 20 ha target for the same number of days, in ha */
	target2030: number | null;
	notes: string[];
	source: string;
}

/** What the parts of a region are called, by the layer of the parts */
export const PART_LABELS: Record<string, string> = {
	state: 'Bundesländer',
	district: 'Kreise',
	municipality: 'Gemeinden'
};

export async function fetchData(
	region: Region | null,
	fetch: typeof globalThis.fetch = globalThis.fetch,
	/** A specific year; the latest one if omitted */
	year?: string | null
): Promise<LandUseMosaicData | null> {
	const params = new URLSearchParams();
	if (isSubnationalRegion(region)) params.set('region', region!.id);
	if (year) params.set('year', year);
	const res = await fetch(`/api/land-use/uses${params.size ? `?${params}` : ''}`);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Flächendaten konnten nicht geladen werden (${res.status})`);
	const json = await res.json();

	const parts: LandUsePart[] = json.children ?? [];
	const share =
		json.region?.population && json.germany?.population
			? json.region.population / json.germany.population
			: null;
	return {
		regionName: json.region?.name ?? region?.name ?? 'Deutschland',
		regionLayer: json.region?.layer ?? 'country',
		year: json.year,
		previousYear: json.previousYear,
		years: json.years ?? [json.year],
		parts,
		net: parts.reduce((a, p) => a + p.suv, 0),
		days: json.days,
		target2030: share != null ? TARGET_2030_HA_PER_DAY * share * json.days : null,
		notes: json.notes ?? [],
		source: json.source
	};
}

export function getTableColumns(): TableColumn[] {
	const ha = (v: number) => formatNumber(v);
	return [
		{ key: 'name', label: 'Region', align: 'left' },
		{ key: 'industry', label: 'Industrie und Gewerbe (ha)', align: 'right', format: ha },
		{ key: 'residential', label: 'Wohnen (ha)', align: 'right', format: ha },
		{ key: 'other', label: 'Übrige Nutzungen (ha)', align: 'right', format: ha },
		{ key: 'suv', label: 'Zuwachs gesamt (ha)', align: 'right', format: ha }
	];
}

export function getPlaceholders(data: LandUseMosaicData): Record<string, string | number> {
	const sum = (k: UseKey) => data.parts.reduce((a, p) => a + Math.max(0, p[k]), 0);
	const gross = USES.reduce((a, u) => a + sum(u.key), 0);
	const top = [...USES].sort((a, b) => sum(b.key) - sum(a.key))[0];
	const net = formatNumber(data.net);
	// Whole heading sentence, so it reads right when there was no net increase or the target is met
	const summary =
		data.net <= 0
			? `${data.year} ist die Siedlungs- und Verkehrsfläche netto nicht gewachsen (${net} Hektar).`
			: data.target2030 == null
				? `${data.year} kamen ${net} Hektar hinzu.`
				: data.net <= data.target2030
					? `${data.year} kamen ${net} Hektar hinzu – das 2030-Ziel ist eingehalten.`
					: `${data.year} kamen ${net} Hektar hinzu – ${formatNumber(data.net / data.target2030, 1)}-mal so viel, wie das 2030-Ziel erlaubt.`;
	return {
		summary,
		regionName: data.regionName,
		year: data.year,
		net: formatNumber(data.net),
		pitches: formatNumber(data.net / FOOTBALL_PITCH_HA),
		target2030: data.target2030 != null ? formatNumber(data.target2030) : '–',
		targetFactor: data.target2030 ? formatNumber(data.net / data.target2030, 1) : '–',
		topUse: top.name,
		topUseShare: gross ? formatPercent((sum(top.key) / gross) * 100, 0) : '–'
	};
}

export function buildChartData(data: LandUseMosaicData, region: Region | null): ChartData {
	const rows = [...data.parts].sort((a, b) => b.suv - a.suv);
	return {
		raw: rows,
		table: {
			columns: getTableColumns(),
			rows,
			filename: `flaechenzuwachs-nach-nutzung-${data.regionName}-${data.year}`
		},
		placeholders: getPlaceholders(data),
		meta: { source: data.source, region }
	};
}

export async function fetchChartData({
	fetch,
	regionId
}: ChartFetchParams): Promise<ChartData | null> {
	const region = regionId
		? ((await getDirectusInstance(fetch).request(
				readItem('regions', regionId, { fields: ['id', 'name', 'layer'] })
			)) as Region)
		: null;
	const data = await fetchData(region, fetch);
	return data ? buildChartData(data, region) : null;
}
