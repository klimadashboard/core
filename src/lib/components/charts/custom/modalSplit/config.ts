// $lib/components/charts/custom/mobilityModalSplit/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

export interface ModalSplitParams {
	regionId?: string;
}

export interface ModalSplitRawData {
	year: number;
	category: string;
	value: number;
	region?: string;
}

// Category definitions
export const renewableCategories = ['on_foot', 'bicycle', 'e_bike', 'public_transport'];
export const nonRenewableCategories = ['motorbike', 'car_driver', 'car_passenger'];

export const categoryMeta: Record<string, { label: string; icon: string; renewable: boolean }> = {
	on_foot: { label: 'Zu Fuß', icon: '🚶', renewable: true },
	bicycle: { label: 'Fahrrad', icon: '🚲', renewable: true },
	e_bike: { label: 'E-Bike', icon: '🚴', renewable: true },
	public_transport: { label: 'ÖPNV', icon: '🚌', renewable: true },
	motorbike: { label: 'Motorrad', icon: '🏍️', renewable: false },
	car_driver: { label: 'Auto (Fahrer)', icon: '🚗', renewable: false },
	car_passenger: { label: 'Auto (Mitfahrer)', icon: '🚙', renewable: false }
};

export const categoryColors: Record<string, string> = {
	on_foot: '#15803d',
	bicycle: '#22c55e',
	e_bike: '#4ade80',
	public_transport: '#0ea5e9',
	motorbike: '#f97316',
	car_driver: '#ef4444',
	car_passenger: '#b91c1c'
};

export const ghostColors = {
	renewable: '#4ade80',
	nonRenewable: '#ef4444'
};

// Goal configuration
export const goalConfig = {
	startYear: 2024,
	endYear: 2035,
	targetRenewablePercent: 62
};

/** Fetch modal split data from Directus */
export async function fetchData(
	region: Region | null,
	params: ModalSplitParams
): Promise<{ data: ModalSplitRawData[]; updateDate: string }> {
	const directus = getDirectusInstance(fetch);
	const regionId = region?.id || params.regionId;

	const rawData = await directus.request(
		readItems('mobility_modal_split', {
			filter: regionId ? { region: { _eq: regionId } } : undefined,
			sort: ['year', 'category'],
			fields: ['year', 'category', 'region', 'value'],
			limit: -1
		})
	);

	// Clean and convert data
	const data = (rawData as any[])
		.map((r) => ({
			year: typeof r.year === 'string' ? Number(r.year) : r.year,
			category: r.category,
			value: typeof r.value === 'string' ? Number(r.value) : r.value,
			region: r.region
		}))
		.filter((r) => !isNaN(r.year) && !isNaN(r.value));

	return {
		data,
		updateDate: new Date().toISOString()
	};
}

/** Process data for stacked bars - renewables at bottom, then non-renewables */
export function processHistoricData(data: ModalSplitRawData[]): ModalSplitRawData[] {
	const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
	const result: ModalSplitRawData[] = [];

	for (const year of years) {
		const yearRows = data.filter((d) => d.year === year);

		// Add renewables first (bottom of stack)
		for (const cat of renewableCategories) {
			const entry = yearRows.find((d) => d.category === cat);
			if (entry) {
				result.push({ year, category: cat, value: entry.value });
			}
		}

		// Then non-renewables (top of stack)
		for (const cat of nonRenewableCategories) {
			const entry = yearRows.find((d) => d.category === cat);
			if (entry) {
				result.push({ year, category: cat, value: entry.value });
			}
		}
	}

	return result;
}

/** Calculate ghost/goal projection bars */
export function calculateGhostRows(data: ModalSplitRawData[]): ModalSplitRawData[] {
	const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
	const { startYear, endYear, targetRenewablePercent } = goalConfig;

	// Find baseline year
	const baselineYear =
		years.filter((y) => y <= startYear).sort((a, b) => b - a)[0] || years[years.length - 1];

	if (!baselineYear) return [];

	// Calculate baseline renewable share
	const baseRows = data.filter((d) => d.year === baselineYear);
	const total = baseRows.reduce((sum, d) => sum + d.value, 0);
	const renewable = baseRows
		.filter((d) => renewableCategories.includes(d.category))
		.reduce((sum, d) => sum + d.value, 0);

	const baselineRenewableShare = total ? (renewable / total) * 100 : 0;

	// Generate future years
	const futureYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

	const result: ModalSplitRawData[] = [];

	for (const y of futureYears) {
		const t = (y - startYear) / (endYear - startYear);
		const renewableShare =
			baselineRenewableShare + t * (targetRenewablePercent - baselineRenewableShare);
		const nonRenewableShare = 100 - renewableShare;

		result.push({ year: y, category: 'renewable_target', value: renewableShare });
		result.push({ year: y, category: 'non_renewable_target', value: nonRenewableShare });
	}

	return result;
}

/** Calculate label positions (midpoint of each stacked segment) */
export function calculateLabelRows(
	historicRows: ModalSplitRawData[]
): Array<ModalSplitRawData & { yMid: number }> {
	const result: Array<ModalSplitRawData & { yMid: number }> = [];
	let currentYear: number | null = null;
	let acc = 0;

	for (const row of historicRows) {
		if (row.year !== currentYear) {
			currentYear = row.year;
			acc = 0;
		}

		const start = acc;
		const end = acc + row.value;
		const mid = (start + end) / 2;

		result.push({ ...row, yMid: mid });
		acc = end;
	}

	return result;
}

/** Get table columns */
export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'category',
			label: 'Kategorie',
			align: 'left',
			format: (v) => categoryMeta[v]?.label || v
		},
		{ key: 'value', label: 'Anteil (%)', align: 'right', format: (v) => `${v.toFixed(1)}%` }
	];
}

/** Generate placeholders */
export function getPlaceholders(
	data: ModalSplitRawData[],
	region: Region | null
): Record<string, string | number> {
	const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
	const latestYear = years[years.length - 1];
	const latestData = data.filter((d) => d.year === latestYear);

	const total = latestData.reduce((sum, d) => sum + d.value, 0);
	const renewableTotal = latestData
		.filter((d) => renewableCategories.includes(d.category))
		.reduce((sum, d) => sum + d.value, 0);

	const renewablePercent = total ? (renewableTotal / total) * 100 : 0;

	return {
		regionName: region?.name || 'Region',
		latestYear,
		renewablePercent: renewablePercent,
		nonRenewablePercent: 100 - renewablePercent,
		targetYear: goalConfig.endYear,
		targetPercent: goalConfig.targetRenewablePercent,
		dataYearStart: years[0] || '',
		dataYearEnd: latestYear || ''
	};
}

/** Build ChartData object */
export function buildChartData(
	data: ModalSplitRawData[],
	updateDate: string,
	region: Region | null
): ChartData {
	return {
		raw: data,
		table: {
			columns: getTableColumns(),
			rows: data,
			filename: 'modal_split'
		},
		placeholders: getPlaceholders(data, region),
		meta: {
			updateDate,
			source: 'Kommunale Mobilitätserhebung',
			region
		}
	};
}
