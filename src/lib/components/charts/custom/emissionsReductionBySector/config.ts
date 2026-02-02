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
	baseYear: number; // Base year from climate target (or first data year as fallback)
	targetYear: number | undefined;
	firstYearTotal: number;
	lastYearTotal: number;
	baseYearTotal: number;
	targetValue: number;
	totalReductionNeeded: number;
	totalReductionAchieved: number;
	overallProgress: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

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

/** Get climate targets from data (returns past and future targets) */
export function getClimateTargets(data: EmissionsRawData[]): {
	pastTarget: EmissionsRawData | null;
	futureTarget: EmissionsRawData | null;
} {
	const currentYear = new Date().getFullYear();
	const targets = data.filter((d) => d.source === 'climate-target').sort((a, b) => a.year - b.year);

	// Find the most recent past target (base year) and the earliest future target
	const pastTargets = targets.filter((t) => t.year <= currentYear);
	const futureTargets = targets.filter((t) => t.year > currentYear);

	return {
		pastTarget: pastTargets.length > 0 ? pastTargets[0] : null, // First (earliest) past target as base year
		futureTarget: futureTargets.length > 0 ? futureTargets[futureTargets.length - 1] : null // Last (latest) future target
	};
}

/** Get climate target from data (legacy - returns latest target) */
export function getClimateTarget(data: EmissionsRawData[]): EmissionsRawData | null {
	const targets = data.filter((d) => d.source === 'climate-target').sort((a, b) => b.year - a.year);
	return targets[0] || null;
}

// Target reduction percentage: always 100% (climate neutrality)

/** Calculate reduction progress per sector (data is in tons, converts to megatons if needed) */
export function calculateSectorProgress(
	region: RegionResult,
	useMegatons: boolean
): {
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
	const { pastTarget, futureTarget } = getClimateTargets(region.data);

	// Require a future climate target to show the chart
	if (!futureTarget) {
		return { sectors: [], summary: null, hasNegativeProgress: false };
	}

	// Base year: use past climate target year if available, otherwise first data year
	const baseYear = pastTarget?.year ?? firstYear;

	// Helper to convert value if needed
	const convert = (value: number) => (useMegatons ? toMegatons(value) : value);

	// Get totals for first year, base year, and last year (raw values for percentage calculations)
	const firstYearTotalRaw = barData
		.filter((d) => d.year === firstYear)
		.reduce((sum, d) => sum + d.value, 0);

	// Base year total: if base year differs from first year, try to get that year's data
	const baseYearTotalRaw =
		barData.filter((d) => d.year === baseYear).reduce((sum, d) => sum + d.value, 0) ||
		firstYearTotalRaw;

	const lastYearTotalRaw = barData
		.filter((d) => d.year === lastYear)
		.reduce((sum, d) => sum + d.value, 0);

	// Target is always 100% reduction (climate neutrality), target year from climate-target
	const targetValueRaw = futureTarget.value;
	const targetYear = futureTarget.year;

	// Total reduction needed: 100% of base year emissions (goal is climate neutrality)
	const totalReductionNeededRaw = baseYearTotalRaw;
	const totalReductionAchievedRaw = baseYearTotalRaw - lastYearTotalRaw;
	const overallProgress =
		totalReductionNeededRaw > 0 ? (totalReductionAchievedRaw / totalReductionNeededRaw) * 100 : 0;

	// Calculate per-sector progress towards their own 100% reduction target
	const sectors: SectorProgress[] = [];
	let hasNegativeProgress = false;

	for (const category of region.categoryOrder) {
		// Use base year for sector calculations
		const baseYearData = barData.find((d) => d.year === baseYear && d.category === category);
		const firstYearData =
			baseYearData || barData.find((d) => d.year === firstYear && d.category === category);
		const lastYearData = barData.find((d) => d.year === lastYear && d.category === category);

		if (!firstYearData && !lastYearData) continue;

		const firstValueRaw = firstYearData?.value ?? 0;
		const lastValueRaw = lastYearData?.value ?? 0;
		const reductionRaw = firstValueRaw - lastValueRaw;

		// Each sector needs to reduce by 100% (climate neutrality)
		const sectorTargetReductionRaw = firstValueRaw;

		// What percentage of this sector's own target has been achieved?
		const progressPercent =
			sectorTargetReductionRaw > 0 ? (reductionRaw / sectorTargetReductionRaw) * 100 : 0;

		// What percentage has this sector reduced from its own first year value?
		const reductionPercent = firstValueRaw > 0 ? (reductionRaw / firstValueRaw) * 100 : 0;

		if (progressPercent < 0) hasNegativeProgress = true;

		sectors.push({
			sector: category,
			label: firstYearData?.category_label || lastYearData?.category_label || category,
			color: firstYearData?.category_color || lastYearData?.category_color || '#6b7280',
			firstYearValue: convert(firstValueRaw),
			lastYearValue: convert(lastValueRaw),
			reduction: convert(reductionRaw),
			reductionPercent,
			contributionPercent: progressPercent // Now represents progress towards own 100% target
		});
	}

	// Sort by first-year absolute value (biggest at top, smallest at bottom)
	const sortedSectors = sectors.sort((a, b) => b.firstYearValue - a.firstYearValue);

	const summary: ReductionSummary = {
		firstYear,
		lastYear,
		baseYear,
		targetYear,
		firstYearTotal: convert(firstYearTotalRaw),
		lastYearTotal: convert(lastYearTotalRaw),
		baseYearTotal: convert(baseYearTotalRaw),
		targetValue: convert(targetValueRaw),
		totalReductionNeeded: convert(totalReductionNeededRaw),
		totalReductionAchieved: convert(totalReductionAchievedRaw),
		overallProgress
	};

	return { sectors: sortedSectors, summary, hasNegativeProgress };
}

