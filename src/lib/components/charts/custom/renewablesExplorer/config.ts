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
}

export interface ComparisonSeries {
	code: string;
	name: string;
	data: RenewablesRawData[];
	color: string;
	isDashed?: boolean;
}

export interface TurbineData {
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

/** Fetch yearly/cumulative data from API */
export async function fetchData(
	region: Region | null,
	params: RenewablesParams
): Promise<{ data: RenewablesRawData[]; updateDate: string }> {
	const { energy } = params;
	const regionCode = region?.codeShort;

	const url = regionCode
		? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${energy}_units&group=year&region=${regionCode}`
		: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${energy}_units&group=year`;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	const result = await response.json();
	return {
		data: result.by_year || [],
		updateDate: result.update_date || ''
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

/** Fetch turbine/unit data for map view */
export async function fetchTurbines(
	center: [string, string],
	energy: EnergyType,
	radius: number = 50
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
export function getTableColumns(params: RenewablesParams): TableColumn[] {
	const { energy } = params;
	return [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'net_power_kw',
			label: 'Zubau',
			align: 'right',
			format: (v) => formatPower(v, energy)
		},
		{
			key: 'cumulative_power_kw',
			label: 'Kumuliert',
			align: 'right',
			format: (v) => formatPower(v, energy)
		}
	];
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: RenewablesRawData[],
	region: Region | null,
	params: RenewablesParams
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
		dataYearStart: data[0]?.year || currentYear,
		dataYearEnd: lastEntry?.year || currentYear
	};
}

/** Build ChartData object */
export function buildChartData(
	data: RenewablesRawData[],
	updateDate: string,
	region: Region | null,
	params: RenewablesParams,
	viewMode: ViewMode = 'yearly'
): ChartData {
	return {
		raw: data,
		table: {
			columns: getTableColumns(params),
			rows: data,
			filename: `${params.energy}-${viewMode === 'cumulative' ? 'kumuliert' : 'zubau-jaehrlich'}`
		},
		placeholders: getPlaceholders(data, region, params),
		meta: {
			updateDate,
			source: 'Marktstammdatenregister der Bundesnetzagentur',
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
