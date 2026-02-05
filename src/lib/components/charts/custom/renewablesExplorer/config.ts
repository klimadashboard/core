// $lib/components/charts/custom/renewablesChart/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { formatPower, formatNumber, getPowerUnit, convertPowerUnit } from '$lib/utils/formatters';

// ============================================================================
// TYPES
// ============================================================================

export type EnergyType = 'solar' | 'wind';
export type ViewMode = 'yearly' | 'cumulative' | 'map';

export interface RenewablesParams {
	energy: EnergyType;
}

export interface RenewablesRawData {
	year: number;
	net_power_kw: number;
	cumulative_power_kw: number;
	added_units?: number;
	net_units?: number;
	cumulative_units?: number;
}

export interface ComparisonSeries {
	code: string;
	name: string;
	data: RenewablesRawData[];
	color: string;
	isDashed?: boolean;
}

export interface TurbineData {
	id: string;
	operator_id: string;
	name?: string;
	lat: number;
	lon: number;
	net_power_kw: number;
	commissioning_date?: string;
	manufacturer?: string;
	height?: number;
	rotor_diameter?: number;
	municipality?: string;
	district?: string;
	coordinates?: [number, number];
	/** Region ID that "owns" this unit (for highlighting on regional maps) */
	region_owner?: string | null;
}

/** A single point in the goal path (cumulative target for a specific year) */
export interface GoalPathPoint {
	year: number;
	cumulative_power_kw: number;
}