// ============================================================================
// TABLE & CHART DATA BUILDERS
// ============================================================================

/** Get table columns */
export function getTableColumns(
	unit: string,
	firstYear?: number,
	lastYear?: number
): TableColumn[] {
	const firstYearLabel = firstYear ? `Startwert ${firstYear}` : 'Startwert';
	const lastYearLabel = lastYear ? `Aktuell ${lastYear}` : 'Aktuell';

	return [
		{ key: 'label', label: 'Sektor', align: 'left' },
		{
			key: 'firstYearValue',
			label: `${firstYearLabel} (${unit})`,
			align: 'right',
			format: (v) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { maximumFractionDigits: 2 })
					: '–'
		},
		{
			key: 'lastYearValue',
			label: `${lastYearLabel} (${unit})`,
			align: 'right',
			format: (v) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { maximumFractionDigits: 2 })
					: '–'
		},
		{
			key: 'reduction',
			label: `Veränderung (${unit})`,
			align: 'right',
			format: (v) => {
				if (typeof v !== 'number') return '–';
				// Show change as negative of reduction (negative = emissions decreased)
				const change = -v;
				const sign = change < 0 ? '' : '+';
				return sign + change.toLocaleString('de-DE', { maximumFractionDigits: 2 });
			}
		},
		{
			key: 'reductionPercent',
			label: 'Veränderung (%)',
			align: 'right',
			format: (v) => {
				if (typeof v !== 'number') return '–';
				// Show change as negative of reduction percent (negative = emissions decreased)
				const changePercent = -v;
				const sign = changePercent < 0 ? '' : '+';
				return sign + changePercent.toLocaleString('de-DE', { maximumFractionDigits: 1 });
			}
		}
	];
}

/** Context about the page region (stable, not affected by user toggling layers) */
export interface PageRegionContext {
	name: string;
	layer: string;
	parents?: Array<{ id: string; layer: string; name?: string; layer_label?: string }>;
}

