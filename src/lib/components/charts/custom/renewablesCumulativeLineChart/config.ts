// $lib/components/charts/custom/renewablesCumulativeLineChart/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { formatPower, formatNumber } from '$lib/utils/formatters';
import { readItem } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

export interface CumulativeParams {
	energy: 'solar' | 'wind';
}

export interface CumulativeRawData {
	year: number;
	net_power_kw: number;
	cumulative_power_kw: number;
}

export interface ComparisonSeries {
	code: string;
	name: string;
	data: CumulativeRawData[];
	color: string;
	isDashed?: boolean;
}

/** Fetch data from API */
export async function fetchData(
	region: Region | null,
	params: CumulativeParams
): Promise<{ data: CumulativeRawData[]; updateDate: string }> {
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
	params: CumulativeParams
): Promise<CumulativeRawData[]> {
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

/** Get table columns */
export function getTableColumns(params: CumulativeParams): TableColumn[] {
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
	data: CumulativeRawData[],
	region: Region | null,
	params: CumulativeParams
): Record<string, string | number> {
	const { energy } = params;
	const currentYear = new Date().getFullYear();
	const currentYearData = data.find((d) => d.year === currentYear);
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
		totalInstalled: formatPower(lastEntry?.cumulative_power_kw || 0, energy),
		totalInstalledRaw: lastEntry?.cumulative_power_kw || 0,
		currentYearAddition: formatPower(currentYearData?.net_power_kw || 0, energy),
		growthPercent,
		energyType: energy,
		energyLabel: energy === 'solar' ? 'Solar' : 'Wind',
		dataYearStart: data[0]?.year || currentYear,
		dataYearEnd: lastEntry?.year || currentYear
	};
}

/** Get colors based on energy type */
export function getColors(params: CumulativeParams): { light: string; dark: string } {
	return params.energy === 'solar'
		? { light: '#F0E1C2', dark: '#E0A906' }
		: { light: '#E5F3FA', dark: '#003B80' };
}

/** Palette for comparison regions */
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

/** Build ChartData object */
export function buildChartData(
	data: CumulativeRawData[],
	updateDate: string,
	region: Region | null,
	params: CumulativeParams
): ChartData {
	return {
		raw: data,
		table: {
			columns: getTableColumns(params),
			rows: data,
			filename: `${params.energy}-kumuliert`
		},
		placeholders: getPlaceholders(data, region, params),
		meta: {
			updateDate,
			source: 'Marktstammdatenregister der Bundesnetzagentur',
			region
		}
	};
}

/** Calculate distance between two coordinates */
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

export async function fetchChartData({
	regionId,
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	let region: Region | null = null;

	if (regionId) {
		const directus = getDirectusInstance(fetchFn);
		const raw = await directus.request(
			readItem('regions', regionId, {
				fields: ['id', 'code', 'code_short', 'name', 'layer']
			})
		) as any;
		region = { ...raw, codeShort: raw.code_short } as Region;
	}

	const params = { energy: 'solar' as const };
	const { data, updateDate } = await fetchData(region, params);
	if (!data || data.length === 0) return null;

	return buildChartData(data, updateDate, region, params);
}
