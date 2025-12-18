// $lib/components/charts/custom/emissionsReductionProgress/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

// ============================================================================
// TYPES
// ============================================================================

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

export interface SectorProgress {
	sector: string;
	label: string;
	color: string;
	firstYearValue: number;
	lastYearValue: number;
	reduction: number;
	reductionPercent: number;
	contributionPercent: number;
}

export interface ReductionSummary {
	firstYear: number;
	lastYear: number;
	targetYear: number | undefined;
	firstYearTotal: number;
	lastYearTotal: number;
	targetValue: number;
	totalReductionNeeded: number;
	totalReductionAchieved: number;
	overallProgress: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Custom sector order for display (top to bottom)
export const customSectorOrder = [
	'Energie',
	'Industrie',
	'Gebäude',
	'Mobilität',
	'Landwirtschaft',
	'Abfallwirtschaft und Sonstiges'
];

// Layer hierarchy (smallest/most local first)
export const layerHierarchy = [
	'municipality',
	'gemeinde',
	'district',
	'bezirk',
	'kreis',
	'landkreis',
	'city',
	'stadt',
	'region',
	'regierungsbezirk',
	'bundesland',
	'state',
	'gruppe',
	'country',
	'land'
];

// ============================================================================
// DATA FETCHING
// ============================================================================

/** Get priority for a layer (lower = more local = preferred) */
export function getLayerPriority(layer: string): number {
	const lowerLayer = layer.toLowerCase();
	const index = layerHierarchy.findIndex((l) => lowerLayer.includes(l));
	return index === -1 ? 999 : index;
}

/** Fetch all emissions data for region candidates */
export async function fetchEmissionsData(
	regionCandidates: string[]
): Promise<{ results: RegionResult[] }> {
	if (regionCandidates.length === 0) {
		return { results: [] };
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

	return { results };
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

// ============================================================================
// DATA PROCESSING
// ============================================================================

/** Get climate target from data */
export function getClimateTarget(data: EmissionsRawData[]): EmissionsRawData | null {
	const targets = data.filter((d) => d.source === 'climate-target').sort((a, b) => b.year - a.year);
	return targets[0] || null;
}

// Target reduction percentage (hardcoded for now)
export const TARGET_REDUCTION_PERCENT = 94;
export const TARGET_YEAR = 2035;

/** Calculate reduction progress per sector */
export function calculateSectorProgress(region: RegionResult): {
	sectors: SectorProgress[];
	summary: ReductionSummary | null;
	hasNegativeProgress: boolean;
} {
	const barData = region.data.filter((d) => d.source !== 'climate-target');
	const years = [...new Set(barData.map((d) => d.year))].sort((a, b) => a - b);

	if (years.length < 2) {
		return { sectors: [], summary: null, hasNegativeProgress: false };
	}

	const firstYear = years[0];
	const lastYear = years[years.length - 1];
	const climateTarget = getClimateTarget(region.data);

	// Get totals for first and last year
	const firstYearTotal = barData
		.filter((d) => d.year === firstYear)
		.reduce((sum, d) => sum + d.value, 0);

	const lastYearTotal = barData
		.filter((d) => d.year === lastYear)
		.reduce((sum, d) => sum + d.value, 0);

	// Target value based on target reduction percentage
	const targetValue = climateTarget?.value ?? firstYearTotal * (1 - TARGET_REDUCTION_PERCENT / 100);
	const targetYear = climateTarget?.year ?? TARGET_YEAR;

	// Total reduction needed and achieved
	const totalReductionNeeded = firstYearTotal * (TARGET_REDUCTION_PERCENT / 100);
	const totalReductionAchieved = firstYearTotal - lastYearTotal;
	const overallProgress =
		totalReductionNeeded > 0 ? (totalReductionAchieved / totalReductionNeeded) * 100 : 0;

	// Calculate per-sector progress towards their own 94% reduction target
	const sectors: SectorProgress[] = [];
	let hasNegativeProgress = false;

	for (const category of region.categoryOrder) {
		const firstYearData = barData.find((d) => d.year === firstYear && d.category === category);
		const lastYearData = barData.find((d) => d.year === lastYear && d.category === category);

		if (!firstYearData && !lastYearData) continue;

		const firstValue = firstYearData?.value ?? 0;
		const lastValue = lastYearData?.value ?? 0;
		const reduction = firstValue - lastValue;

		// Each sector needs to reduce by TARGET_REDUCTION_PERCENT
		const sectorTargetReduction = firstValue * (TARGET_REDUCTION_PERCENT / 100);

		// What percentage of this sector's own target has been achieved?
		const progressPercent =
			sectorTargetReduction > 0 ? (reduction / sectorTargetReduction) * 100 : 0;

		// What percentage has this sector reduced from its own first year value?
		const reductionPercent = firstValue > 0 ? (reduction / firstValue) * 100 : 0;

		if (progressPercent < 0) hasNegativeProgress = true;

		sectors.push({
			sector: category,
			label: firstYearData?.category_label || lastYearData?.category_label || category,
			color: firstYearData?.category_color || lastYearData?.category_color || '#6b7280',
			firstYearValue: firstValue,
			lastYearValue: lastValue,
			reduction,
			reductionPercent,
			contributionPercent: progressPercent // Now represents progress towards own 94% target
		});
	}

	// Sort by custom sector order
	const sortedSectors = sectors.sort((a, b) => {
		const aIdx = customSectorOrder.findIndex((s) =>
			a.label.toLowerCase().includes(s.toLowerCase())
		);
		const bIdx = customSectorOrder.findIndex((s) =>
			b.label.toLowerCase().includes(s.toLowerCase())
		);
		return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
	});

	const summary: ReductionSummary = {
		firstYear,
		lastYear,
		targetYear,
		firstYearTotal,
		lastYearTotal,
		targetValue,
		totalReductionNeeded,
		totalReductionAchieved,
		overallProgress
	};

	return { sectors: sortedSectors, summary, hasNegativeProgress };
}

// ============================================================================
// TABLE & CHART DATA BUILDERS
// ============================================================================

/** Get table columns */
export function getTableColumns(unit: string): TableColumn[] {
	return [
		{ key: 'label', label: 'Sektor', align: 'left' },
		{
			key: 'firstYearValue',
			label: 'Startwert',
			align: 'right',
			format: (v) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ` ${unit}`
					: '–'
		},
		{
			key: 'lastYearValue',
			label: 'Aktuell',
			align: 'right',
			format: (v) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ` ${unit}`
					: '–'
		},
		{
			key: 'reduction',
			label: 'Reduktion',
			align: 'right',
			format: (v) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ` ${unit}`
					: '–'
		},
		{
			key: 'reductionPercent',
			label: 'Reduktion %',
			align: 'right',
			format: (v) =>
				typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + '%' : '–'
		},
		{
			key: 'contributionPercent',
			label: 'Beitrag zum Ziel',
			align: 'right',
			format: (v) =>
				typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + '%' : '–'
		}
	];
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	region: RegionResult,
	sectors: SectorProgress[],
	summary: ReductionSummary | null,
	version: string
): Record<string, string | number> {
	const unit = version === 'de' ? 'Mt CO₂eq' : 't CO₂eq';

	if (!summary) {
		return {
			regionName: region.name,
			layerLabel: region.layer_label,
			unit
		};
	}

	// Find best and worst performing sectors
	const sortedByContribution = [...sectors].sort(
		(a, b) => b.contributionPercent - a.contributionPercent
	);
	const bestSector = sortedByContribution[0];
	const worstSector = sortedByContribution[sortedByContribution.length - 1];

	// Sectors with negative progress (emissions increased)
	const negativeSectors = sectors.filter((s) => s.contributionPercent < 0);

	return {
		regionName: region.name,
		layerLabel: region.layer_label,
		unit,
		firstYear: summary.firstYear,
		lastYear: summary.lastYear,
		targetYear: summary.targetYear ?? 'Klimaneutralität',
		firstYearTotal: summary.firstYearTotal.toLocaleString('de-DE', { maximumFractionDigits: 1 }),
		lastYearTotal: summary.lastYearTotal.toLocaleString('de-DE', { maximumFractionDigits: 1 }),
		targetValue:
			summary.targetValue === 0
				? 'Klimaneutralität'
				: summary.targetValue.toLocaleString('de-DE', { maximumFractionDigits: 1 }),
		totalReductionNeeded: summary.totalReductionNeeded.toLocaleString('de-DE', {
			maximumFractionDigits: 1
		}),
		totalReductionAchieved: summary.totalReductionAchieved.toLocaleString('de-DE', {
			maximumFractionDigits: 1
		}),
		overallProgress: summary.overallProgress.toLocaleString('de-DE', { maximumFractionDigits: 1 }),
		bestSectorName: bestSector?.label ?? '–',
		bestSectorContribution:
			bestSector?.contributionPercent.toLocaleString('de-DE', { maximumFractionDigits: 1 }) ?? '0',
		worstSectorName: worstSector?.label ?? '–',
		worstSectorContribution:
			worstSector?.contributionPercent.toLocaleString('de-DE', { maximumFractionDigits: 1 }) ?? '0',
		negativeSectorCount: negativeSectors.length,
		negativeSectorNames: negativeSectors.map((s) => s.label).join(', ') || '–'
	};
}

/** Build ChartData for Card integration */
export function buildChartData(
	region: RegionResult,
	sectors: SectorProgress[],
	summary: ReductionSummary | null,
	version: string
): ChartData {
	const unit = version === 'de' ? 'Mt CO₂eq' : 't CO₂eq';

	return {
		raw: sectors,
		table: {
			columns: getTableColumns(unit),
			rows: sectors,
			filename: 'emissions_reduction_progress'
		},
		placeholders: getPlaceholders(region, sectors, summary, version),
		meta: {
			updateDate: new Date().toISOString(),
			source:
				version === 'de'
					? 'Statistische Ämter des Bundes und der Länder (Tabelle 86431-Z-04)'
					: 'Emissions data',
			region: { name: region.name, id: region.id } as any
		}
	};
}
