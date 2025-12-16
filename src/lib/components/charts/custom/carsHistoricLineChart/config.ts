// $lib/components/charts/custom/vehicleRegistrations/config.ts
import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import Papa from 'papaparse';

export type DataMode = 'neuzulassungen' | 'bestand';

export interface VehicleParams {
	dataUrl?: string;
	mode?: DataMode;
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

// Category configuration with colors and display order
export const categoryConfig: Record<string, { label: string; color: string; order: number }> = {
	Benzin: { label: 'Benzin', color: '#DC2626', order: 0 },
	Diesel: { label: 'Diesel', color: '#B45309', order: 1 },
	'Hybrid (ohne Plug-in)': { label: 'Hybrid', color: '#EAB308', order: 2 },
	Hybrid: { label: 'Hybrid', color: '#EAB308', order: 2 },
	Elektro: { label: 'Elektro', color: '#047857', order: 3 },
	'Plug-in-Hybrid': { label: 'Plug-in', color: '#1D4ED8', order: 4 },
	Sonstige: { label: 'Sonstige', color: '#6B7280', order: 5 },
	Gas: { label: 'Gas', color: '#6B7280', order: 6 },
	'Sonstige Kraftstoffarten': { label: 'Sonstige', color: '#6B7280', order: 7 }
};

// Fallback colors
export const categoryColors = ['#047857', '#1D4ED8', '#6B7280', '#DC2626', '#B45309', '#EAB308'];

// Categories to exclude from display
const excludedCategories = ['Insgesamt', 'Privat', 'Firmen'];

// Categories to merge into "Sonstige"
const sonstigeCategories = ['Gas', 'Sonstige Kraftstoffarten'];

interface DirectusRecord {
	region: string;
	category: string;
	value: number;
	period: string;
	source: string;
	country: string;
}

/** Fetch Bestand data from Directus */
export async function fetchBestandData(
	region: Region | null
): Promise<{ data: VehicleRawData[]; categories: string[]; updateDate: string }> {
	const regionCode = region?.code || '08111'; // Default to Stuttgart

	// Fetch from Directus - filter by region code (5-digit version)
	const regionCode5 = regionCode.length > 5 ? regionCode.substring(0, 5) : regionCode;
	const url = `https://base.klimadashboard.org/items/mobility_cars?filter[region][_starts_with]=${regionCode5}&filter[country][_eq]=DE&limit=-1`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch Bestand data: ${response.status}`);
	}

	const result = await response.json();
	const records: DirectusRecord[] = result.data || [];

	if (records.length === 0) {
		return { data: [], categories: [], updateDate: new Date().toISOString() };
	}

	// Get unique periods and categories
	const periods = [...new Set(records.map((r) => r.period))].sort();
	const rawCategories = [...new Set(records.map((r) => r.category))].filter(
		(cat) => !excludedCategories.includes(cat)
	);

	// Merge sonstige categories and sort by order
	const categories = rawCategories
		.filter((cat) => !sonstigeCategories.includes(cat))
		.sort((a, b) => {
			const orderA = categoryConfig[a]?.order ?? 99;
			const orderB = categoryConfig[b]?.order ?? 99;
			return orderA - orderB;
		});

	// Add "Sonstige" if any sonstige categories exist
	const hasSonstige = rawCategories.some((cat) => sonstigeCategories.includes(cat));
	if (hasSonstige && !categories.includes('Sonstige')) {
		categories.push('Sonstige');
	}

	// Build time series data with shares
	const data: VehicleRawData[] = periods.map((period) => {
		const periodRecords = records.filter((r) => r.period === period);
		const total =
			periodRecords.find((r) => r.category === 'Insgesamt')?.value ||
			periodRecords.reduce((sum, r) => {
				if (!excludedCategories.includes(r.category)) {
					return sum + r.value;
				}
				return sum;
			}, 0);

		const row: VehicleRawData = {
			date: new Date(parseInt(period), 0, 1) // January 1st of the year
		};

		// Calculate shares for each category
		for (const cat of categories) {
			if (cat === 'Sonstige') {
				// Sum up all sonstige categories
				const sonstigeValue = periodRecords
					.filter((r) => sonstigeCategories.includes(r.category))
					.reduce((sum, r) => sum + r.value, 0);
				row[cat] = total > 0 ? sonstigeValue / total : 0;
			} else {
				const record = periodRecords.find((r) => r.category === cat);
				row[cat] = total > 0 && record ? record.value / total : 0;
			}
		}

		return row;
	});

	const lastRow = data[data.length - 1];
	const updateDate = lastRow?.date?.toISOString() || new Date().toISOString();

	return { data, categories, updateDate };
}

/** Fetch Neuzulassungen data from CSV */
export async function fetchNeuzulassungenData(
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

				const data = results.data
					.filter((d: any) => d[xKey])
					.map((d: any) => ({
						...d,
						date: new Date(d[xKey])
					})) as VehicleRawData[];

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

/** Fetch data based on mode */
export async function fetchData(
	region: Region | null,
	params: VehicleParams
): Promise<{ data: VehicleRawData[]; categories: string[]; updateDate: string }> {
	if (params.mode === 'bestand') {
		return fetchBestandData(region);
	}
	return fetchNeuzulassungenData(params);
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
			label: categoryConfig[cat]?.label || cat,
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
		label: categoryConfig[cat]?.label || cat,
		color: categoryConfig[cat]?.color || categoryColors[i % categoryColors.length]
	}));
}

/** Build ChartData object */
export function buildChartData(
	data: VehicleRawData[],
	categories: string[],
	updateDate: string,
	region: Region | null,
	mode: DataMode = 'neuzulassungen'
): ChartData {
	const tableRows = data.map((d) => ({
		date: d.date,
		...Object.fromEntries(categories.map((cat) => [cat, d[cat]]))
	}));

	return {
		raw: data,
		table: {
			columns: getTableColumns(categories),
			rows: tableRows,
			filename: mode === 'bestand' ? 'kfz-bestand' : 'neuzulassungen'
		},
		placeholders: getPlaceholders(data, categories, region),
		meta: {
			updateDate,
			source:
				mode === 'bestand'
					? 'DESTATIS (GENESIS, Tabelle 46251-0021)'
					: 'Kraftfahrt-Bundesamt (KBA)',
			region
		}
	};
}
