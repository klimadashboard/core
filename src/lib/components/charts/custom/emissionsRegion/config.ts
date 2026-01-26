// $lib/components/charts/custom/emissionsBySector/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { t } from '$lib/utils/t';

export type Translations = Record<string, string>;

export interface EmissionsRawData {
	year: number;
	category: string;
	category_label?: string;
	category_color?: string;
	value: number;
	source: string;
	region?: string;
	update?: string;
}

export interface RegionResult {
	key: string;
	label: string;
	layer_label: string;
	name: string;
	data: EmissionsRawData[];
	categoryOrder: string[];
	population?: number;
	id: string;
}

export interface StackedBar {
	sector: string;
	label: string;
	color: string;
	value: number;
	start: number;
	end: number;
}

export interface YearGroup {
	year: number;
	sectors: Array<{
		sector: string;
		label: string;
		color: string;
		value: number;
	}>;
	total: number;
	stackedSectors: StackedBar[];
}

// Threshold for displaying in megatons (1 million tons)
const MEGATON_THRESHOLD = 1_000_000;

/** Determine if values should be displayed in megatons based on max value */
export function shouldUseMegatons(data: EmissionsRawData[]): boolean {
	const maxValue = Math.max(...data.map((d) => d.value), 0);
	return maxValue >= MEGATON_THRESHOLD;
}

/** Convert tons to megatons */
export function toMegatons(value: number): number {
	return value / 1_000_000;
}

/** Transform data to megatons if needed */
export function transformToDisplayUnit(
	data: EmissionsRawData[],
	useMegatons: boolean
): EmissionsRawData[] {
	if (!useMegatons) return data;
	return data.map((d) => ({ ...d, value: toMegatons(d.value) }));
}

// Custom sector order for stacking (bottom to top) - keys for matching
export const customSectorOrderKeys = [
	'energie',
	'industrie',
	'gebäude',
	'mobilität',
	'landwirtschaft',
	'abfallwirtschaft und sonstiges'
];

// Legacy export for backwards compatibility
export const customSectorOrder = [
	'Energie',
	'Industrie',
	'Gebäude',
	'Mobilität',
	'Landwirtschaft',
	'Abfallwirtschaft und Sonstiges'
];

/** Fetch all emissions data for region candidates */
export async function fetchEmissionsData(
	regionCandidates: string[]
): Promise<{ results: RegionResult[]; populationByYear: Record<string, Record<number, number>> }> {
	if (regionCandidates.length === 0) {
		return { results: [], populationByYear: {} };
	}

	const directus = getDirectusInstance();

	// Fetch emissions
	const emissions = await directus.request(
		readItems('emissions_data', {
			filter: {
				_and: [
					{ region: { _in: regionCandidates } },
					{ value: { _gte: 0 } },
					{ category: { _neq: 'ksg' } },
					{ category: { _neq: 'Emissions|CO2' } },
					{
						_or: [{ category: { _neq: 'total' } }, { source: { _eq: 'climate-target' } }]
					},
					{
						_or: [
							{ category: { _neq: 'Emissions|Kyoto Gases' } },
							{ source: { _eq: 'climate-target' } }
						]
					},
					{
						_or: [{ type: { _null: true } }, { type: { _nin: ['EH', 'KSG'] } }]
					}
				]
			},
			limit: -1,
			sort: ['year']
		})
	);

	// Fetch region metadata
	const regions = await directus.request(
		readItems('regions', {
			filter: { id: { _in: regionCandidates } },
			fields: ['id', 'name', 'layer', 'layer_label', 'population']
		})
	);

	// Fetch category metadata
	const categories = await directus.request(
		readItems('emissions_category', {
			fields: ['code', 'label', 'color'],
			limit: -1
		})
	);

	// Fetch population data
	const populationData = await directus.request(
		readItems('population', {
			filter: { region: { _in: regionCandidates } },
			limit: -1,
			sort: ['region', 'period']
		})
	);

	// Build population lookup
	const populationByYear: Record<string, Record<number, number>> = {};
	(populationData as any[]).forEach((pop) => {
		const regionId = pop.region;
		const year = new Date(pop.period).getFullYear();
		if (!populationByYear[regionId]) {
			populationByYear[regionId] = {};
		}
		populationByYear[regionId][year] = pop.value;
	});

	// Build category map and order
	const categoryMap = new Map((categories ?? []).map((c: any) => [c.code, c]));
	const labelToCodeMap = buildLabelToCodeMap(categories as any[]);
	const categoryOrder = buildCategoryOrder(categories as any[], labelToCodeMap);

	// Enrich emissions with category info
	const enriched = (emissions as any[]).map((e) => {
		const cat = categoryMap.get(e.category);
		return {
			...e,
			category_label: cat?.label ?? e.category,
			category_color: cat?.color ?? '#ccc'
		};
	});

	// Group by region
	const results = (regions as any[])
		.map((region) => {
			const regionData = enriched.filter((d) => d.region === region.id);
			if (regionData.length > 0) {
				return {
					key: region.layer,
					label: `${region.layer_label} ${region.name}`,
					layer_label: region.layer_label,
					name: region.name,
					data: regionData,
					categoryOrder,
					population: region.population,
					id: region.id
				};
			}
			return null;
		})
		.filter((r): r is RegionResult => r !== null);

	return { results, populationByYear };
}

