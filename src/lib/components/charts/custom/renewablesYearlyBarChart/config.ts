// $lib/charts/custom/renewablesYearlyBar/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { formatPower, formatNumber, getPowerUnit } from '$lib/utils/formatters';

export interface RenewablesParams {
	energy: 'solar' | 'wind';
}

export interface RenewablesRawData {
	year: number;
	net_power_kw: number;
	cumulative_power_kw: number;
}

/** Fetch data from API */
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

/** Get table columns */
export function getTableColumns(params: RenewablesParams): TableColumn[] {
	const { energy } = params;
	return [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'net_power_kw',
			label: `Zubau`,
			align: 'right',
			format: (v) => formatPower(v, energy)
		},
		{
			key: 'cumulative_power_kw',
			label: `Kumuliert`,
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

	return {
		regionName: region?.name || 'Deutschland',
		currentYear,
		currentYearPower: formatPower(currentYearData?.net_power_kw || 0, energy),
		currentYearPowerRaw: currentYearData?.net_power_kw || 0,
		totalInstalled: formatPower(lastEntry?.cumulative_power_kw || 0, energy),
		lastYearWithData: lastPositive?.year || currentYear,
		energyType: energy,
		energyLabel: energy === 'solar' ? 'Solar' : 'Wind'
	};
}

/** Get color based on energy type */
export function getColor(params: RenewablesParams): string {
	return params.energy === 'solar' ? '#E0A906' : '#003B80';
}

/** Build ChartData object */
export function buildChartData(
	data: RenewablesRawData[],
	updateDate: string,
	region: Region | null,
	params: RenewablesParams
): ChartData {
	return {
		raw: data,
		table: {
			columns: getTableColumns(params),
			rows: data,
			filename: `${params.energy}-zubau-jaehrlich`
		},
		placeholders: getPlaceholders(data, region, params),
		meta: {
			updateDate,
			source: 'Marktstammdatenregister der Bundesnetzagentur',
			region
		}
	};
}
