// $lib/components/charts/custom/vehicleRegistrations/config.ts
import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { formatNumber } from '$lib/utils/formatters';

export type DataMode = 'bestand' | 'neuzulassungen';

export interface VehicleParams {
	layer?: 'municipality' | 'district';
	country?: string;
	mode?: DataMode;
}

export interface VehicleShareData {
	key: string;
	label: string;
	color: string;
	share: number; // 0-1
	absolute: number;
	cells: number; // Number of cells in 100-cell grid
}

export interface VehicleRawData {
	year: number;
	total: number;
	categories: Record<string, number>; // Absolute values per category
	shares: Record<string, number>; // Share values (0-1) per category
}

// Category configuration with colors and order
export const categoryConfig: Record<string, { label: string; color: string; order: number }> = {
	Benzin: { label: 'Benzin', color: '#E58A28', order: 0 },
	Diesel: { label: 'Diesel', color: '#9E2668', order: 1 },
	Hybrid: { label: 'Hybrid', color: '#379AC5', order: 2 },
	'Hybrid (ohne Plug-in)': { label: 'Hybrid', color: '#379AC5', order: 2 },
	Elektro: { label: 'Elektro', color: '#097347', order: 3 },
	'Plug-in-Hybrid': { label: 'Plug-in', color: '#1C128E', order: 4 },
	Sonstige: { label: 'Sonstige', color: '#464E5C', order: 5 }
};

// Fallback colors for unknown categories
export const fallbackColors = ['#14B8A6', '#EC4899', '#F97316', '#06B6D4', '#84CC16'];

interface ApiRegionData {
	region: {
		id: string;
		name?: string;
		layer?: string;
		country?: string;
		code?: string;
		code_short?: string;
	};
	aggregated_from?: string;
	data: Record<string, Record<string, number>>; // { "2019": { "Benzin": 1234, ... }, ... }
}

/** Find matching region in API data */
function findRegionMatch(apiData: ApiRegionData[], region: Region | null): ApiRegionData | null {
	if (!region) return null;

	// Try matching by code
	if (region.code) {
		const match =
			apiData.find((a) => a.region?.code === region.code) ||
			apiData.find((a) => a.region?.code_short === region.code);
		if (match) return match;
	}

	// Try matching by codeShort
	if (region.codeShort) {
		const match =
			apiData.find((a) => a.region?.code === region.codeShort) ||
			apiData.find((a) => a.region?.code_short === region.codeShort);
		if (match) return match;
	}

	// Try matching by id
	if (region.id) {
		const match = apiData.find((a) => a.region?.id === region.id);
		if (match) return match;
	}

	// Try matching by name
	if (region.name) {
		const match = apiData.find((a) => a.region?.name?.toLowerCase() === region.name?.toLowerCase());
		if (match) return match;
	}

	return null;
}

/** Fetch Bestand data from the mobility cars endpoint */
async function fetchBestandData(
	region: Region | null,
	params: VehicleParams
): Promise<{ data: VehicleRawData; categories: string[]; updateDate: string; regionName: string }> {
	const layer = params.layer || 'district';
	const country = params.country || 'DE';

	const url = `https://base.klimadashboard.org/get-mobility-cars?layer=${encodeURIComponent(layer)}&country=${encodeURIComponent(country)}&includeMeta=true`;

	const resp = await fetch(url);
	if (!resp.ok) {
		throw new Error(`Endpoint error ${resp.status}`);
	}

	const apiData: ApiRegionData[] = await resp.json();

	// Find matching region or aggregate all
	let regionData: Record<string, Record<string, number>> | null = null;
	let regionName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : country;

	const match = findRegionMatch(apiData, region);
	if (match) {
		regionData = match.data;
		regionName = match.region.name || region?.name || region?.code || regionName;
	}

	// If no specific region, aggregate all non-country regions
	if (!regionData) {
		regionData = aggregateAllRegions(apiData);
	}

	// Get the latest year
	const years = Object.keys(regionData)
		.map((y) => parseInt(y))
		.filter((y) => Number.isFinite(y))
		.sort((a, b) => b - a);

	const latestYear = years[0];
	const yearData = regionData[String(latestYear)] || {};
	const total = yearData['Insgesamt'] || 0;

	// Get all categories (excluding 'Insgesamt')
	const allCategories = Object.keys(yearData).filter((k) => k !== 'Insgesamt');

	// Sort categories by configured order
	const categories = allCategories.sort((a, b) => {
		const orderA = categoryConfig[a]?.order ?? 99;
		const orderB = categoryConfig[b]?.order ?? 99;
		return orderA - orderB;
	});

	// Build raw data for latest year
	const categoriesData: Record<string, number> = {};
	const sharesData: Record<string, number> = {};

	for (const cat of categories) {
		const absolute = yearData[cat] || 0;
		categoriesData[cat] = absolute;
		sharesData[cat] = total > 0 ? absolute / total : 0;
	}

	const data: VehicleRawData = {
		year: latestYear,
		total,
		categories: categoriesData,
		shares: sharesData
	};

	const updateDate = new Date(latestYear, 0, 1).toISOString();

	return { data, categories, updateDate, regionName };
}

