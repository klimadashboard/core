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

// Hardcoded data (replace with Directus fetch later)
const hardcodedData: RenewableDataPoint[] = [
	{ year: 2023, pv: 172, wind: 169217, total: 169389 },
	{ year: 2024, pv: 12179, wind: 142175, total: 154354 },
	{ year: 2035, goal: 200000 }
];

/** Fetch renewable capacity data */
export async function fetchData(
	region: Region | null,
	params: RenewableCapacityParams
): Promise<{ data: RenewableDataPoint[]; updateDate: string }> {
	// TODO: Replace with Directus fetch
	// const directus = getDirectusInstance(fetch);
	// const regionId = region?.id || params.regionId;
	// const rawData = await directus.request(...);

	return {
		data: hardcodedData,
		updateDate: new Date().toISOString()
	};
}

/** Process data - separate actual data from goal */
export function processData(data: RenewableDataPoint[]): {
	actualData: RenewableDataPoint[];
	goalRow: RenewableDataPoint | null;
} {
	const actualData = data.filter((d) => d.total != null);
	const goalRow = data.find((d) => d.goal != null) ?? null;

	return { actualData, goalRow };
}

/** Calculate projection from last actual to goal */
export function calculateProjection(data: RenewableDataPoint[]): {
	startYear: number;
	startValue: number;
	endYear: number;
	endValue: number;
} | null {
	const { actualData, goalRow } = processData(data);

	if (actualData.length === 0 || !goalRow) return null;

	const lastActual = actualData[actualData.length - 1];

	return {
		startYear: lastActual.year,
		startValue: lastActual.total ?? 0,
		endYear: goalRow.year,
		endValue: goalRow.goal ?? 0
	};
}

/** Get table columns */
export function getTableColumns(unit: string): TableColumn[] {
	return [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'pv',
			label: `PV (${unit})`,
			align: 'right',
			format: (v) =>
				typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '–'
		},
		{
			key: 'wind',
			label: `Wind (${unit})`,
			align: 'right',
			format: (v) =>
				typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '–'
		},
		{
			key: 'total',
			label: `Gesamt (${unit})`,
			align: 'right',
			format: (v) =>
				typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '–'
		}
	];
}

/** Generate placeholders for titles/descriptions */
export function getPlaceholders(
	data: RenewableDataPoint[],
	region: Region | null,
	unit: string = 'GWh'
): Record<string, string | number> {
	const { actualData, goalRow } = processData(data);

	if (actualData.length === 0) {
		return {
			regionName: region?.name || 'Region',
			unit,
			latestYear: 0,
			latestTotal: 0,
			latestPV: 0,
			latestWind: 0,
			goalYear: goalRow?.year ?? goalConfig.endYear,
			goalValue: goalRow?.goal ?? goalConfig.targetValue,
			growthNeeded: 0,
			growthPercent: 0,
			avgAnnualGrowth: 0,
			dominantSource: 'wind',
			dominantSourceLabel: 'Wind',
			dominantSourceValue: 0,
			dataYearStart: 0,
			dataYearEnd: 0
		};
	}

	const years = actualData.map((d) => d.year).sort((a, b) => a - b);
	const lastActual = actualData[actualData.length - 1];

	const latestYear = lastActual.year;
	const latestTotal = lastActual.total ?? 0;
	const latestPV = lastActual.pv ?? 0;
	const latestWind = lastActual.wind ?? 0;
	const goalYear = goalRow?.year ?? goalConfig.endYear;
	const goalValue = goalRow?.goal ?? goalConfig.targetValue;

	// Calculate growth metrics
	const growthNeeded = goalValue - latestTotal;
	const growthPercent = latestTotal > 0 ? ((goalValue - latestTotal) / latestTotal) * 100 : 0;
	const yearsToGoal = goalYear - latestYear;
	const avgAnnualGrowth = yearsToGoal > 0 ? growthNeeded / yearsToGoal : 0;

	// Determine dominant source
	const dominantSource: SourceCategory = latestPV >= latestWind ? 'pv' : 'wind';
	const dominantSourceLabel = categoryMeta[dominantSource].label;
	const dominantSourceValue = dominantSource === 'pv' ? latestPV : latestWind;

	return {
		regionName: region?.name || 'Region',
		unit,
		latestYear,
		latestTotal,
		latestPV,
		latestWind,
		goalYear,
		goalValue,
		growthNeeded,
		growthPercent,
		avgAnnualGrowth,
		dominantSource,
		dominantSourceLabel,
		dominantSourceValue,
		dataYearStart: years[0],
		dataYearEnd: latestYear
	};
}

/** Generate dynamic title */
export function generateTitle(placeholders: Record<string, string | number>): string {
	const { latestYear, latestTotal, goalYear, goalValue, unit } = placeholders;
	const formattedTotal = Number(latestTotal).toLocaleString('de-DE');
	const formattedGoal = Number(goalValue).toLocaleString('de-DE');
	return `Erneuerbare Kapazität erreichte ${formattedTotal} ${unit} in ${latestYear}, Ziel: ${formattedGoal} ${unit} bis ${goalYear}`;
}

/** Generate dynamic subtitle */
export function generateSubtitle(placeholders: Record<string, string | number>): string {
	const {
		growthNeeded,
		growthPercent,
		avgAnnualGrowth,
		dominantSourceLabel,
		dominantSourceValue,
		unit,
		goalYear,
		latestYear
	} = placeholders;

	const years = Number(goalYear) - Number(latestYear);
	const formattedDominant = Number(dominantSourceValue).toLocaleString('de-DE');
	const formattedGrowth = Number(growthNeeded).toLocaleString('de-DE', {
		maximumFractionDigits: 0
	});
	const formattedAvg = Number(avgAnnualGrowth).toLocaleString('de-DE', {
		maximumFractionDigits: 0
	});

	return `${dominantSourceLabel} führt mit ${formattedDominant} ${unit}. Um das Ziel ${goalYear} zu erreichen, müssen ${formattedGrowth} ${unit} zugebaut werden (${Number(growthPercent).toFixed(0)}% Steigerung), durchschnittlich ${formattedAvg} ${unit}/Jahr über ${years} Jahre.`;
}

/** Build ChartData object for Card integration */
export function buildChartData(
	data: RenewableDataPoint[],
	updateDate: string,
	region: Region | null,
	unit: string = 'GWh'
): ChartData {
	const { actualData, goalRow } = processData(data);

	// Add goal row to table if exists
	const tableRows = [
		...actualData,
		...(goalRow
			? [{ year: goalRow.year, pv: null, wind: null, total: goalRow.goal, isGoal: true }]
			: [])
	];

	return {
		raw: data,
		table: {
			columns: getTableColumns(unit),
			rows: tableRows,
			filename: 'renewable_capacity'
		},
		placeholders: getPlaceholders(data, region, unit),
		meta: {
			updateDate,
			source: 'Erneuerbare Energien Statistik',
			region
		}
	};
}
