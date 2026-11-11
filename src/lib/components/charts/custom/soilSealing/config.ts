import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { formatNumber, formatPercent } from '$lib/utils/formatters';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';

/** Deutsche Nachhaltigkeitsstrategie: Flächenneuinanspruchnahme unter 30 ha pro Tag bis 2030 */
export const NATIONAL_TARGET_HA_PER_DAY = 30;

/** Integriertes Umweltprogramm 2030 des Bundesumweltministeriums: 20 ha pro Tag bis 2030 */
export const NATIONAL_TARGET_2030_HA_PER_DAY = 20;

/** Football pitch of standard size (105 × 68 m), in ha — for an everyday comparison */
export const FOOTBALL_PITCH_HA = (105 * 68) / 10_000;

/** Number of football pitches: one decimal below 10, whole numbers above */
export const formatPitches = (n: number) => formatNumber(n, n < 10 ? 1 : 0);

interface LandUseYear {
	period: string;
	settlement: number;
	transport: number;
	suv: number;
	total: number;
}

export interface SoilSealingYear {
	period: string;
	/** Siedlungs- und Verkehrsfläche at the end of the year, in ha */
	suv: number;
	/** Increase over the previous year, in ha (null for the first year) */
	added: number | null;
	/** Increase per day, in ha (null for the first year) */
	perDay: number | null;
	/** Set when the change in this year is distorted by a known data correction */
	breakNote: string | null;
}

export interface SoilSealingRawData {
	regionName: string;
	series: SoilSealingYear[];
	latest: SoilSealingYear;
	/** Share of the region's total area that is Siedlungs- und Verkehrsfläche, in % */
	suvShare: number;
	/** Mean increase per day over the whole series, in ha */
	averagePerDay: number;
	firstYear: string;
	/** Region's share of the 30 ha target, by population, in ha per day */
	target: number | null;
	/** Region's share of the 20 ha target for 2030, by population, in ha per day */
	target2030: number | null;
	populationShare: number | null;
	source: string;
}

const daysInYear = (year: number) => ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365);

export async function fetchData(
	region: Region | null,
	fetch: typeof globalThis.fetch = globalThis.fetch
): Promise<SoilSealingRawData | null> {
	const params = region && region.layer !== 'country' ? `?region=${region.id}` : '';
	const res = await fetch(`/api/land-use${params}`);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Flächendaten konnten nicht geladen werden (${res.status})`);
	const json = await res.json();

	const rows: LandUseYear[] = json.series ?? [];
	if (rows.length < 2) return null;
	const breaks: { period: string; note: string }[] = json.breaks ?? [];

	const series: SoilSealingYear[] = rows.map((d, i) => {
		const added = i > 0 ? d.suv - rows[i - 1].suv : null;
		return {
			period: d.period,
			suv: d.suv,
			added,
			perDay: added != null ? added / daysInYear(Number(d.period)) : null,
			breakNote: (i > 0 && breaks.find((b) => b.period === d.period)?.note) || null
		};
	});

	const first = rows[0];
	const last = rows.at(-1)!;
	let days = 0;
	for (let y = Number(first.period) + 1; y <= Number(last.period); y++) days += daysInYear(y);

	const population = json.region?.population;
	const germanPopulation = json.germany?.population;
	const populationShare = population && germanPopulation ? population / germanPopulation : null;

	return {
		regionName: json.region?.name ?? region?.name ?? 'Deutschland',
		series,
		latest: series.at(-1)!,
		suvShare: (last.suv / last.total) * 100,
		averagePerDay: (last.suv - first.suv) / days,
		firstYear: first.period,
		target: populationShare != null ? NATIONAL_TARGET_HA_PER_DAY * populationShare : null,
		target2030: populationShare != null ? NATIONAL_TARGET_2030_HA_PER_DAY * populationShare : null,
		populationShare,
		source: json.source
	};
}

export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'period', label: 'Jahr', align: 'left' },
		{ key: 'suv', label: 'Siedlungs- und Verkehrsfläche (ha)', align: 'right', format: (v) => formatNumber(v) },
		{ key: 'added', label: 'Zuwachs (ha)', align: 'right', format: (v) => (v == null ? '–' : formatNumber(v)) },
		{ key: 'perDay', label: 'Zuwachs pro Tag (ha)', align: 'right', format: (v) => (v == null ? '–' : formatNumber(v, 1)) },
		{ key: 'breakNote', label: 'Hinweis', align: 'left', format: (v) => (v ? 'Datenkorrektur, nicht vergleichbar' : '') }
	];
}

export function getPlaceholders(data: SoilSealingRawData): Record<string, string | number> {
	return {
		regionName: data.regionName,
		year: data.latest.period,
		firstYear: data.firstYear,
		perDay: data.latest.perDay != null ? formatNumber(data.latest.perDay, 1) : '–',
		pitchesPerDay:
			data.latest.perDay != null ? formatPitches(data.latest.perDay / FOOTBALL_PITCH_HA) : '–',
		pitchesPerYear:
			data.latest.added != null ? formatNumber(data.latest.added / FOOTBALL_PITCH_HA, 0) : '–',
		averagePerDay: formatNumber(data.averagePerDay, 1),
		target: data.target != null ? formatNumber(data.target, 1) : '–',
		targetFactor: data.target ? formatNumber(data.averagePerDay / data.target, 1) : '–',
		target2030: data.target2030 != null ? formatNumber(data.target2030, 1) : '–',
		populationShare: data.populationShare != null ? formatPercent(data.populationShare * 100, 1) : '–',
		suv: formatNumber(data.latest.suv),
		suvShare: formatPercent(data.suvShare, 1)
	};
}

export function buildChartData(data: SoilSealingRawData, region: Region | null): ChartData {
	return {
		hasData: data.series.length > 0,
		raw: data.series,
		table: {
			columns: getTableColumns(),
			rows: data.series,
			filename: `siedlungs-und-verkehrsflaeche-${data.regionName}`
		},
		placeholders: getPlaceholders(data),
		meta: {
			source: data.source,
			region
		}
	};
}

export async function fetchChartData({ fetch, regionId }: ChartFetchParams): Promise<ChartData | null> {
	const region = regionId
		? ((await getDirectusInstance(fetch).request(
				readItem('regions', regionId, { fields: ['id', 'code', 'name', 'layer', 'country'] })
			)) as Region)
		: null;
	const data = await fetchData(region, fetch);
	return data ? buildChartData(data, region) : null;
}
