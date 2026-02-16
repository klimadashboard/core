// $lib/components/charts/custom/storageExplorer/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { formatNumber } from '$lib/utils/formatters';

// ============================================================================
// TYPES
// ============================================================================

export type ViewMode = 'yearly' | 'cumulative';
export type MetricMode = 'power' | 'units';

export interface StorageCategory {
	key: string;
	label: string;
	color: string;
}

export interface StoragePeriodData {
	period: number | string;
	[key: string]: number | string | undefined;
}

export interface StorageApiResponse {
	by_period: StoragePeriodData[];
	categories: string[];
	update_date: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Category display config — order matters for stacking (battery types only) */
export const categoryConfigs: StorageCategory[] = [
	{ key: 'heimspeicher', label: 'Heimspeicher', color: '#22c55e' },
	{ key: 'gewerbespeicher', label: 'Gewerbespeicher', color: '#3b82f6' },
	{ key: 'grossspeicher', label: 'Großspeicher', color: '#8b5cf6' }
];

/** Earliest period to include for monthly data */
export const MONTHLY_START = '2020-01';

/** Number of recent months where late registrations are expected */
export const LATE_REGISTRATION_MONTHS = 3;

/** Format a period value for display: "2020-01" → "Jan '20", number → "2020" */
export function formatPeriodLabel(period: number | string): string {
	if (typeof period === 'number') return String(period);
	const [year, month] = period.split('-');
	if (!year || !month) return String(period);
	const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
	return `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;
}

/** Convert a period to a numeric value for linear scales: "2020-01" → timestamp */
export function periodToNumber(period: number | string): number {
	if (typeof period === 'number') return period;
	const [year, month] = period.split('-').map(Number);
	return new Date(year!, (month ?? 1) - 1, 1).getTime();
}

/** Map from API prefix to our config key */
function normalizeKey(apiKey: string): string {
	return apiKey
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue');
}

/** Get category config by normalized API key */
export function getCategoryConfig(apiKey: string): StorageCategory | undefined {
	const normalized = normalizeKey(apiKey);
	return categoryConfigs.find((c) => c.key === normalized);
}

/** Get active categories from the API response (only those with data) */
export function getActiveCategories(data: StoragePeriodData[]): StorageCategory[] {
	if (data.length === 0) return [];

	const activePrefixes = new Set<string>();

	for (const row of data) {
		for (const key of Object.keys(row)) {
			if (key === 'period') continue;
			// Extract prefix: e.g. "heimspeicher_added_power_kw" → "heimspeicher"
			const prefix = key.replace(
				/_(added|cumulative|removed)_(power_kw|capacity_kwh|units)$/,
				''
			);
			if (prefix !== key) {
				activePrefixes.add(prefix);
			}
		}
	}

	return categoryConfigs.filter((c) => activePrefixes.has(c.key));
}

/** Get value for a category from a row */
export function getValue(
	row: StoragePeriodData,
	categoryKey: string,
	metric: string
): number {
	const key = `${categoryKey}_${metric}`;
	const val = row[key];
	return typeof val === 'number' ? val : 0;
}

// ============================================================================
// VIEW CONFIGURATION
// ============================================================================

export function getViewLabels(): Record<ViewMode, string> {
	return {
		yearly: 'Monatlicher Zubau',
		cumulative: 'Kumulierte Leistung'
	};
}

export function getViewIcons(): Record<ViewMode, string> {
	return {
		yearly: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
		cumulative: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
	};
}

export function getMetricLabels(): Record<MetricMode, string> {
	return {
		power: 'Kapazität',
		units: 'Anlagen'
	};
}

export function getMetricIcons(): Record<MetricMode, string> {
	return {
		power: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
		units: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="6" height="10" rx="1"/><rect x="9" y="3" width="6" height="14" rx="1"/><rect x="16" y="5" width="6" height="12" rx="1"/></svg>`
	};
}