function buildLabelToCodeMap(
	categories: Array<{ code: string; label?: string }>
): Map<string, string> {
	const map = new Map<string, string>();

	categories?.forEach((cat) => {
		if (cat.label) {
			const labelLower = cat.label.toLowerCase();
			map.set(labelLower, cat.code);

			if (labelLower.includes('abfall')) map.set('abfallwirtschaft und sonstiges', cat.code);
			if (labelLower.includes('landnutzung')) map.set('landwirtschaft', cat.code);
			if (labelLower.includes('transport') || labelLower.includes('verkehr'))
				map.set('mobilität', cat.code);
			if (labelLower.includes('building') || labelLower.includes('gebäude'))
				map.set('gebäude', cat.code);
			if (labelLower.includes('industrial') || labelLower.includes('industrie'))
				map.set('industrie', cat.code);
			if (labelLower.includes('energy') || labelLower.includes('energie'))
				map.set('energie', cat.code);
		}
	});

	return map;
}

function buildCategoryOrder(
	categories: Array<{ code: string; label?: string }>,
	labelToCodeMap: Map<string, string>
): string[] {
	const orderedCodes = customSectorOrder
		.map((label) => labelToCodeMap.get(label.toLowerCase()))
		.filter((code): code is string => !!code);

	const remainingCodes = (categories ?? [])
		.map((c) => c.code)
		.filter((code) => !orderedCodes.includes(code));

	return [...orderedCodes, ...remainingCodes];
}

/** Transform data for per-capita display (data is in tons, result is in tons per capita) */
export function transformForPerCapita(
	data: EmissionsRawData[],
	populationByYear: Record<number, number>,
	fallbackPopulation?: number
): EmissionsRawData[] {
	return data.map((d) => {
		const yearPopulation = populationByYear[d.year];
		const population = yearPopulation || fallbackPopulation;

		if (population) {
			return {
				...d,
				value: d.value / population
			};
		}
		return d;
	});
}

/** Group and stack data by year (excludes climate-target from bars) */
export function groupAndStack(data: EmissionsRawData[], categoryOrder: string[]): YearGroup[] {
	const barData = data.filter((d) => d.source !== 'climate-target');
	const years = [...new Set(barData.map((d) => d.year))].sort((a, b) => a - b);

	return years.map((year) => {
		const sectors = categoryOrder.map((cat) => {
			const match = barData.find((d) => d.year === year && d.category === cat);
			return {
				sector: cat,
				label: match?.category_label ?? cat,
				color: match?.category_color ?? '#ccc',
				value: match?.value ?? 0
			};
		});

		const total = sectors.reduce((sum, s) => sum + s.value, 0);

		let yOffset = 0;
		const stackedSectors = sectors.map((s) => {
			const start = yOffset;
			yOffset += s.value;
			return { ...s, start, end: yOffset };
		});

		return { year, sectors, total, stackedSectors };
	});
}

/** Get climate targets from data (data is in tons) */
export function getClimateTargets(
	data: EmissionsRawData[],
	populationByYear: Record<number, number>,
	fallbackPopulation?: number,
	showPerCapita: boolean = false
): EmissionsRawData[] {
	return data
		.filter((d) => d.source === 'climate-target')
		.map((d) => {
			if (showPerCapita) {
				const yearPopulation = populationByYear[d.year];
				const population = yearPopulation || fallbackPopulation;
				if (population) {
					return { ...d, value: d.value / population };
				}
			}
			return d;
		})
		.sort((a, b) => a.year - b.year);
}

/** Get displayed categories for legend/switch */
export function getDisplayedCategories(
	data: EmissionsRawData[],
	categoryOrder: string[]
): Array<{ key: string; label: string; color: string }> {
	const barData = data.filter((d) => d.source !== 'climate-target');

	return categoryOrder
		.map((cat) => {
			const d = barData.find((item) => item.category === cat);
			return d
				? { key: cat, label: d.category_label || cat, color: d.category_color || '#6b7280' }
				: null;
		})
		.filter(
			(item): item is { key: string; label: string; color: string } =>
				item !== null && !item.label.toLowerCase().includes('kyoto')
		);
}

