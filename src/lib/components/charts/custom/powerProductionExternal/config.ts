// $lib/components/charts/custom/powerProductionExternal/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';

export interface PowerProductionParams {
	regionId?: string;
}

export interface PowerProductionDataPoint {
	year: number;
	pv: number;
	wind: number;
	total: number;
}

// Raw API response type
interface ApiRecord {
	region: string;
	country: string;
	period: string;
	category: string;
	value: number;
	source?: string;
}

// Category definitions
export const sourceCategories = ['pv', 'wind'] as const;
export type SourceCategory = (typeof sourceCategories)[number];

export const categoryMeta: Record<string, { label: string; icon: string }> = {
	pv: { label: 'PV', icon: '☀️' },
	wind: { label: 'Wind', icon: '💨' }
};

export const categoryColors: Record<string, string> = {
	pv: '#EAB308',
	wind: '#38BDF8',
	total: '#111827',
	projected: '#D1D5DB'
};

// Conversion factor: kWh to GWh
const KWH_TO_GWH = 1_000_000;

/** Convert kWh to GWh */
export function toGWh(kWh: number | undefined | null): number {
	if (kWh == null) return 0;
	return kWh / KWH_TO_GWH;
}

/** Format number for display (German locale) */
export function formatGWh(value: number): string {
	return value.toLocaleString('de-DE', { maximumFractionDigits: 1 });
}

/** Fetch power production data from Directus */
export async function fetchData(
	region: Region | null,
	params: PowerProductionParams
): Promise<{ data: PowerProductionDataPoint[]; updateDate: string; source: string }> {
	const regionId = region?.id;

	if (!regionId) {
		return { data: [], updateDate: new Date().toISOString(), source: '' };
	}

	const url = `https://base.klimadashboard.org/items/power_production_external?filter[region][_eq]=${encodeURIComponent(regionId)}&sort=period`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch power production data: ${response.status}`);
	}

	const result = await response.json();
	const records: ApiRecord[] = result.data || [];

	if (records.length === 0) {
		return { data: [], updateDate: new Date().toISOString(), source: '' };
	}

	// Group by period (year)
	const byYear = new Map<number, { pv: number; wind: number }>();

	for (const record of records) {
		const year = parseInt(record.period, 10);
		if (isNaN(year)) continue;

		if (!byYear.has(year)) {
			byYear.set(year, { pv: 0, wind: 0 });
		}

		const yearData = byYear.get(year)!;
		if (record.category === 'pv') {
			yearData.pv += record.value;
		} else if (record.category === 'wind') {
			yearData.wind += record.value;
		}
	}

	// Convert to array and calculate totals
	const data: PowerProductionDataPoint[] = Array.from(byYear.entries())
		.map(([year, values]) => ({
			year,
			pv: values.pv,
			wind: values.wind,
			total: values.pv + values.wind
		}))
		.sort((a, b) => a.year - b.year);

	// Get source and update date from first record
	const source = records[0]?.source || '';
	const latestPeriod = records.reduce((max, r) => {
		const year = parseInt(r.period, 10);
		return year > max ? year : max;
	}, 0);
	const updateDate = new Date(latestPeriod, 11, 31).toISOString();

	return { data, updateDate, source };
}

/** Process data - convert to GWh for display */
export function processData(data: PowerProductionDataPoint[]): {
	dataGWh: Array<{ year: number; pv: number; wind: number; total: number }>;
} {
	// Convert to GWh for display
	const dataGWh = data.map((d) => ({
		year: d.year,
		pv: toGWh(d.pv),
		wind: toGWh(d.wind),
		total: toGWh(d.total)
	}));

	return { dataGWh };
}

/** Get table columns */
export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'pv',
			label: 'PV (GWh)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? formatGWh(v) : '–')
		},
		{
			key: 'wind',
			label: 'Wind (GWh)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? formatGWh(v) : '–')
		},
		{
			key: 'total',
			label: 'Gesamt (GWh)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? formatGWh(v) : '–')
		}
	];
}

/** Generate placeholders for titles/descriptions */
export function getPlaceholders(
	data: PowerProductionDataPoint[],
	region: Region | null
): Record<string, string | number | boolean | null> {
	const { dataGWh } = processData(data);

	if (dataGWh.length === 0) {
		return {
			regionName: region?.name || 'Region',
			unit: 'GWh',
			latestYear: 0,
			latestTotal: '0',
			latestTotalRaw: 0,
			latestPV: '0',
			latestPVRaw: 0,
			latestWind: '0',
			latestWindRaw: 0,
			dominantSource: 'wind',
			dominantSourceLabel: 'Wind',
			dominantSourceValue: '0',
			dominantSourceValueRaw: 0,
			dataYearStart: 0,
			dataYearEnd: 0
		};
	}

	const years = dataGWh.map((d: { year: number }) => d.year).sort((a: number, b: number) => a - b);
	const lastActual = dataGWh[dataGWh.length - 1];

	const latestYear = lastActual.year;
	const latestTotal = lastActual.total;
	const latestPV = lastActual.pv;
	const latestWind = lastActual.wind;

	// Determine dominant source
	const dominantSource: SourceCategory = latestPV >= latestWind ? 'pv' : 'wind';
	const dominantSourceLabel = categoryMeta[dominantSource].label;
	const dominantSourceValue = dominantSource === 'pv' ? latestPV : latestWind;

	return {
		regionName: region?.name || 'Region',
		unit: 'GWh',
		latestYear,
		latestTotal: formatGWh(latestTotal),
		latestTotalRaw: latestTotal,
		latestPV: formatGWh(latestPV),
		latestPVRaw: latestPV,
		latestWind: formatGWh(latestWind),
		latestWindRaw: latestWind,
		dominantSource,
		dominantSourceLabel,
		dominantSourceValue: formatGWh(dominantSourceValue),
		dominantSourceValueRaw: dominantSourceValue,
		dataYearStart: years[0],
		dataYearEnd: latestYear
	};
}

/** Generate dynamic title */
export function generateTitle(
	placeholders: Record<string, string | number | boolean | null>
): string {
	const { latestYear, latestTotal } = placeholders;
	return `Erneuerbare Produktion erreichte ${latestTotal} GWh in ${latestYear}`;
}

/** Generate dynamic subtitle */
export function generateSubtitle(
	placeholders: Record<string, string | number | boolean | null>
): string {
	const { dominantSourceLabel, dominantSourceValue } = placeholders;
	return `${dominantSourceLabel} führt mit ${dominantSourceValue} GWh.`;
}

/** Build ChartData object for Card integration */
export function buildChartData(
	data: PowerProductionDataPoint[],
	updateDate: string,
	region: Region | null,
	source: string
): ChartData {
	const { dataGWh } = processData(data);

	return {
		raw: data,
		table: {
			columns: getTableColumns(),
			rows: dataGWh,
			filename: 'power_production_external'
		},
		placeholders: getPlaceholders(data, region),
		meta: {
			updateDate,
			source: source || 'Stadtwerke',
			region
		},
		hasData: data.length > 0
	};
}

export async function fetchChartData({
	regionId
}: ChartFetchParams): Promise<ChartData | null> {
	if (!regionId) return null;

	const region = { id: regionId, name: '' } as Region;
	const { data, updateDate, source } = await fetchData(region, {});
	if (!data || data.length === 0) return null;

	return buildChartData(data, updateDate, region, source);
}