/** Fetch Neuzulassungen data from Directus */
async function fetchNeuzulassungenData(
	region: Region | null,
	params: VehicleParams
): Promise<{ data: VehicleRawData; categories: string[]; updateDate: string; regionName: string }> {
	const country = params.country || 'DE';
	const regionCode = region?.id;
	const defaultRegionName =
		country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : country;

	// Build Directus API URL with filters
	const filters = [`filter[country][_eq]=${country}`];
	if (region) {
		filters.push(`filter[region][_eq]=${regionCode}`);
	} else {
		// Default to national level (region = country code)
		filters.push(`filter[region][_eq]=${country}`);
	}

	const url = `https://base.klimadashboard.org/items/mobility_cars_registrations?${filters.join('&')}&sort=-period&limit=-1`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch Neuzulassungen data: ${response.status}`);
	}

	const result = await response.json();
	const records = (result.data || []) as Array<{
		region: string;
		country: string;
		period: string;
		category: string;
		value: number;
		source?: string;
	}>;

	if (records.length === 0) {
		throw new Error('No data found');
	}

	// Get the latest period
	const periods = [...new Set(records.map((r) => r.period))].sort();
	const latestPeriod = periods[periods.length - 1];
	const latestRecords = records.filter((r) => r.period === latestPeriod);

	// Get all categories and sort by configured order
	const categories = [...new Set(latestRecords.map((r) => r.category))].sort((a, b) => {
		const orderA = categoryConfig[a]?.order ?? 99;
		const orderB = categoryConfig[b]?.order ?? 99;
		return orderA - orderB;
	});

	// Build data structure
	const categoriesData: Record<string, number> = {};
	const sharesData: Record<string, number> = {};

	for (const cat of categories) {
		const record = latestRecords.find((r) => r.category === cat);
		const share = record?.value || 0;
		sharesData[cat] = share;
		categoriesData[cat] = 0; // No absolute values in this dataset
	}

	const date = new Date(latestPeriod);
	const year = date.getFullYear();

	const data: VehicleRawData = {
		year,
		total: 0, // No total in share-based data
		categories: categoriesData,
		shares: sharesData
	};

	const updateDate = date.toISOString();
	const regionName = region?.name || defaultRegionName;

	return { data, categories, updateDate, regionName };
}

/** Fetch data based on mode */
export async function fetchData(
	region: Region | null,
	params: VehicleParams
): Promise<{ data: VehicleRawData; categories: string[]; updateDate: string; regionName: string }> {
	if (params.mode === 'neuzulassungen') {
		return fetchNeuzulassungenData(region, params);
	}
	return fetchBestandData(region, params);
}

/** Aggregate data from all regions */
function aggregateAllRegions(apiData: ApiRegionData[]): Record<string, Record<string, number>> {
	const aggregated: Record<string, Record<string, number>> = {};

	// Filter to only non-country regions to avoid double counting
	const subRegions = apiData.filter((a) => a.region?.layer !== 'country');

	for (const regionItem of subRegions) {
		for (const [year, catData] of Object.entries(regionItem.data || {})) {
			if (!aggregated[year]) {
				aggregated[year] = {};
			}
			for (const [cat, value] of Object.entries(catData || {})) {
				aggregated[year][cat] = (aggregated[year][cat] || 0) + (Number(value) || 0);
			}
		}
	}

	return aggregated;
}

/** Convert raw data to waffle chart cell data */
export function buildWaffleData(data: VehicleRawData, categories: string[]): VehicleShareData[] {
	const result: VehicleShareData[] = [];

	// Calculate cells for each category (round to nearest integer)
	const cellCounts: { key: string; cells: number; share: number }[] = [];

	for (const cat of categories) {
		const share = data.shares[cat] || 0;
		const cells = Math.round(share * 100);
		cellCounts.push({ key: cat, cells, share });
	}

	// Adjust for rounding errors (ensure total is exactly 100)
	const totalCells = cellCounts.reduce((sum, c) => sum + c.cells, 0);
	if (totalCells !== 100 && cellCounts.length > 0) {
		// Find the largest category and adjust
		const diff = 100 - totalCells;
		const largestIdx = cellCounts.reduce(
			(maxIdx, c, idx, arr) => (c.cells > arr[maxIdx].cells ? idx : maxIdx),
			0
		);
		cellCounts[largestIdx].cells += diff;
	}

	for (const { key, cells } of cellCounts) {
		const config = categoryConfig[key];
		result.push({
			key,
			label: config?.label || key,
			color: config?.color || fallbackColors[result.length % fallbackColors.length],
			share: data.shares[key] || 0,
			absolute: data.categories[key] || 0,
			cells
		});
	}

	return result;
}

/** Build array of 100 cells for the waffle grid */
export function buildWaffleGrid(waffleData: VehicleShareData[]): string[] {
	const grid: string[] = [];

	for (const category of waffleData) {
		for (let i = 0; i < category.cells; i++) {
			grid.push(category.key);
		}
	}

	return grid;
}

/** Get table columns */
export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'label', label: 'Antriebsart', align: 'left' },
		{ key: 'absolute', label: 'Anzahl', align: 'right', format: (v: number) => formatNumber(v, 0) },
		{
			key: 'share',
			label: 'Anteil',
			align: 'right',
			format: (v: number) => `${(v * 100).toFixed(1)}%`
		}
	];
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: VehicleRawData,
	waffleData: VehicleShareData[],
	regionName: string
): Record<string, string | number> {
	const placeholders: Record<string, string | number> = {
		year: data.year,
		total: formatNumber(data.total, 0),
		totalRaw: data.total,
		regionName
	};

	// Add per-category placeholders
	for (const cat of waffleData) {
		const safeKey = cat.key.replace(/[^a-zA-Z0-9]/g, '_');
		// Use cat.cells (rounded to whole number) for share display
		placeholders[`${safeKey}_share`] = `${cat.cells}%`;
		placeholders[`${safeKey}_shareRaw`] = cat.share;
		placeholders[`${safeKey}_absolute`] = formatNumber(cat.absolute, 0);
		placeholders[`${safeKey}_absoluteRaw`] = cat.absolute;
		placeholders[`${safeKey}_cells`] = cat.cells;
	}

	return placeholders;
}

/** Build ChartData object */
export function buildChartData(
	data: VehicleRawData,
	waffleData: VehicleShareData[],
	updateDate: string,
	regionName: string,
	region: Region | null,
	mode: DataMode = 'bestand'
): ChartData {
	// Transform waffleData to clean table rows
	const tableRows = waffleData.map((cat) => ({
		label: cat.label,
		absolute: cat.absolute,
		share: cat.share
	}));

	const modeLabel = mode === 'neuzulassungen' ? 'neuzulassungen' : 'bestand';

	return {
		// Wrap in array so Card.svelte's `hasData` check works (chartData.raw.length > 0)
		raw: [data],
		table: {
			columns: getTableColumns(),
			rows: tableRows,
			filename: `kfz-${modeLabel}-antriebsarten-${regionName.toLowerCase().replace(/\s+/g, '-')}`
		},
		placeholders: getPlaceholders(data, waffleData, regionName),
		meta: {
			updateDate,
			source: 'Kraftfahrt-Bundesamt (KBA)',
			region
		}
	};
}
