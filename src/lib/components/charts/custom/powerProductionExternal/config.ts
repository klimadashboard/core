// $lib/components/charts/custom/renewableCapacity/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';

export interface RenewableCapacityParams {
	regionId?: string;
}

export interface RenewableDataPoint {
	year: number;
	pv?: number;
	wind?: number;
	total?: number;
	goal?: number;
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

// Goal configuration
export const goalConfig = {
	endYear: 2035,
	targetValue: 200000
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

// Hardcoded data in kWh (will be converted to GWh for display)
const hardcodedData: RenewableDataPoint[] = [
	{ year: 2019, pv: 0, wind: 154662873, total: 154662873 },
	{ year: 2020, pv: 0, wind: 155892735, total: 155892735 },
	{ year: 2021, pv: 0, wind: 126012387, total: 126012387 },
	{ year: 2022, pv: 0, wind: 139698965, total: 139698965 },
	{ year: 2023, pv: 172212, wind: 169217145, total: 169389357 },
	{ year: 2024, pv: 12179040, wind: 142175660, total: 154354700 },
	{ year: 2035, goal: 1300000000 }
];

/** Fetch renewable capacity data */
export async function fetchData(
	region: Region | null,
	params: RenewableCapacityParams
): Promise<{ data: RenewableDataPoint[]; updateDate: string }> {
	// TODO: Replace with Directus fetch
	return {
		data: hardcodedData,
		updateDate: new Date().toISOString()
	};
}

/** Process data - separate actual data from goal, convert to GWh */
export function processData(data: RenewableDataPoint[]): {
	actualData: RenewableDataPoint[];
	goalRow: RenewableDataPoint | null;
	actualDataGWh: Array<{ year: number; pv: number; wind: number; total: number }>;
	goalValueGWh: number;
} {
	const actualData = data.filter((d) => d.total != null);
	const goalRow = data.find((d) => d.goal != null) ?? null;

	// Convert to GWh for display
	const actualDataGWh = actualData.map((d) => ({
		year: d.year,
		pv: toGWh(d.pv),
		wind: toGWh(d.wind),
		total: toGWh(d.total)
	}));

	const goalValueGWh = toGWh(goalRow?.goal);

	return { actualData, goalRow, actualDataGWh, goalValueGWh };
}

/** Calculate projection from last actual to goal */
export function calculateProjection(data: RenewableDataPoint[]): {
	startYear: number;
	startValue: number;
	endYear: number;
	endValue: number;
} | null {
	const { actualDataGWh, goalRow, goalValueGWh } = processData(data);

	if (actualDataGWh.length === 0 || !goalRow) return null;

	const lastActual = actualDataGWh[actualDataGWh.length - 1];

	return {
		startYear: lastActual.year,
		startValue: lastActual.total,
		endYear: goalRow.year,
		endValue: goalValueGWh
	};
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
	data: RenewableDataPoint[],
	region: Region | null
): Record<string, string | number> {
	const { actualDataGWh, goalRow, goalValueGWh } = processData(data);

	if (actualDataGWh.length === 0) {
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
			goalYear: goalRow?.year ?? goalConfig.endYear,
			goalValue: formatGWh(goalValueGWh),
			goalValueRaw: goalValueGWh,
			growthNeeded: '0',
			growthNeededRaw: 0,
			growthPercent: '0',
			growthPercentRaw: 0,
			avgAnnualGrowth: '0',
			avgAnnualGrowthRaw: 0,
			dominantSource: 'wind',
			dominantSourceLabel: 'Wind',
			dominantSourceValue: '0',
			dominantSourceValueRaw: 0,
			dataYearStart: 0,
			dataYearEnd: 0
		};
	}

	const years = actualDataGWh.map((d) => d.year).sort((a, b) => a - b);
	const lastActual = actualDataGWh[actualDataGWh.length - 1];

	const latestYear = lastActual.year;
	const latestTotal = lastActual.total;
	const latestPV = lastActual.pv;
	const latestWind = lastActual.wind;
	const goalYear = goalRow?.year ?? goalConfig.endYear;

	// Calculate growth metrics (all in GWh)
	const growthNeeded = goalValueGWh - latestTotal;
	const growthPercent = latestTotal > 0 ? ((goalValueGWh - latestTotal) / latestTotal) * 100 : 0;
	const yearsToGoal = goalYear - latestYear;
	const avgAnnualGrowth = yearsToGoal > 0 ? growthNeeded / yearsToGoal : 0;

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
		goalYear,
		goalValue: formatGWh(goalValueGWh),
		goalValueRaw: goalValueGWh,
		growthNeeded: formatGWh(growthNeeded),
		growthNeededRaw: growthNeeded,
		growthPercent: growthPercent.toFixed(0),
		growthPercentRaw: growthPercent,
		avgAnnualGrowth: formatGWh(avgAnnualGrowth),
		avgAnnualGrowthRaw: avgAnnualGrowth,
		dominantSource,
		dominantSourceLabel,
		dominantSourceValue: formatGWh(dominantSourceValue),
		dominantSourceValueRaw: dominantSourceValue,
		dataYearStart: years[0],
		dataYearEnd: latestYear
	};
}

/** Generate dynamic title */
export function generateTitle(placeholders: Record<string, string | number>): string {
	const { latestYear, latestTotal, goalYear, goalValue } = placeholders;
	return `Erneuerbare Kapazität erreichte ${latestTotal} GWh in ${latestYear}, Ziel: ${goalValue} GWh bis ${goalYear}`;
}

/** Generate dynamic subtitle */
export function generateSubtitle(placeholders: Record<string, string | number>): string {
	const {
		growthNeeded,
		growthPercent,
		avgAnnualGrowth,
		dominantSourceLabel,
		dominantSourceValue,
		goalYear,
		latestYear
	} = placeholders;

	const years = Number(goalYear) - Number(latestYear);

	return `${dominantSourceLabel} führt mit ${dominantSourceValue} GWh. Um das Ziel ${goalYear} zu erreichen, müssen ${growthNeeded} GWh zugebaut werden (${growthPercent}% Steigerung), durchschnittlich ${avgAnnualGrowth} GWh/Jahr über ${years} Jahre.`;
}

/** Build ChartData object for Card integration */
export function buildChartData(
	data: RenewableDataPoint[],
	updateDate: string,
	region: Region | null
): ChartData {
	const { actualDataGWh, goalRow, goalValueGWh } = processData(data);

	// Table rows in GWh
	const tableRows = [
		...actualDataGWh,
		...(goalRow
			? [
					{
						year: goalRow.year,
						pv: null as number | null,
						wind: null as number | null,
						total: goalValueGWh
					}
				]
			: [])
	];

	return {
		raw: data,
		table: {
			columns: getTableColumns(),
			rows: tableRows,
			filename: 'renewable_capacity'
		},
		placeholders: getPlaceholders(data, region),
		meta: {
			updateDate,
			source: 'Stadtwerke',
			region
		}
	};
}