/** Compute static info-text placeholders from the page region's data */
export function computeInfoTextPlaceholders(
	results: RegionResult[],
	pageRegion: PageRegionContext | null
): Record<string, string | number | boolean> {
	if (results.length === 0) return {};

	// Match the result that belongs to the page region (by name), fall back to first result
	const regionName = pageRegion?.name ?? results[0].name;
	const pageResult = results.find((r) => r.name === regionName) ?? results[0];

	const rawData = pageResult.data.filter((d) => d.source !== 'climate-target');
	const years = [...new Set(rawData.map((d) => d.year))].sort((a, b) => a - b);
	const lastDataYear = years[years.length - 1];

	// List of all available regions (for intro text)
	const availableRegions = results.map((r) => r.name).join(', ');

	// State name: either the region itself (if it's a state) or the parent state
	const pageLayer = pageRegion?.layer ?? '';
	const isState = pageLayer === 'state';
	const parentState = pageRegion?.parents?.find(
		(p) => p.layer === 'state' || p.layer_label === 'Bundesland'
	);
	const stateName = isState ? (pageRegion?.name ?? '') : (parentState?.name ?? '');

	// Boolean checks for conditionals
	const hasParentState = !!(stateName && !isState);

	// Check if there's a switch with state layer available (for methodology text)
	const hasStateSwitch = results.some(
		(r) => r.key === 'state' || r.key === 'bundesland' || r.layer_label === 'Bundesland'
	);

	// Region ID for conditional content
	const regionId = pageResult.id;

	// Build dynamic placeholders object
	const placeholders: Record<string, string | number | boolean> = {
		availableRegions,
		regionId,
		isState,
		hasParentState,
		hasStateSwitch,
		stateName,
		lastDataYear: lastDataYear?.toString() ?? ''
	};

	// Add dynamic region boolean: region_<id> = true for current region
	// This allows {{#if region_abc123}}...{{/if}} in templates
	if (regionId) {
		placeholders[`region_${regionId}`] = true;
	}

	return placeholders;
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	region: RegionResult,
	sectors: SectorProgress[],
	summary: ReductionSummary | null,
	useMegatons: boolean,
	locale: string = 'de'
): Record<string, string | number> {
	const unit = useMegatons ? 'Mt CO₂eq' : 't CO₂eq';

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

	// Calculate change from base year to last year
	const totalChange = summary.lastYearTotal - summary.baseYearTotal;
	const changePercent =
		summary.baseYearTotal > 0 ? Math.abs(totalChange / summary.baseYearTotal) * 100 : 0;
	const changeVerb =
		totalChange < 0
			? locale === 'de'
				? 'gesunken'
				: 'decreased'
			: locale === 'de'
				? 'gestiegen'
				: 'increased';
	const formattedChangePercent = changePercent.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});

	return {
		regionName: region.name,
		layerLabel: region.layer_label,
		unit,
		firstYear: summary.firstYear,
		lastYear: summary.lastYear,
		baseYear: summary.baseYear,
		changeVerb,
		changePercentage: `${formattedChangePercent}%`,
		targetYear: summary.targetYear ?? 'Klimaneutralität',
		firstYearTotal: summary.firstYearTotal.toLocaleString('de-DE', { maximumFractionDigits: 1 }),
		lastYearTotal: summary.lastYearTotal.toLocaleString('de-DE', { maximumFractionDigits: 1 }),
		baseYearTotal: summary.baseYearTotal.toLocaleString('de-DE', { maximumFractionDigits: 1 }),
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
	useMegatons: boolean,
	dataSource: string,
	locale: string = 'de',
	infoTextPlaceholders: Record<string, string | number | boolean> = {}
): ChartData {
	const unit = useMegatons ? 'Mt CO₂eq' : 't CO₂eq';

	// Get update date from region data (use first entry's update field)
	const updateDate = region.data[0]?.update || new Date().toISOString();

	return {
		raw: sectors,
		table: {
			columns: getTableColumns(unit, summary?.firstYear, summary?.lastYear),
			rows: sectors,
			filename: 'emissions_reduction_progress'
		},
		placeholders: {
			...getPlaceholders(region, sectors, summary, useMegatons, locale),
			...infoTextPlaceholders
		},
		meta: {
			updateDate,
			source: dataSource,
			region: { name: region.name, id: region.id } as any
		}
	};
}
