// $lib/components/charts/custom/mobilityModalSplitStreet/config.ts

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

// Category definitions - order determines left-to-right position in the "street"
// Pedestrians on sidewalk -> bikes -> public transport -> cars
export const categoryOrder = [
	'on_foot',
	'bicycle',
	'e_bike',
	'public_transport',
	'car_passenger',
	'car_driver',
	'motorbike'
];

export const sustainableCategories = ['on_foot', 'bicycle', 'e_bike', 'public_transport'];
export const motorizedCategories = ['motorbike', 'car_driver', 'car_passenger'];

export const categoryMeta: Record<
	string,
	{ label: string; shortLabel: string; sustainable: boolean }
> = {
	on_foot: { label: 'Zu Fuß', shortLabel: 'Fuß', sustainable: true },
	bicycle: { label: 'Fahrrad', shortLabel: 'Rad', sustainable: true },
	e_bike: { label: 'E-Bike', shortLabel: 'E-Bike', sustainable: true },
	public_transport: { label: 'ÖPNV', shortLabel: 'ÖPNV', sustainable: true },
	motorbike: { label: 'Motorrad', shortLabel: 'Moto', sustainable: false },
	car_driver: { label: 'Auto (Fahrer)', shortLabel: 'Fahrer:in', sustainable: false },
	car_passenger: { label: 'Auto (Mitfahrer)', shortLabel: 'Mitfahrer:in', sustainable: false }
};

// Refined color palette - cohesive street feel
// Sustainable modes: cool greens and teals
// Motorized: warm grays and muted reds
export const categoryColors: Record<string, { main: string; light: string; dark: string }> = {
	on_foot: { main: '#10b981', light: '#d1fae5', dark: '#047857' }, // Emerald - sidewalk
	bicycle: { main: '#14b8a6', light: '#ccfbf1', dark: '#0f766e' }, // Teal - bike lane
	e_bike: { main: '#06b6d4', light: '#cffafe', dark: '#0e7490' }, // Cyan - bike lane
	public_transport: { main: '#f59e0b', light: '#fef3c7', dark: '#b45309' }, // Amber - bus/tram
	motorbike: { main: '#78716c', light: '#e7e5e4', dark: '#44403c' }, // Stone - road
	car_driver: { main: '#64748b', light: '#e2e8f0', dark: '#334155' }, // Slate - road
	car_passenger: { main: '#94a3b8', light: '#f1f5f9', dark: '#475569' } // Slate lighter - road
};

// Goal configuration
export const goalConfig = {
	startYear: 2024,
	endYear: 2035,
	targetSustainablePercent: 62
};

/** Get historic years only (for optional display) */
export function getHistoricYears(data: ModalSplitRawData[]): number[] {
	return Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
}

/** Get the latest year with actual data */
export function getLatestDataYear(data: ModalSplitRawData[]): number {
	const years = getHistoricYears(data);
	return years[years.length - 1] || new Date().getFullYear();
}

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

/** Process data into ordered segments for each year */
export function processYearData(
	data: ModalSplitRawData[],
	year: number
): Array<{ category: string; value: number; x0: number; x1: number }> {
	const yearData = data.filter((d) => d.year === year);
	const result: Array<{ category: string; value: number; x0: number; x1: number }> = [];
	let acc = 0;

	for (const cat of categoryOrder) {
		const entry = yearData.find((d) => d.category === cat);
		const value = entry?.value || 0;
		if (value > 0) {
			result.push({
				category: cat,
				value,
				x0: acc,
				x1: acc + value
			});
			acc += value;
		}
	}

	return result;
}

/** Calculate projection data for future years */
export function calculateProjection(
	data: ModalSplitRawData[],
	targetYear: number
): ModalSplitRawData[] {
	const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
	const { startYear, endYear, targetSustainablePercent } = goalConfig;

	const baselineYear =
		years.filter((y) => y <= startYear).sort((a, b) => b - a)[0] || years[years.length - 1];
	if (!baselineYear) return [];

	const baseRows = data.filter((d) => d.year === baselineYear);
	const total = baseRows.reduce((sum, d) => sum + d.value, 0);

	// Calculate current split per category
	const baseSustainable = baseRows
		.filter((d) => sustainableCategories.includes(d.category))
		.reduce((sum, d) => sum + d.value, 0);
	const baseMotorized = total - baseSustainable;

	const baseSustainablePercent = total ? (baseSustainable / total) * 100 : 0;

	// For the target year, redistribute proportionally
	const t = Math.min(1, (targetYear - startYear) / (endYear - startYear));
	const targetSustainable =
		baseSustainablePercent + t * (targetSustainablePercent - baseSustainablePercent);
	const targetMotorized = 100 - targetSustainable;

	// Scale each category proportionally within its group
	const result: ModalSplitRawData[] = [];

	for (const cat of categoryOrder) {
		const baseEntry = baseRows.find((d) => d.category === cat);
		const baseValue = baseEntry?.value || 0;

		if (sustainableCategories.includes(cat)) {
			const proportion = baseSustainable > 0 ? baseValue / baseSustainable : 0;
			result.push({ year: targetYear, category: cat, value: proportion * targetSustainable });
		} else {
			const proportion = baseMotorized > 0 ? baseValue / baseMotorized : 0;
			result.push({ year: targetYear, category: cat, value: proportion * targetMotorized });
		}
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
	const sustainableTotal = latestData
		.filter((d) => sustainableCategories.includes(d.category))
		.reduce((sum, d) => sum + d.value, 0);

	const sustainablePercent = total ? (sustainableTotal / total) * 100 : 0;

	return {
		regionName: region?.name || 'Region',
		latestYear,
		sustainablePercent: Math.round(sustainablePercent),
		motorizedPercent: Math.round(100 - sustainablePercent),
		targetYear: goalConfig.endYear,
		targetPercent: goalConfig.targetSustainablePercent,
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
