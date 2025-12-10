// $lib/components/charts/custom/vehicleRegistrations/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import Papa from 'papaparse';

export interface VehicleParams {
	dataUrl?: string;
}

export interface VehicleRawData {
	date: Date;
	[key: string]: number | Date;
}

export interface SeriesConfig {
	key: string;
	label: string;
	color: string;
}

// Default colors for categories
export const categoryColors = [
	'#047857', // deeper green
	'#1D4ED8', // saturated blue
	'#6B7280', // neutral gray
	'#DC2626', // bright red
	'#B45309', // warm brown
	'#EAB308' // yellow-gold
];

/** Fetch and parse TSV data */
export async function fetchData(
	_region: Region | null,
	params: VehicleParams
): Promise<{ data: VehicleRawData[]; categories: string[]; updateDate: string }> {
	const url = params.dataUrl || '/data_temp/neuzulassungen-test.tsv';

	return new Promise((resolve, reject) => {
		Papa.parse(url, {
			download: true,
			header: true,
			dynamicTyping: true,
			complete: (results) => {
				const xKey = 'Stichtag';
				const categories = Object.keys(results.data[0] || {}).filter((d) => d !== xKey);

				// Clean & convert dates
				const data = results.data
					.filter((d: any) => d[xKey])
					.map((d: any) => ({
						...d,
						date: new Date(d[xKey])
					})) as VehicleRawData[];

				// Get last date as update date
				const lastRow = data[data.length - 1];
				const updateDate = lastRow?.date?.toISOString() || new Date().toISOString();

				resolve({ data, categories, updateDate });
			},
			error: (error) => {
				reject(new Error(`Failed to parse data: ${error.message}`));
			}
		});
	});
}

/** Get table columns dynamically based on categories */
export function getTableColumns(categories: string[]): TableColumn[] {
	return [
		{
			key: 'date',
			label: 'Datum',
			align: 'left',
			format: (v) => (v instanceof Date ? v.toLocaleDateString('de-DE') : String(v))
		},
		...categories.map((cat) => ({
			key: cat,
			label: cat,
			align: 'right' as const,
			format: (v: number) => (v != null ? `${(v * 100).toFixed(1)}%` : '–')
		}))
	];
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: VehicleRawData[],
	categories: string[],
	_region: Region | null
): Record<string, string | number> {
	const lastRow = data[data.length - 1];
	const currentYear = new Date().getFullYear();

	// Get latest values for each category
	const latestValues: Record<string, string> = {};
	for (const cat of categories) {
		const value = lastRow?.[cat];
		if (typeof value === 'number') {
			latestValues[cat.replace(/[^a-zA-Z0-9]/g, '_')] = `${(value * 100).toFixed(1)}%`;
		}
	}

	return {
		currentYear,
		lastUpdateDate: lastRow?.date instanceof Date ? lastRow.date.toLocaleDateString('de-DE') : '',
		categoryCount: categories.length,
		dataPointCount: data.length,
		...latestValues
	};
}

/** Build series configs from categories */
export function buildSeriesConfigs(categories: string[]): SeriesConfig[] {
	return categories.map((cat, i) => ({
		key: cat,
		label: cat,
		color: categoryColors[i % categoryColors.length]
	}));
}

/** Build ChartData object */
export function buildChartData(
	data: VehicleRawData[],
	categories: string[],
	updateDate: string,
	region: Region | null
): ChartData {
	// Convert data for table (with original Stichtag for display)
	const tableRows = data.map((d) => ({
		date: d.date,
		...Object.fromEntries(categories.map((cat) => [cat, d[cat]]))
	}));

	return {
		raw: data,
		table: {
			columns: getTableColumns(categories),
			rows: tableRows,
			filename: 'neuzulassungen'
		},
		placeholders: getPlaceholders(data, categories, region),
		meta: {
			updateDate,
			source: 'Kraftfahrt-Bundesamt (KBA)',
			region
		}
	};
}