/** Calculate change statistics for emissions data */
function calculateChangeStats(
	tableData: EmissionsRawData[],
	translations: Translations
): {
	changeVerb: string;
	changePercentage: string;
	lastYear: number | null;
	sectorIncrease: string;
} {
	const years = [...new Set(tableData.map((d) => d.year))].sort((a, b) => a - b);

	if (years.length < 2) {
		return {
			changeVerb: '',
			changePercentage: '',
			lastYear: years[0] ?? null,
			sectorIncrease: ''
		};
	}

	const lastYear = years[years.length - 1];
	const previousYear = years[years.length - 2];

	// Calculate totals for previous and last year (year-over-year change)
	const previousYearTotal = tableData
		.filter((d) => d.year === previousYear)
		.reduce((sum, d) => sum + d.value, 0);
	const lastYearTotal = tableData
		.filter((d) => d.year === lastYear)
		.reduce((sum, d) => sum + d.value, 0);

	// Calculate overall change (year-over-year)
	const totalChange = lastYearTotal - previousYearTotal;
	const changePercent = previousYearTotal > 0 ? Math.abs(totalChange / previousYearTotal) * 100 : 0;
	const changeVerb =
		totalChange < 0
			? t(translations, 'domain.verb.decreased')
			: t(translations, 'domain.verb.increased');
	const formattedPercent = changePercent.toLocaleString('de-DE', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	const changePercentage = `${formattedPercent}%`;

	// Find sectors that increased
	const categories = [...new Set(tableData.map((d) => d.category))];
	const sectorChanges: Array<{ category: string; label: string; color: string; change: number }> =
		[];

	categories.forEach((category) => {
		const previousValue =
			tableData.find((d) => d.year === previousYear && d.category === category)?.value ?? 0;
		const lastValue =
			tableData.find((d) => d.year === lastYear && d.category === category)?.value ?? 0;
		const change = lastValue - previousValue;

		if (change > 0) {
			const categoryData = tableData.find((d) => d.category === category);
			const label = categoryData?.category_label ?? category;
			const color = categoryData?.category_color ?? '#6b7280';
			sectorChanges.push({ category, label, color, change });
		}
	});

	// Sort by change (biggest increase first) and get the top one
	sectorChanges.sort((a, b) => b.change - a.change);
	const biggestIncrease = sectorChanges[0];

	// Build sectorIncrease sentence - only if overall emissions fell
	let sectorIncrease = '';
	if (biggestIncrease && totalChange < 0) {
		const styledSector = `<span style="text-decoration: underline; text-decoration-color: ${biggestIncrease.color}; text-underline-offset: 4px; text-decoration-thickness: 0.1em;">${biggestIncrease.label}</span>`;
		// Full sentence: "Im Sektor {sector} sind die Emissionen gestiegen." / "In the {sector} sector, emissions rose."
		sectorIncrease = t(translations, 'domain.emissions.sectorIncreased').replace('{sector}', styledSector);
	}

	return {
		changeVerb,
		changePercentage,
		lastYear,
		sectorIncrease
	};
}

/** Build ChartData for Card integration */
export function buildChartData(
	data: EmissionsRawData[],
	region: RegionResult,
	showPerCapita: boolean,
	useMegatons: boolean,
	translations: Translations,
	climateNeutralityText: string | null = null
): ChartData {
	const unit = showPerCapita ? 't CO₂eq/Kopf' : useMegatons ? 'Mt CO₂eq' : 't CO₂eq';
	const tableData = data.filter((d) => d.source !== 'climate-target');

	// Get unique categories and years
	const categories = [
		...new Set(tableData.map((d) => d.category_label).filter((c): c is string => !!c))
	].sort();
	const years = [...new Set(tableData.map((d) => d.year))].sort((a, b) => a - b);

	// Build wide format rows (years as rows, categories as columns)
	const wideRows = years.map((year) => {
		const row: Record<string, any> = { year };
		categories.forEach((category) => {
			const dataPoint = tableData.find((d) => d.year === year && d.category_label === category);
			row[category] = dataPoint?.value ?? null;
		});
		return row;
	});

	// Build columns for wide format
	const wideColumns: TableColumn[] = [
		{ key: 'year', label: t(translations, 'table.year'), align: 'left' },
		...categories.map((category) => ({
			key: category,
			label: `${category} (${unit})`,
			align: 'right' as const,
			format: (v: any) =>
				typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 2 }) : '–'
		}))
	];

	// Get source and update date from data (use first non-climate-target entry)
	const dataSource = tableData[0]?.source || 'Emissions data';
	const updateDate = tableData[0]?.update || new Date().toISOString();

	// Calculate change statistics
	const changeStats = calculateChangeStats(tableData, translations);

	return {
		raw: data,
		table: {
			columns: wideColumns,
			rows: wideRows,
			filename: 'emissions_by_sector'
		},
		placeholders: {
			regionName: region.name,
			layerLabel: region.layer_label,
			unit,
			changeVerb: changeStats.changeVerb,
			changePercentage: changeStats.changePercentage,
			lastYear: changeStats.lastYear?.toString() ?? '',
			sectorIncrease: changeStats.sectorIncrease,
			climateNeutrality: climateNeutralityText ?? ''
		},
		meta: {
			updateDate,
			source: dataSource,
			region: { name: region.name, id: region.id } as any
		}
	};
}
