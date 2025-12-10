// $lib/components/charts/custom/emissionsBySector/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

export interface EmissionsRawData {
	year: number;
	category: string;
	category_label?: string;
	category_color?: string;
	value: number;
	source: string;
	region?: string;
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

// Custom sector order for stacking (bottom to top)
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

/** Transform data for per-capita display */
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
				value: (d.value * 1_000_000) / population
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

/** Get climate targets from data */
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
					return { ...d, value: (d.value * 1_000_000) / population };
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

/** Build ChartData for Card integration */
export function buildChartData(
	data: EmissionsRawData[],
	region: RegionResult,
	showPerCapita: boolean,
	version: string
): ChartData {
	const unit = showPerCapita ? 't CO₂eq/Kopf' : version === 'de' ? 'Mt CO₂eq' : 't CO₂eq';
	const tableData = data.filter((d) => d.source !== 'climate-target');

	return {
		raw: data,
		table: {
			columns: [
				{ key: 'year', label: 'Jahr', align: 'left' },
				{ key: 'category_label', label: 'Sektor', align: 'left' },
				{
					key: 'value',
					label: `Emissionen (${unit})`,
					align: 'right',
					format: (v) =>
						typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 2 }) : '–'
				}
			],
			rows: tableData,
			filename: 'emissions_by_sector'
		},
		placeholders: {
			regionName: region.name,
			layerLabel: region.layer_label,
			unit
		},
		meta: {
			updateDate: new Date().toISOString(),
			source:
				version === 'de'
					? 'Statistische Ämter des Bundes und der Länder (Tabelle 86431-Z-04)'
					: data[0]?.source || 'Emissions data',
			region: { name: region.name, id: region.id } as any
		}
	};
}
