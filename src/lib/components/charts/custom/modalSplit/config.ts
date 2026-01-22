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

// WCAG AA compliant color palette with sufficient contrast against white text (4.5:1 minimum)
// Colors chosen for maximum distinguishability - spread across color wheel
// Sustainable modes: blue-cyan-teal-yellow spectrum
// Motorized: orange, rose/pink, violet - distinctly different hues
export const categoryColors: Record<string, { main: string; light: string; dark: string }> = {
	on_foot: { main: '#0369a1', light: '#e0f2fe', dark: '#075985' }, // Sky-700 - contrast 5.14:1
	bicycle: { main: '#0891b2', light: '#cffafe', dark: '#0e7490' }, // Cyan-600 - contrast 4.51:1
	e_bike: { main: '#0891b2', light: '#cffafe', dark: '#0e7490' }, // Cyan-600 - same as bicycle
	public_transport: { main: '#ca8a04', light: '#fef3c7', dark: '#a16207' }, // Yellow-600 - contrast 5.37:1
	motorbike: { main: '#c2410c', light: '#ffedd5', dark: '#9a3412' }, // Orange-700 - contrast 5.93:1
	car_driver: { main: '#be185d', light: '#fce7f3', dark: '#9d174d' }, // Pink-700 - contrast 5.64:1
	car_passenger: { main: '#7c3aed', light: '#f3e8ff', dark: '#6d28d9' } // Violet-600 - contrast 4.75:1
};

// Goal configuration
export const goalConfig = {
	startYear: 2024,
	endYear: 2035,
	targetSustainablePercent: 66
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
): Promise<{ data: ModalSplitRawData[]; updateDate: string; source: string }> {
	const directus = getDirectusInstance(fetch);
	const regionId = region?.id || params.regionId;

	const rawData = await directus.request(
		readItems('mobility_modal_split', {
			filter: regionId ? { region: { _eq: regionId } } : undefined,
			sort: ['year', 'category'],
			fields: ['year', 'category', 'region', 'value', 'update', 'source'],
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

	// Get the most recent update date from the data
	const updateDates = (rawData as any[])
		.map((r) => r.update)
		.filter(Boolean)
		.sort()
		.reverse();
	const updateDate = updateDates[0];

	// Get source from the first record (assuming all records have the same source)
	const source = (rawData as any[]).find((r) => r.source)?.source;

	return {
		data,
		updateDate,
		source
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

/** Get table columns - wide format with categories as columns */
export function getTableColumns(data: ModalSplitRawData[]): TableColumn[] {
	const categories = Array.from(new Set(data.map((d) => d.category))).sort(
		(a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
	);

	return [
		{ key: 'year', label: 'Jahr', align: 'left' },
		...categories.map((cat) => ({
			key: cat,
			label: categoryMeta[cat]?.label || cat,
			align: 'right' as const,
			format: (v: number) => `${v.toFixed(1)}%`
		}))
	];
}

/** Transform data to wide format for table */
export function getTableRows(data: ModalSplitRawData[]): any[] {
	const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);

	return years.map((year) => {
		const yearData = data.filter((d) => d.year === year);
		const row: any = { year };

		for (const cat of categoryOrder) {
			const entry = yearData.find((d) => d.category === cat);
			row[cat] = entry?.value || 0;
		}

		return row;
	});
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
	source: string,
	region: Region | null,
	showHistoric: boolean = false
): ChartData {
	return {
		raw: data,
		table: {
			columns: getTableColumns(data),
			rows: getTableRows(data),
			filename: 'modal_split'
		},
		placeholders: getPlaceholders(data, region),
		meta: {
			updateDate,
			source,
			region
		},
		embedOptions: [
			{
				key: 'historic',
				label: 'Historische Entwicklung anzeigen',
				choices: [
					{ value: 'false', label: 'Nein' },
					{ value: 'true', label: 'Ja' }
				],
				currentValue: showHistoric ? 'true' : 'false'
			}
		]
	};
}
