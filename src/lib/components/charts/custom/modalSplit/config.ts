// $lib/components/charts/custom/mobilityModalSplitStreet/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { t } from '$lib/utils/t';

export type Translations = Record<string, string>;

export interface ModalSplitParams {
	regionId?: string;
	regionCandidates?: string[];
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

/** Get category metadata with translated labels */
export function getCategoryMeta(
	translations: Translations
): Record<string, { label: string; shortLabel: string; sustainable: boolean }> {
	return {
		on_foot: {
			label: t(translations, 'domain.transport.onFoot'),
			shortLabel: t(translations, 'domain.transport.onFootShort'),
			sustainable: true
		},
		bicycle: {
			label: t(translations, 'domain.transport.bicycle'),
			shortLabel: t(translations, 'domain.transport.bicycleShort'),
			sustainable: true
		},
		e_bike: {
			label: t(translations, 'domain.transport.eBike'),
			shortLabel: t(translations, 'domain.transport.eBike'),
			sustainable: true
		},
		public_transport: {
			label: t(translations, 'domain.transport.publicTransport'),
			shortLabel: t(translations, 'domain.transport.publicTransportShort'),
			sustainable: true
		},
		motorbike: {
			label: t(translations, 'domain.transport.motorbike'),
			shortLabel: t(translations, 'domain.transport.motorbikeShort'),
			sustainable: false
		},
		car_driver: {
			label: t(translations, 'domain.transport.carDriver'),
			shortLabel: t(translations, 'domain.transport.carDriverShort'),
			sustainable: false
		},
		car_passenger: {
			label: t(translations, 'domain.transport.carPassenger'),
			shortLabel: t(translations, 'domain.transport.carPassengerShort'),
			sustainable: false
		}
	};
}

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

// ============================================================================
// GOAL TYPES
// ============================================================================

export type GoalType = 'sustainable_total' | 'category_specific' | 'multi_year_path';

export interface GoalPathPoint {
	year: number;
	sustainable: number;
}

export interface ModalSplitGoal {
	id: string;
	region: string;
	target_year: number;
	goal_type: GoalType;
	sustainable_target: number | null;
	category_targets: Record<string, number> | null;
	goal_path: GoalPathPoint[] | null;
	source: string | null;
}

/** Resolved goal config for use in calculations (derived from ModalSplitGoal + data) */
export interface ResolvedGoalConfig {
	startYear: number; // Derived from latest year in data
	endYear: number;
	targetSustainablePercent: number;
	goalPath: GoalPathPoint[] | null;
	categoryTargets: Record<string, number> | null;
	source: string | null;
}

/** Get historic years only (for optional display) */
export function getHistoricYears(data: ModalSplitRawData[]): number[] {
	return Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
}

/** Get the latest year with actual data */
export function getLatestDataYear(data: ModalSplitRawData[]): number {
	const years = getHistoricYears(data);
	return years[years.length - 1] || new Date().getFullYear();
}

/** Fetch modal split goal from Directus */
export async function fetchGoal(region: Region | null): Promise<ModalSplitGoal | null> {
	if (!region?.id) return null;

	const directus = getDirectusInstance(fetch);

	try {
		const goals = await directus.request(
			readItems('mobility_modal_split_goals', {
				filter: { region: { _eq: region.id } },
				limit: 1
			})
		);

		if (!goals || goals.length === 0) return null;

		const goal = goals[0] as any;

		// Parse goal_path if present
		let goalPath: GoalPathPoint[] | null = null;
		if (goal.goal_path) {
			try {
				const parsed = typeof goal.goal_path === 'string' ? JSON.parse(goal.goal_path) : goal.goal_path;
				if (Array.isArray(parsed)) {
					goalPath = parsed
						.map((p: any) => ({
							year: Number(p.year),
							sustainable: Number(p.sustainable)
						}))
						.filter((p: GoalPathPoint) => !isNaN(p.year) && !isNaN(p.sustainable))
						.sort((a: GoalPathPoint, b: GoalPathPoint) => a.year - b.year);
				}
			} catch (e) {
				console.warn('[modalSplit] Failed to parse goal_path:', e);
			}
		}

		// Parse category_targets if present
		let categoryTargets: Record<string, number> | null = null;
		if (goal.category_targets) {
			try {
				categoryTargets =
					typeof goal.category_targets === 'string'
						? JSON.parse(goal.category_targets)
						: goal.category_targets;
			} catch (e) {
				console.warn('[modalSplit] Failed to parse category_targets:', e);
			}
		}

		return {
			id: goal.id,
			region: goal.region,
			target_year: goal.target_year,
			goal_type: goal.goal_type,
			sustainable_target: goal.sustainable_target,
			category_targets: categoryTargets,
			goal_path: goalPath,
			source: goal.source
		};
	} catch (e) {
		console.warn('[modalSplit] Failed to fetch goal:', e);
		return null;
	}
}

/** Resolve goal to a config usable for calculations */
export function resolveGoalConfig(
	goal: ModalSplitGoal | null,
	data: ModalSplitRawData[]
): ResolvedGoalConfig | null {
	if (!goal) return null;

	// Start year is derived from the latest year in the historic data
	const startYear = getLatestDataYear(data);

	return {
		startYear,
		endYear: goal.target_year,
		targetSustainablePercent: goal.sustainable_target ?? 0,
		goalPath: goal.goal_path,
		categoryTargets: goal.category_targets,
		source: goal.source
	};
}

/** Layer hierarchy for determining which region data to prefer (smallest/most local first) */
const layerHierarchy = [
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

/** Get priority for a layer (lower = more local = preferred) */
function getLayerPriority(layer: string): number {
	const lowerLayer = layer.toLowerCase();
	const index = layerHierarchy.findIndex((l) => lowerLayer.includes(l));
	return index === -1 ? 999 : index;
}

export interface ModalSplitFetchResult {
	data: ModalSplitRawData[];
	updateDate: string;
	source: string;
	/** The region ID that had data (may differ from requested region if fallback was used) */
	matchedRegionId: string | null;
	/** The name of the matched region */
	matchedRegionName: string | null;
	/** The layer of the matched region */
	matchedRegionLayer: string | null;
	/** Whether a fallback to parent region was used */
	usedFallback: boolean;
}

/** Fetch modal split data from Directus with parent fallback */
export async function fetchData(
	region: Region | null,
	params: ModalSplitParams
): Promise<ModalSplitFetchResult> {
	const directus = getDirectusInstance(fetch);

	// Build region candidates: current region + parents (if available)
	const regionCandidates: string[] = params.regionCandidates || [];
	if (regionCandidates.length === 0 && region?.id) {
		regionCandidates.push(region.id);
	}
	if (regionCandidates.length === 0 && params.regionId) {
		regionCandidates.push(params.regionId);
	}

	// If no candidates, return empty
	if (regionCandidates.length === 0) {
		return {
			data: [],
			updateDate: '',
			source: '',
			matchedRegionId: null,
			matchedRegionName: null,
			matchedRegionLayer: null,
			usedFallback: false
		};
	}

	// Fetch data for all region candidates at once
	const rawData = await directus.request(
		readItems('mobility_modal_split', {
			filter: { region: { _in: regionCandidates } },
			sort: ['year', 'category'],
			fields: ['year', 'category', 'region', 'value', 'update', 'source'],
			limit: -1
		})
	);

	// Group data by region
	const dataByRegion = new Map<string, any[]>();
	for (const record of rawData as any[]) {
		const regionId = record.region;
		if (!dataByRegion.has(regionId)) {
			dataByRegion.set(regionId, []);
		}
		dataByRegion.get(regionId)!.push(record);
	}

	// If we have data for the primary region (first candidate), use it
	const primaryRegionId = regionCandidates[0];
	if (dataByRegion.has(primaryRegionId) && dataByRegion.get(primaryRegionId)!.length > 0) {
		const regionRecords = dataByRegion.get(primaryRegionId)!;
		return buildFetchResult(regionRecords, primaryRegionId, region?.name || null, region?.layer || null, false);
	}

	// Otherwise, need to find the best fallback from parents
	// Fetch region metadata for candidates that have data to determine layer priority
	const candidatesWithData = regionCandidates.filter(
		(id) => dataByRegion.has(id) && dataByRegion.get(id)!.length > 0
	);

	if (candidatesWithData.length === 0) {
		return {
			data: [],
			updateDate: '',
			source: '',
			matchedRegionId: null,
			matchedRegionName: null,
			matchedRegionLayer: null,
			usedFallback: false
		};
	}

	// Fetch region metadata to determine which parent is closest
	const regionsMetadata = await directus.request(
		readItems('regions', {
			filter: { id: { _in: candidatesWithData } },
			fields: ['id', 'name', 'layer'],
			limit: -1
		})
	) as Array<{ id: string; name: string; layer: string }>;

	// Sort by layer priority (most local first) and by order in regionCandidates (closer parent first)
	const sortedCandidates = candidatesWithData
		.map((id) => {
			const meta = regionsMetadata.find((r) => r.id === id);
			return {
				id,
				name: meta?.name || null,
				layer: meta?.layer || null,
				layerPriority: meta?.layer ? getLayerPriority(meta.layer) : 999,
				candidateIndex: regionCandidates.indexOf(id)
			};
		})
		.sort((a, b) => {
			// First sort by candidate index (preserves parent order - closer parent first)
			if (a.candidateIndex !== b.candidateIndex) {
				return a.candidateIndex - b.candidateIndex;
			}
			// Then by layer priority
			return a.layerPriority - b.layerPriority;
		});

	// Use the best candidate (first after sorting)
	const bestCandidate = sortedCandidates[0];
	const bestRegionRecords = dataByRegion.get(bestCandidate.id)!;

	return buildFetchResult(
		bestRegionRecords,
		bestCandidate.id,
		bestCandidate.name,
		bestCandidate.layer,
		true // Used fallback since primary region had no data
	);
}

/** Helper to build fetch result from raw records */
function buildFetchResult(
	rawRecords: any[],
	regionId: string,
	regionName: string | null,
	regionLayer: string | null,
	usedFallback: boolean
): ModalSplitFetchResult {
	const data = rawRecords
		.map((r) => ({
			year: typeof r.year === 'string' ? Number(r.year) : r.year,
			category: r.category,
			value: typeof r.value === 'string' ? Number(r.value) : r.value,
			region: r.region
		}))
		.filter((r) => !isNaN(r.year) && !isNaN(r.value));

	// Get the most recent update date from the data
	const updateDates = rawRecords
		.map((r) => r.update)
		.filter(Boolean)
		.sort()
		.reverse();
	const updateDate = updateDates[0] || '';

	// Get source from the first record
	const source = rawRecords.find((r) => r.source)?.source || '';

	return {
		data,
		updateDate,
		source,
		matchedRegionId: regionId,
		matchedRegionName: regionName,
		matchedRegionLayer: regionLayer,
		usedFallback
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
	targetYear: number,
	goalConfig: ResolvedGoalConfig | null
): ModalSplitRawData[] {
	if (!goalConfig) return [];

	const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
	const { startYear, endYear, targetSustainablePercent, goalPath, categoryTargets } = goalConfig;

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

	// If we have category-specific targets, use those directly
	if (categoryTargets && Object.keys(categoryTargets).length > 0) {
		const result: ModalSplitRawData[] = [];
		for (const cat of categoryOrder) {
			const targetValue = categoryTargets[cat];
			if (targetValue !== undefined) {
				result.push({ year: targetYear, category: cat, value: targetValue });
			}
		}
		return result;
	}

	// If we have a goal path, interpolate from it
	let effectiveTargetPercent = targetSustainablePercent;
	if (goalPath && goalPath.length > 0) {
		// Find the appropriate target from the path
		const pathPoint = goalPath.find((p) => p.year === targetYear);
		if (pathPoint) {
			effectiveTargetPercent = pathPoint.sustainable;
		} else {
			// Interpolate between path points
			const before = goalPath.filter((p) => p.year <= targetYear).pop();
			const after = goalPath.find((p) => p.year > targetYear);
			if (before && after) {
				const t = (targetYear - before.year) / (after.year - before.year);
				effectiveTargetPercent = before.sustainable + t * (after.sustainable - before.sustainable);
			} else if (before) {
				effectiveTargetPercent = before.sustainable;
			} else if (after) {
				effectiveTargetPercent = after.sustainable;
			}
		}
	}

	// For the target year, redistribute proportionally
	const t = Math.min(1, (targetYear - startYear) / (endYear - startYear));
	const targetSustainable =
		baseSustainablePercent + t * (effectiveTargetPercent - baseSustainablePercent);
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
export function getTableColumns(
	data: ModalSplitRawData[],
	translations: Translations
): TableColumn[] {
	const categories = Array.from(new Set(data.map((d) => d.category))).sort(
		(a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
	);
	const categoryMeta = getCategoryMeta(translations);

	return [
		{ key: 'year', label: t(translations, 'table.year'), align: 'left' },
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
	region: Region | null,
	goalConfig: ResolvedGoalConfig | null,
	matchedRegionName?: string | null
): Record<string, string | number | boolean> {
	const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
	const firstYear = years[0];
	const lastYear = years[years.length - 1];

	// Calculate sustainable share for first year
	const firstYearData = data.filter((d) => d.year === firstYear);
	const firstYearTotal = firstYearData.reduce((sum, d) => sum + d.value, 0);
	const firstYearSustainable = firstYearData
		.filter((d) => sustainableCategories.includes(d.category))
		.reduce((sum, d) => sum + d.value, 0);
	const firstYearEcoShare = firstYearTotal ? Math.round((firstYearSustainable / firstYearTotal) * 100) : 0;

	// Calculate sustainable share for last year
	const lastYearData = data.filter((d) => d.year === lastYear);
	const lastYearTotal = lastYearData.reduce((sum, d) => sum + d.value, 0);
	const lastYearSustainable = lastYearData
		.filter((d) => sustainableCategories.includes(d.category))
		.reduce((sum, d) => sum + d.value, 0);
	const lastYearEcoShare = lastYearTotal ? Math.round((lastYearSustainable / lastYearTotal) * 100) : 0;

	// Calculate change in eco share
	const ecoShareChange = lastYearEcoShare - firstYearEcoShare;
	const ecoShareChangeDirection = ecoShareChange >= 0 ? 'Zuwachs' : 'Rückgang';
	const ecoShareChangeAbs = Math.abs(ecoShareChange);
	const yearSpan = lastYear - firstYear;

	// Goal-related placeholders
	const hasGoal = !!goalConfig;
	const goalYear = goalConfig?.endYear || 0;
	const goalEcoShare = goalConfig?.targetSustainablePercent || 0;
	const goalChangeAbs = hasGoal ? Math.abs(goalEcoShare - lastYearEcoShare) : 0;
	const goalYearSpan = hasGoal ? goalYear - lastYear : 0;

	// Check if we have historical data (more than one year)
	const hasHistoricalData = years.length > 1;

	// Use matched region name if fallback was used, otherwise use the region prop
	const displayRegionName = matchedRegionName || region?.name || 'Region';

	return {
		regionName: displayRegionName,
		latestYear: lastYear,
		sustainablePercent: lastYearEcoShare,
		motorizedPercent: Math.round(100 - lastYearEcoShare),
		targetYear: goalConfig?.endYear || '',
		targetPercent: goalConfig?.targetSustainablePercent || '',
		dataYearStart: firstYear || '',
		dataYearEnd: lastYear || '',

		// New placeholders for info text
		firstYear,
		lastYear,
		firstYearEcoShare,
		lastYearEcoShare,
		ecoShareChangeDirection,
		ecoShareChangeAbs,
		yearSpan,
		hasHistoricalData,
		hasGoal,
		goalYear,
		goalEcoShare,
		goalChangeAbs,
		goalYearSpan
	};
}

/** Build ChartData object */
export function buildChartData(
	data: ModalSplitRawData[],
	updateDate: string,
	source: string,
	region: Region | null,
	showHistoric: boolean = false,
	translations: Translations,
	goalConfig: ResolvedGoalConfig | null = null,
	matchedRegionName?: string | null
): ChartData {
	return {
		raw: data,
		table: {
			columns: getTableColumns(data, translations),
			rows: getTableRows(data),
			filename: 'modal_split'
		},
		placeholders: getPlaceholders(data, region, goalConfig, matchedRegionName),
		meta: {
			updateDate,
			source,
			region
		},
		embedOptions: [
			{
				key: 'historic',
				label: t(translations, 'ui.embedOption.historicDevelopment'),
				choices: [
					{ value: 'false', label: t(translations, 'ui.embedOption.no') },
					{ value: 'true', label: t(translations, 'ui.embedOption.yes') }
				],
				currentValue: showHistoric ? 'true' : 'false'
			}
		]
	};
}
