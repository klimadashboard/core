import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';

export interface Co2PriceRawData {
	date: Date;
	value: number;
}

interface ApiRecord {
	id: number;
	date: string;
	value: number;
	unit: string;
	region: string;
	type: string;
}

export async function fetchData(): Promise<{
	data: Co2PriceRawData[];
	updateDate: string;
}> {
	const url =
		'https://base.klimadashboard.org/items/carbon_prices?filter[region][_eq]=EU&filter[type][_eq]=ETS&sort=date&limit=-1';

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch CO2 price data: ${response.status}`);
	}

	const result = await response.json();
	const records: ApiRecord[] = result.data || [];

	if (records.length === 0) {
		return { data: [], updateDate: new Date().toISOString() };
	}

	const data: Co2PriceRawData[] = records.map((r) => ({
		date: new Date(r.date),
		value: r.value
	}));

	const updateDate = data[data.length - 1].date.toISOString();

	return { data, updateDate };
}

export function getTableColumns(): TableColumn[] {
	return [
		{
			key: 'date',
			label: 'Datum',
			align: 'left',
			format: (v) => (v instanceof Date ? v.toLocaleDateString('de-DE') : String(v))
		},
		{
			key: 'value',
			label: 'Preis (€)',
			align: 'right',
			format: (v) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
					: '–'
		}
	];
}

export function getPlaceholders(data: Co2PriceRawData[]): Record<string, string | number> {
	const lastRow = data[data.length - 1];
	const firstRow = data[0];

	return {
		currentPrice: lastRow
			? lastRow.value.toLocaleString('de-DE', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				})
			: '–',
		currentPriceDate: lastRow ? lastRow.date.toLocaleDateString('de-DE') : '–',
		dataYearStart: firstRow ? firstRow.date.getFullYear() : '',
		dataYearEnd: lastRow ? lastRow.date.getFullYear() : ''
	};
}

export function buildChartData(
	data: Co2PriceRawData[],
	updateDate: string,
	region: Region | null
): ChartData {
	return {
		hasData: data.length > 0,
		raw: data,
		table: {
			columns: getTableColumns(),
			rows: data,
			filename: 'eu-ets-co2-preis'
		},
		placeholders: getPlaceholders(data),
		meta: {
			updateDate,
			source: 'EU ETS',
			region
		}
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const { data, updateDate } = await fetchData();
	if (data.length === 0) return null;
	return buildChartData(data, updateDate, null);
}