/** Get the data field suffix for a given view + metric combination */
export function getMetricField(viewMode: ViewMode, metricMode: MetricMode): string {
	const prefix = viewMode === 'yearly' ? 'added' : 'cumulative';
	const suffix = metricMode === 'power' ? 'capacity_kwh' : 'units';
	return `${prefix}_${suffix}`;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

export async function fetchStorageData(
	region: Region | null,
	group: 'year' | 'month' = 'year'
): Promise<StorageApiResponse> {
	const regionCode = region?.codeShort || region?.code;

	let url = `https://base.klimadashboard.org/get-storage-growth?group=${group}`;
	if (regionCode) url += `&region=${regionCode}`;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	return await response.json();
}

// ============================================================================
// TABLE & CHART DATA
// ============================================================================

export function getTableColumns(activeCategories: StorageCategory[]): TableColumn[] {
	const cols: TableColumn[] = [
		{ key: 'period', label: 'Zeitraum', align: 'left' as const }
	];

	for (const cat of activeCategories) {
		cols.push({
			key: `${cat.key}_added_capacity_kwh`,
			label: `${cat.label} Zubau (kWh)`,
			align: 'right' as const,
			format: (v: number) => formatNumber(v)
		});
		cols.push({
			key: `${cat.key}_cumulative_capacity_kwh`,
			label: `${cat.label} Kumuliert (kWh)`,
			align: 'right' as const,
			format: (v: number) => formatNumber(v)
		});
	}

	return cols;
}

function formatUpdateDate(updateDate: string | null): string {
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

export function getPlaceholders(
	data: StoragePeriodData[],
	region: Region | null,
	activeCategories: StorageCategory[],
	updateDate: string | null
): Record<string, string | number> {
	const currentYear = new Date().getFullYear();
	const lastRow = data[data.length - 1];

	// Total cumulative across all categories
	let totalCumulativePower = 0;
	let totalCumulativeCapacity = 0;
	let totalCumulativeUnits = 0;
	let totalAddedPowerThisYear = 0;
	let totalAddedUnitsThisYear = 0;

	const thisYearRow = data.find((d) => d.period === currentYear);

	for (const cat of activeCategories) {
		totalCumulativePower += getValue(lastRow || {}, cat.key, 'cumulative_power_kw');
		totalCumulativeCapacity += getValue(lastRow || {}, cat.key, 'cumulative_capacity_kwh');
		totalCumulativeUnits += getValue(lastRow || {}, cat.key, 'cumulative_units');
		totalAddedPowerThisYear += getValue(thisYearRow || {}, cat.key, 'added_power_kw');
		totalAddedUnitsThisYear += getValue(thisYearRow || {}, cat.key, 'added_units');
	}

	return {
		regionName: region?.name || 'Deutschland',
		currentYear,
		totalCumulativePowerKw: Math.round(totalCumulativePower),
		totalCumulativePowerMW: formatNumber(Math.round(totalCumulativePower / 1000)),
		totalCumulativeCapacityKwh: Math.round(totalCumulativeCapacity),
		totalCumulativeCapacityMWh: formatNumber(Math.round(totalCumulativeCapacity / 1000)),
		totalCumulativeUnits: formatNumber(totalCumulativeUnits),
		totalAddedPowerThisYearKw: Math.round(totalAddedPowerThisYear),
		totalAddedUnitsThisYear: formatNumber(totalAddedUnitsThisYear),
		updateDate: formatUpdateDate(updateDate)
	};
}

export function buildChartData(
	data: StoragePeriodData[],
	region: Region | null,
	activeCategories: StorageCategory[],
	updateDate: string | null,
	viewMode: ViewMode = 'yearly'
): ChartData {
	const formattedDate = formatUpdateDate(updateDate);
	const source = formattedDate
		? `Marktstammdatenregister der Bundesnetzagentur (Stand: ${formattedDate})`
		: 'Marktstammdatenregister der Bundesnetzagentur';

	return {
		raw: data,
		table: {
			columns: getTableColumns(activeCategories),
			rows: data,
			filename: `speicher-${viewMode === 'cumulative' ? 'kumuliert' : 'zubau-monatlich'}`
		},
		placeholders: getPlaceholders(data, region, activeCategories, updateDate),
		meta: {
			updateDate: updateDate || '',
			source,
			region
		}
	};
}

export { formatNumber };