export interface RenewableGoal {
	id: string;
	region_code: string;
	energy_type: EnergyType;
	target_power_kw: number;
	target_year: number;
	source?: string;
	notes?: string;
	/** Optional custom goal path with yearly cumulative targets. If provided, used instead of linear interpolation. */
	goal_path?: GoalPathPoint[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Color palette for comparison regions */
export const comparisonPalette = [
	'#e41a1c',
	'#377eb8',
	'#4daf4a',
	'#984ea3',
	'#ff7f00',
	'#a65628',
	'#f781bf',
	'#999999'
];

/** Get colors based on energy type */
export function getColors(energy: EnergyType): { light: string; dark: string } {
	return energy === 'solar'
		? { light: '#F0E1C2', dark: '#E0A906' }
		: { light: '#E5F3FA', dark: '#003B80' };
}

/** Get single color based on energy type */
export function getColor(energy: EnergyType): string {
	return energy === 'solar' ? '#E0A906' : '#003B80';
}

/** Get available view modes for energy type */
export function getAvailableViews(energy: EnergyType): ViewMode[] {
	if (energy === 'wind') {
		return ['yearly', 'cumulative', 'map'];
	}
	return ['yearly', 'cumulative'];
}

/** Get view labels */
export function getViewLabels(energy: EnergyType): Record<ViewMode, string> {
	return {
		yearly: 'Jährlicher Zubau',
		cumulative: 'Kumulierte Leistung',
		map: energy === 'wind' ? 'Windkraftanlagen' : 'Anlagen'
	};
}

/** Get view icons (simple inline SVGs) */
export function getViewIcons(): Record<ViewMode, string> {
	return {
		yearly: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
		cumulative: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
		map: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`
	};
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/** Fetch renewable goal from Directus */
export async function fetchGoal(
	region: Region | null,
	params: RenewablesParams
): Promise<RenewableGoal | null> {
	const regionCode = region?.codeShort || region?.code;
	if (!regionCode) return null;

	const { energy } = params;

	try {
		// Fetch from Directus - adjust the collection name as needed
		const url = `https://base.klimadashboard.org/items/energy_goals?filter[region][_eq]=${regionCode}&filter[energy][_eq]=${energy}&limit=1`;

		const response = await fetch(url);
		if (!response.ok) return null;

		const result = await response.json();
		const goals = result.data || [];

		if (goals.length === 0) return null;

		// Parse goal_path if present (JSON from Directus)
		// Supports both { year, value } and { year, cumulative_power_kw } formats
		let goalPath: GoalPathPoint[] | undefined;
		if (goals[0].goal_path) {
			try {
				const parsed =
					typeof goals[0].goal_path === 'string'
						? JSON.parse(goals[0].goal_path)
						: goals[0].goal_path;
				if (Array.isArray(parsed)) {
					goalPath = parsed
						.map((p: any) => ({
							year: Number(p.year),
							// Accept either 'value' or 'cumulative_power_kw'
							cumulative_power_kw: Number(p.value ?? p.cumulative_power_kw)
						}))
						.filter((p: GoalPathPoint) => !isNaN(p.year) && !isNaN(p.cumulative_power_kw))
						.sort((a: GoalPathPoint, b: GoalPathPoint) => a.year - b.year);
				}
			} catch (e) {
				console.warn('[config] Failed to parse goal_path:', e);
			}
		}

		return {
			id: goals[0].id,
			region_code: goals[0].region,
			energy_type: goals[0].energy,
			target_power_kw: goals[0].target_power_kw,
			target_year: goals[0].target_year,
			source: goals[0].source,
			notes: goals[0].notes,
			goal_path: goalPath
		};
	} catch (e) {
		console.error('[config] Failed to fetch renewable goal:', e);
		return null;
	}
}

/** Calculate required yearly additions to reach goal.
 * If goal has a goal_path, uses the difference between consecutive path points.
 * Otherwise, distributes remaining capacity evenly across years.
 */
export function calculateRequiredYearlyAdditions(
	currentCumulativeKw: number,
	goal: RenewableGoal,
	startYear: number
): Array<{ year: number; required_kw: number }> {
	// If goal_path is provided, calculate yearly additions from path differences
	if (goal.goal_path && goal.goal_path.length > 0) {
		const result: Array<{ year: number; required_kw: number }> = [];
		const path = goal.goal_path;

		// For each consecutive pair in the path, calculate the yearly addition needed
		for (let i = 0; i < path.length; i++) {
			const current = path[i];
			const previous = i > 0 ? path[i - 1] : null;

			// Skip years before startYear
			if (current.year < startYear) continue;

			// Calculate addition for this year
			const previousCumulative = previous?.cumulative_power_kw ?? currentCumulativeKw;
			const required = current.cumulative_power_kw - previousCumulative;

			if (required > 0) {
				result.push({ year: current.year, required_kw: required });
			}
		}

		return result;
	}

	// Fallback: distribute evenly (original behavior)
	const remainingKw = goal.target_power_kw - currentCumulativeKw;
	if (remainingKw <= 0) return [];

	const yearsRemaining = goal.target_year - startYear + 1;
	if (yearsRemaining <= 0) return [];

	const yearlyRequired = remainingKw / yearsRemaining;

	const result: Array<{ year: number; required_kw: number }> = [];
	for (let year = startYear; year <= goal.target_year; year++) {
		result.push({ year, required_kw: yearlyRequired });
	}

	return result;
}

/** Fetch yearly/cumulative data from API */
export async function fetchData(
	region: Region | null,
	params: RenewablesParams
): Promise<{
	data: RenewablesRawData[];
	updateDate: string;
	gridOperatorCheckedRatio: number | null;
}> {
	const { energy } = params;
	const regionCode = region?.codeShort ? region?.codeShort : region?.code;

	const url = regionCode
		? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${energy}_units&group=year&region=${regionCode}`
		: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${energy}_units&group=year`;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	const result = await response.json();
	return {
		data: result.by_year || [],
		updateDate: result.update_date || '',
		gridOperatorCheckedRatio: result.grid_operator_checked_ratio ?? null
	};
}

/** Fetch comparison region data */
export async function fetchComparisonData(
	code: string,
	params: RenewablesParams
): Promise<RenewablesRawData[]> {
	const { energy } = params;
	const url = `https://base.klimadashboard.org/get-renewables-growth?table=energy_${energy}_units&group=year&region=${code}`;

	try {
		const response = await fetch(url);
		if (!response.ok) return [];
		const result = await response.json();
		return result.by_year || [];
	} catch {
		return [];
	}
}

/** Fetch all turbines with minimal data (ID + coordinates + region_owner) */
export async function fetchAllTurbines(energy: EnergyType): Promise<TurbineData[]> {
	if (typeof window === 'undefined') return [];

	try {
		const url = `https://base.klimadashboard.org/items/energy_${energy}_units?limit=-1&fields=id,lat,lon,region_owner&filter[status][_in]=31,35`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const result = await response.json();
		const items = result.data || [];

		return items
			.filter((d: any) => d.lat && d.lon)
			.map((d: any) => ({
				id: d.id,
				operator_id: '',
				lat: parseFloat(d.lat),
				lon: parseFloat(d.lon),
				net_power_kw: 0,
				coordinates: [parseFloat(d.lon), parseFloat(d.lat)] as [number, number],
				region_owner: d.region_owner || null
			}));
	} catch (error) {
		console.error('Failed to load renewable units:', error);
		return [];
	}
}

/** Fetch detailed turbine data for tooltip */
export async function fetchTurbineDetails(
	id: string,
	energy: EnergyType
): Promise<TurbineData | null> {
	if (typeof window === 'undefined') return null;

	try {
		const url = `https://base.klimadashboard.org/items/energy_${energy}_units/${id}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const result = await response.json();
		const d = result.data;

		if (!d) return null;

		return {
			id: d.id,
			operator_id: d.operator_id || '',
			name: d.name,
			lat: parseFloat(d.lat),
			lon: parseFloat(d.lon),
			net_power_kw: d.net_power_kw || 0,
			commissioning_date: d.commissioning_date,
			manufacturer: d.manufacturer,
			height: d.hub_height_m,
			rotor_diameter: d.rotor_diameter_m,
			municipality: d.municipality,
			district: d.district,
			coordinates: [parseFloat(d.lon), parseFloat(d.lat)] as [number, number]
		};
	} catch (error) {
		console.error('Failed to load turbine details:', error);
		return null;
	}
}

/** @deprecated - Use fetchAllTurbines instead */
export async function fetchTurbines(
	center: [string, string],
	energy: EnergyType,
	radius: number = 100
): Promise<TurbineData[]> {
	const lon = parseFloat(center[0]);
	const lat = parseFloat(center[1]);

	if (isNaN(lat) || isNaN(lon)) {
		console.error('Invalid coordinates:', { lat, lon });
		return [];
	}

	const url = `https://base.klimadashboard.org/get-nearby-${energy}-units?lat=${lat}&lon=${lon}&radius_km=${radius}&status=31,35`;

	try {
		const response = await fetch(url);
		const data = await response.json();

		return data
			.filter((d: any) => d.lat && d.lon && d.net_power_kw)
			.map((d: any) => ({
				...d,
				coordinates: [parseFloat(d.lon), parseFloat(d.lat)] as [number, number]
			}));
	} catch (error) {
		console.error('Failed to load renewable units:', error);
		return [];
	}
}

// ============================================================================
// TABLE & CHART DATA BUILDERS
// ============================================================================

/** Get table columns */
export function getTableColumns(_params: RenewablesParams): TableColumn[] {
	return [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'net_power_kw',
			label: 'Zubau (kWp)',
			align: 'right',
			format: (v) => formatNumber(v)
		},
		{
			key: 'cumulative_power_kw',
			label: 'Kumulierte Leistung (kWp)',
			align: 'right',
			format: (v) => formatNumber(v)
		}
	];
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: RenewablesRawData[],
	region: Region | null,
	params: RenewablesParams,
	goal?: RenewableGoal | null,
	updateDate?: string,
	gridOperatorCheckedRatio?: number | null
): Record<string, string | number> {
	const { energy } = params;
	const currentYear = new Date().getFullYear();
	const currentYearData = data.find((d) => d.year === currentYear);
	const lastPositive = [...data].reverse().find((d) => d.net_power_kw > 0);
	const lastEntry = data[data.length - 1];
	const prevYearData = data.find((d) => d.year === currentYear - 1);

	// Calculate growth percentage
	const growthPercent =
		prevYearData && prevYearData.cumulative_power_kw > 0
			? (
					((lastEntry?.cumulative_power_kw - prevYearData.cumulative_power_kw) /
						prevYearData.cumulative_power_kw) *
					100
				).toFixed(1)
			: '0';

	// Goal-related placeholders
	const goalPlaceholders: Record<string, string | number> = {};
	if (goal) {
		const currentCumulative = lastEntry?.cumulative_power_kw || 0;
		const remaining = goal.target_power_kw - currentCumulative;
		const yearsRemaining = goal.target_year - currentYear;
		const yearlyRequired = yearsRemaining > 0 ? remaining / yearsRemaining : 0;

		goalPlaceholders.goalTargetPower = formatPower(goal.target_power_kw, energy);
		goalPlaceholders.goalTargetPowerRaw = goal.target_power_kw;
		goalPlaceholders.goalTargetYear = goal.target_year;
		goalPlaceholders.goalRemainingPower = formatPower(Math.max(0, remaining), energy);
		goalPlaceholders.goalRemainingPowerRaw = Math.max(0, remaining);
		goalPlaceholders.goalYearlyRequired = formatPower(Math.max(0, yearlyRequired), energy);
		goalPlaceholders.goalYearlyRequiredRaw = Math.max(0, yearlyRequired);
		goalPlaceholders.goalProgress = ((currentCumulative / goal.target_power_kw) * 100).toFixed(1);
	}

	// Format update date
	let updateDateFormatted = '';
	if (updateDate) {
		try {
			const date = new Date(updateDate);
			updateDateFormatted = date.toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			updateDateFormatted = updateDate;
		}
	}

	// Calculate unverified percentage from grid operator checked ratio
	const unverifiedPercent =
		gridOperatorCheckedRatio != null ? (100 - gridOperatorCheckedRatio).toFixed(1) : '';
	const verifiedPercent =
		gridOperatorCheckedRatio != null ? gridOperatorCheckedRatio.toFixed(1) : '';

	// Calculate dataYearEnd as last completed year (previous year) and dataYearStart as 10 years before
	const lastCompletedYear = currentYear - 1;
	const dataYearEnd = lastCompletedYear;
	const dataYearStart = lastCompletedYear - 10;

	// Find the strongest year (year with highest net_power_kw) - only consider completed years
	const completedYearsData = data.filter((d) => d.year <= lastCompletedYear);
	const strongestYearData = completedYearsData.reduce(
		(max, d) => (d.net_power_kw > (max?.net_power_kw || 0) ? d : max),
		null as RenewablesRawData | null
	);

	// Get data for specific years
	const dataYearStartData = data.find((d) => d.year === dataYearStart);
	const dataYearEndData = data.find((d) => d.year === dataYearEnd);

	// Build titleWind placeholder for wind energy
	let titleWind = '';
	if (energy === 'wind') {
		const regionDisplayName = region?.name || 'Deutschland';
		const totalCumulativeUnits = lastEntry?.cumulative_units || 0;

		if (totalCumulativeUnits === 0) {
			// No wind turbines in operation
			titleWind = `In ${regionDisplayName} ist aktuell kein Windrad in Betrieb.`;
		} else {
			// Find the most recent year with new installations
			const lastYearWithInstallation = [...data].reverse().find((d) => (d.added_units || 0) > 0);
			if (lastYearWithInstallation) {
				titleWind = `Zuletzt wurde im Jahr ${lastYearWithInstallation.year} ein Windrad in ${regionDisplayName} in Betrieb genommen.`;
			} else {
				// Has cumulative but no yearly data - fallback
				titleWind = `In ${regionDisplayName} sind Windräder in Betrieb.`;
			}
		}
	}

	return {
		regionName: region?.name || 'Deutschland',
		currentYear,
		currentYearPower: formatPower(currentYearData?.net_power_kw || 0, energy),
		currentYearPowerRaw: currentYearData?.net_power_kw || 0,
		totalInstalled: formatPower(lastEntry?.cumulative_power_kw || 0, energy),
		totalInstalledRaw: lastEntry?.cumulative_power_kw || 0,
		currentYearAddition: formatPower(currentYearData?.net_power_kw || 0, energy),
		lastYearWithData: lastPositive?.year || currentYear,
		growthPercent,
		energyType: energy,
		energyLabel: energy === 'solar' ? 'Solar' : 'Wind',
		dataYearStart,
		dataYearEnd,
		// Cumulative values at dataYearStart and dataYearEnd
		dataYearStartPower: formatPower(dataYearStartData?.cumulative_power_kw || 0, energy),
		dataYearStartPowerRaw: dataYearStartData?.cumulative_power_kw || 0,
		dataYearEndPower: formatPower(dataYearEndData?.cumulative_power_kw || 0, energy),
		dataYearEndPowerRaw: dataYearEndData?.cumulative_power_kw || 0,
		// Strongest year placeholders
		strongestYear: strongestYearData?.year || lastCompletedYear,
		strongestYearPower: formatPower(strongestYearData?.net_power_kw || 0, energy),
		strongestYearPowerRaw: strongestYearData?.net_power_kw || 0,
		// New placeholders for installation counts
		currentYearUnits: formatNumber(currentYearData?.added_units || 0),
		currentYearUnitsRaw: currentYearData?.added_units || 0,
		totalUnits: formatNumber(lastEntry?.cumulative_units || 0),
		totalUnitsRaw: lastEntry?.cumulative_units || 0,
		// New placeholder for update date
		updateDate: updateDateFormatted,
		// New placeholders for verification status
		unverifiedPercent,
		verifiedPercent,
		// Wind-specific title placeholder
		titleWind,
		...goalPlaceholders
	};
}

/** Format update date for display */
function formatUpdateDateForSource(updateDate: string | undefined): string {
	if (!updateDate) return '';
	try {
		const date = new Date(updateDate);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	} catch {
		return updateDate;
	}
}

/** Build ChartData object */
export function buildChartData(
	data: RenewablesRawData[],
	updateDate: string,
	region: Region | null,
	params: RenewablesParams,
	viewMode: ViewMode = 'yearly',
	goal?: RenewableGoal | null,
	gridOperatorCheckedRatio?: number | null
): ChartData {
	const formattedDate = formatUpdateDateForSource(updateDate);
	const source = formattedDate
		? `Marktstammdatenregister der Bundesnetzagentur (Stand: ${formattedDate})`
		: 'Marktstammdatenregister der Bundesnetzagentur';

	return {
		raw: data,
		table: {
			columns: getTableColumns(params),
			rows: data,
			filename: `${params.energy}-${viewMode === 'cumulative' ? 'kumuliert' : 'zubau-jaehrlich'}`
		},
		placeholders: getPlaceholders(data, region, params, goal, updateDate, gridOperatorCheckedRatio),
		meta: {
			updateDate,
			source,
			region
		}
	};
}

// ============================================================================
// UTILITIES
// ============================================================================

/** Calculate distance between two coordinates (Haversine formula) */
export function getDistance(
	center1: [number, number] | null,
	center2: [number, number] | null
): number {
	if (!center1 || !center2) return Infinity;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const R = 6371;
	const dLat = toRad(center2[1] - center1[1]);
	const dLon = toRad(center2[0] - center1[0]);
	const lat1 = toRad(center1[1]);
	const lat2 = toRad(center2[1]);
	const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/** Format power for display */
export function formatPowerValue(value: number): string {
	if (value >= 1000) {
		return `${(value / 1000).toFixed(2)} MW`;
	}
	return `${value.toFixed(0)} kW`;
}

/** Re-export formatters for convenience */
export { formatPower, formatNumber, getPowerUnit, convertPowerUnit };
