// $lib/components/charts/custom/renewableShare/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { formatNumber, formatPercent, formatDate } from '$lib/utils/formatters';
import { PUBLIC_VERSION } from '$env/static/public';
import dayjs from 'dayjs';

// ============================================================================
// TYPES
// ============================================================================

export type CategoryType = 'day' | 'month' | 'year';
export type ViewMode = 'day' | 'month' | 'year';

export interface RenewableShareParams {
	category: CategoryType;
}

export interface RenewableShareRawData {
	id: string;
	period: string;
	value: number;
	category: CategoryType;
	country: string;
}

export interface ProcessedDataPoint {
	period: string;
	value: number;
	label: string;
	isComplete: boolean; // Whether this period is complete (not current/partial)
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Get color based on whether renewable share hit 100% */
export function getBarColor(value: number): string {
	return value >= 100 ? '#3FB375' : '#c1c1c1';
}

/** Green color for highlights */
export const GREEN_COLOR = '#3FB375';

/** Get view labels */
export function getViewLabels(): Record<ViewMode, string> {
	return {
		day: 'Tage',
		month: 'Monate',
		year: 'Jahre'
	};
}

/** Get start date for data fetching based on category */
export function getStartDate(category: CategoryType): string {
	if (category === 'year') {
		return '2020-01-01';
	}
	return '2024-01-01';
}

// ============================================================================
// DATA PROCESSING
// ============================================================================

/** Format period label based on category */
export function formatPeriodLabel(period: string, category: CategoryType): string {
	const date = dayjs(period);
	if (category === 'day') {
		return date.format('DD.MM.YYYY');
	} else if (category === 'month') {
		return date.format('MM.YYYY');
	} else {
		return date.format('YYYY');
	}
}

/** Filter data to only include complete periods */
export function filterCompletePeriods(
	data: RenewableShareRawData[],
	category: CategoryType
): RenewableShareRawData[] {
	const today = dayjs();

	if (category === 'year') {
		// Keep only first entry per year for years that are complete
		const seenYears = new Set<number>();
		return data.filter((d) => {
			const year = dayjs(d.period).year();
			if (seenYears.has(year)) return false;
			if (year >= today.year()) return false; // Exclude current year
			seenYears.add(year);
			return true;
		});
	} else if (category === 'month') {
		// Keep only first entry per month for months that are complete
		const seenMonths = new Set<string>();
		return data.filter((d) => {
			const month = dayjs(d.period).format('YYYY-MM');
			if (seenMonths.has(month)) return false;
			if (dayjs(d.period).isSame(today, 'month') || dayjs(d.period).isAfter(today, 'month')) {
				return false; // Exclude current/future months
			}
			seenMonths.add(month);
			return true;
		});
	}
	// For days, return all (they're already complete by nature)
	return data;
}

/** Process raw data into chart-ready format */
export function processData(
	data: RenewableShareRawData[],
	category: CategoryType
): ProcessedDataPoint[] {
	const filtered = filterCompletePeriods(data, category);
	return filtered.map((d) => ({
		period: d.period,
		value: d.value,
		label: formatPeriodLabel(d.period, category),
		isComplete: true
	}));
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/** Fetch renewable share data from Directus */
export async function fetchData(
	category: CategoryType
): Promise<{ data: RenewableShareRawData[]; updateDate: string }> {
	const startDate = getStartDate(category);
	const country = PUBLIC_VERSION.toUpperCase();

	const url = `https://base.klimadashboard.org/items/energy_renewable_share?filter[category][_eq]=${category}&filter[country][_eq]=${country}&filter[period][_gte]=${startDate}&sort=period&limit=-1`;

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const result = await response.json();
		const data = result.data || [];

		// Get update date from most recent entry
		const updateDate = data.length > 0 ? data[data.length - 1].period : '';

		return { data, updateDate };
	} catch (error) {
		console.error('[renewableShare] Failed to fetch data:', error);
		return { data: [], updateDate: '' };
	}
}

/** Fetch last 365 days of data for summary statistics */
export async function fetchYearlyStats(): Promise<RenewableShareRawData[]> {
	const country = PUBLIC_VERSION.toUpperCase();
	const startDate = dayjs().subtract(1, 'year').format('YYYY-MM-DD');

	const url = `https://base.klimadashboard.org/items/energy_renewable_share?filter[category][_eq]=day&filter[country][_eq]=${country}&filter[period][_gte]=${startDate}&sort=-period&limit=-1`;

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const result = await response.json();
		return result.data || [];
	} catch (error) {
		console.error('[renewableShare] Failed to fetch yearly stats:', error);
		return [];
	}
}

// ============================================================================
// TABLE & CHART DATA BUILDERS
// ============================================================================

/** Get table columns */
export function getTableColumns(category: CategoryType): TableColumn[] {
	const periodLabel = category === 'day' ? 'Datum' : category === 'month' ? 'Monat' : 'Jahr';
	return [
		{ key: 'label', label: periodLabel, align: 'left' },
		{
			key: 'value',
			label: 'Erneuerbarer Anteil',
			align: 'right',
			format: (v) => formatPercent(v, 1)
		}
	];
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: ProcessedDataPoint[],
	category: CategoryType,
	yearlyStats: RenewableShareRawData[]
): Record<string, string | number> {
	// Count days with 100% renewable in last year
	const daysAt100 = yearlyStats.filter((d) => d.value >= 100).length;

	// Calculate average renewable share in last year
	const avgShare =
		yearlyStats.length > 0
			? Math.round(yearlyStats.reduce((sum, d) => sum + d.value, 0) / yearlyStats.length)
			: 0;

	// Get max and min values from current dataset
	const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;
	const minValue = data.length > 0 ? Math.min(...data.map((d) => d.value)) : 0;

	return {
		daysAt100,
		avgShare,
		maxValue: formatPercent(maxValue, 1),
		maxValueRaw: maxValue,
		minValue: formatPercent(minValue, 1),
		minValueRaw: minValue,
		dataPoints: data.length,
		category
	};
}

/** Build ChartData object */
export function buildChartData(
	data: ProcessedDataPoint[],
	category: CategoryType,
	yearlyStats: RenewableShareRawData[],
	updateDate: string
): ChartData {
	const formattedDate = updateDate ? formatDate(updateDate) : '';
	const source = formattedDate
		? `ENTSO-E Transparency Platform (Stand: ${formattedDate})`
		: 'ENTSO-E Transparency Platform';

	return {
		raw: data,
		table: {
			columns: getTableColumns(category),
			rows: data,
			filename: `renewable-share-${category}`
		},
		placeholders: getPlaceholders(data, category, yearlyStats),
		meta: {
			updateDate,
			source
		}
	};
}

export async function fetchChartData(_params: ChartFetchParams): Promise<ChartData | null> {
	const category: CategoryType = 'day';
	const { data, updateDate } = await fetchData(category);
	if (data.length === 0) return null;

	const processed = processData(data, category);
	const yearlyStats = await fetchYearlyStats();
	return buildChartData(processed, category, yearlyStats, updateDate);
}
