// $lib/components/charts/custom/vehicleRegistrations/config.ts
import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { formatNumber } from '$lib/utils/formatters';
import { PUBLIC_VERSION } from '$env/static/public';

export type DataMode = 'bestand' | 'neuzulassungen';

// Get country code from PUBLIC_VERSION
const getCountryCode = () => PUBLIC_VERSION.toUpperCase();

// Layer hierarchy for fallback (smallest/most local first)
const layerHierarchy = [
	'municipality',
	'gemeinde',
	'district',
	'bezirk',
	'kreis',
	'landkreis',
	'city',
	'stadt',
	'region',
	'regierungsbezirk',
	'bundesland',
	'state',
	'country',
	'land'
];

/** Get priority for a layer (lower = more local = preferred) */
function getLayerPriority(layer: string): number {
	const lowerLayer = layer.toLowerCase();
	const index = layerHierarchy.findIndex((l) => lowerLayer.includes(l));
	return index === -1 ? 999 : index;
}

export interface VehicleParams {
	layer?: 'municipality' | 'district';
	mode?: DataMode;
}

export interface FetchResult {
	data: VehicleRawData;
	categories: string[];
	updateDate: string;
	source: string;
	regionId: string;
	regionName: string;
	regionLayerLabel: string;
	layerPriority: number;
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
// Colors chosen to work well in both light and dark modes
export const categoryConfig: Record<string, { label: string; color: string; order: number }> = {
	Benzin: { label: 'Benzin', color: '#F59E0B', order: 0 },
	Diesel: { label: 'Diesel', color: '#DB2777', order: 1 },
	Hybrid: { label: 'Hybrid', color: '#38BDF8', order: 2 },
	'Hybrid (ohne Plug-in)': { label: 'Hybrid', color: '#38BDF8', order: 2 },
	Elektro: { label: 'Elektro', color: '#10B981', order: 3 },
	'Plug-in-Hybrid': { label: 'Plug-in', color: '#8B5CF6', order: 4 },
	Gas: { label: 'Gas', color: '#EF4444', order: 5 },
	Sonstige: { label: 'Sonstige', color: '#94A3B8', order: 99 }
};

// Fallback colors (work in both light and dark modes)
export const fallbackColors = ['#10B981', '#3B82F6', '#94A3B8', '#EF4444', '#F59E0B'];

/** Fetch Bestand data from the mobility cars endpoint */
async function fetchBestandData(
	region: Region | null
): Promise<{ data: VehicleRawData; categories: string[]; updateDate: string; regionName: string; source: string } | null> {
	const country = getCountryCode();

	// Use the custom endpoint that handles region lookup and aggregation
	// The endpoint accepts region IDs (UUIDs) and looks them up internally
	const regionKey = region?.id || (country === 'DE' ? 'DE' : country);
	const url = `https://base.klimadashboard.org/get-mobility-cars?region=${encodeURIComponent(regionKey)}&country=${country}&includeMeta=true`;

	const resp = await fetch(url);

	if (!resp.ok) {
		// 404 or 400 means no data for this region
		if (resp.status === 404 || resp.status === 400) {
			return null;
		}
		throw new Error(`Endpoint error ${resp.status}`);
	}

	const result = await resp.json();

	// Handle error responses from the endpoint
	if (result.error) {
		return null;
	}

	// The endpoint returns { region: {...}, data: { [year]: { [category]: value } } }
	const yearData = result.data || {};
	const periods = Object.keys(yearData).sort();
	const regionName = result.region?.name || region?.name || (country === 'DE' ? 'Deutschland' : country);

	if (periods.length === 0) {
		return null;
	}

	// Get the latest year
	const years = periods
		.map((y) => parseInt(y))
		.filter((y) => Number.isFinite(y))
		.sort((a, b) => b - a);

	const latestYear = years[0];
	const latestYearData = yearData[String(latestYear)] || {};
	const total = latestYearData['Insgesamt'] || 0;

	// Get all categories (excluding 'Insgesamt', 'Privat', 'Firmen' which are ownership types, not drive types)
	const excludedCategories = ['Insgesamt', 'Privat', 'Firmen'];
	const allCategories = Object.keys(latestYearData).filter((k) => !excludedCategories.includes(k));

	// If no usable categories found (only Privat/Firmen/Insgesamt), return null to trigger fallback
	if (allCategories.length === 0) {
		return null;
	}

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
		const absolute = latestYearData[cat] || 0;
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

	// Source from DESTATIS
	const source = 'DESTATIS';

	return { data, categories, updateDate, regionName, source };
}

/** Fetch Neuzulassungen data from Directus */
async function fetchNeuzulassungenData(
	region: Region | null
): Promise<{ data: VehicleRawData; categories: string[]; updateDate: string; regionName: string; source: string } | null> {
	const country = getCountryCode();
	const regionCode = region?.id || country;
	const defaultRegionName =
		country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : country;

	// Build Directus API URL with filters
	const url = `https://base.klimadashboard.org/items/mobility_cars_registrations?filter[region][_eq]=${regionCode}&filter[country][_eq]=${country}&sort=-period&limit=-1`;

	const response = await fetch(url);
	if (!response.ok) {
		return null;
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
		return null;
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

	// Build data structure - values are now absolute numbers
	const categoriesData: Record<string, number> = {};
	const sharesData: Record<string, number> = {};

	// First pass: collect absolute values and calculate total
	let total = 0;
	for (const cat of categories) {
		const record = latestRecords.find((r) => r.category === cat);
		const absolute = record?.value || 0;
		categoriesData[cat] = absolute;
		total += absolute;
	}

	// Second pass: calculate shares from absolute values
	for (const cat of categories) {
		sharesData[cat] = total > 0 ? categoriesData[cat] / total : 0;
	}

	const date = new Date(latestPeriod);
	const year = date.getFullYear();

	const data: VehicleRawData = {
		year,
		total,
		categories: categoriesData,
		shares: sharesData
	};

	const updateDate = date.toISOString();
	const regionName = region?.name || defaultRegionName;

	// Extract source from first record
	const source = records[0]?.source || '';

	return { data, categories, updateDate, regionName, source };
}

/** Fetch data for multiple region candidates and return the best match (most local with data) */
export async function fetchDataWithFallback(
	regionCandidates: Array<{ id: string; name: string; layer?: string; layer_label?: string }>,
	params: VehicleParams
): Promise<FetchResult | null> {
	const country = getCountryCode();
	const countryName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : country;

	// If no candidates, add country as fallback
	const candidates = regionCandidates.length > 0
		? regionCandidates
		: [{ id: country, name: countryName, layer: 'country', layer_label: 'Land' }];

	// Try fetching for each candidate in parallel
	const results = await Promise.all(
		candidates.map(async (candidate) => {
			try {
				// Create a minimal Region object for the fetch functions
				const regionObj: Region = {
					id: candidate.id,
					name: candidate.name,
					layer: candidate.layer || 'unknown'
				} as Region;

				const result = params.mode === 'neuzulassungen'
					? await fetchNeuzulassungenData(regionObj)
					: await fetchBestandData(regionObj);

				if (result && Object.keys(result.data.shares).length > 0) {
					return {
						...result,
						regionId: candidate.id,
						regionName: result.regionName || candidate.name,
						// Use layer_label from the region object (passed from getRegion), not from API response
						regionLayerLabel: candidate.layer_label || '',
						layerPriority: getLayerPriority(candidate.layer || 'unknown')
					} as FetchResult;
				}
			} catch {
				// Ignore errors, try next candidate
			}
			return null;
		})
	);

	// Filter out null results and sort by layer priority (lowest = most local)
	const validResults = results.filter((r): r is FetchResult => r !== null);
	validResults.sort((a, b) => a.layerPriority - b.layerPriority);

	// Return the most local result with data
	return validResults[0] || null;
}

/** Check data availability for multiple region candidates */
export async function checkDataAvailabilityWithFallback(
	regionCandidates: Array<{ id: string; name: string; layer?: string; layer_label?: string }>
): Promise<{
	hasBestand: boolean;
	hasNeuzulassungen: boolean;
	bestandRegion: { id: string; name: string } | null;
	neuzulassungenRegion: { id: string; name: string } | null;
}> {
	const [bestandResult, neuzulassungenResult] = await Promise.all([
		fetchDataWithFallback(regionCandidates, { mode: 'bestand' }),
		fetchDataWithFallback(regionCandidates, { mode: 'neuzulassungen' })
	]);

	return {
		hasBestand: bestandResult !== null,
		hasNeuzulassungen: neuzulassungenResult !== null,
		bestandRegion: bestandResult ? { id: bestandResult.regionId, name: bestandResult.regionName } : null,
		neuzulassungenRegion: neuzulassungenResult ? { id: neuzulassungenResult.regionId, name: neuzulassungenResult.regionName } : null
	};
}

/** Convert raw data to waffle chart cell data */
export function buildWaffleData(data: VehicleRawData, categories: string[]): VehicleShareData[] {
	const result: VehicleShareData[] = [];

	// Separate categories into main (>1% share) and small (<=1% share)
	const mainCategories: string[] = [];
	let sonstigeShare = 0;
	let sonstigeAbsolute = 0;

	for (const cat of categories) {
		const share = data.shares[cat] || 0;
		if (share > 0.01) {
			mainCategories.push(cat);
		} else if (share > 0) {
			// Combine into Sonstige
			sonstigeShare += share;
			sonstigeAbsolute += data.categories[cat] || 0;
		}
	}

	// Calculate cells for each main category (round to nearest integer)
	const cellCounts: { key: string; cells: number; share: number }[] = [];

	for (const cat of mainCategories) {
		const share = data.shares[cat] || 0;
		const cells = Math.round(share * 100);
		cellCounts.push({ key: cat, cells, share });
	}

	// Add Sonstige if there are small categories
	if (sonstigeShare > 0) {
		const cells = Math.round(sonstigeShare * 100);
		cellCounts.push({ key: 'Sonstige', cells, share: sonstigeShare });
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
		if (key === 'Sonstige') {
			result.push({
				key,
				label: config?.label || 'Sonstige',
				color: config?.color || '#94A3B8',
				share: sonstigeShare,
				absolute: sonstigeAbsolute,
				cells
			});
		} else {
			result.push({
				key,
				label: config?.label || key,
				color: config?.color || fallbackColors[result.length % fallbackColors.length],
				share: data.shares[key] || 0,
				absolute: data.categories[key] || 0,
				cells
			});
		}
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

/** Format percentage with German locale (comma as decimal separator) */
function formatPercent(value: number): string {
	return (value * 100).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '%';
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
			format: (v: number) => (v * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
		}
	];
}

/** Generate dynamic title based on mode and electric share */
function generateTitle(
	waffleData: VehicleShareData[],
	regionName: string,
	mode: DataMode
): string {
	const elektro = waffleData.find((c) => c.key === 'Elektro');
	const elektroShare = elektro?.share ?? 0;
	const elektroPercent = Math.round(elektroShare * 100);

	if (mode === 'bestand') {
		// For Bestand: "In Stuttgart werden 84% der Autos mit fossilen Kraftstoffen betankt - Elektroautos machen bisher lediglich 6% aus"
		const benzin = waffleData.find((c) => c.key === 'Benzin');
		const diesel = waffleData.find((c) => c.key === 'Diesel');
		const fossilShare = (benzin?.share ?? 0) + (diesel?.share ?? 0);
		const fossilPercent = Math.round(fossilShare * 100);
		return `In ${regionName} werden ${fossilPercent}% der Autos mit fossilen Kraftstoffen betankt – Elektroautos machen bisher lediglich ${elektroPercent}% aus.`;
	}

	// For Neuzulassungen: dynamic phrasing based on electric share
	// Thresholds: exact fractions (50%, 33.33%, 25%, 20%, etc.)
	// "mehr als" for anything above the exact fraction
	const sharePercent = elektroShare * 100;

	if (sharePercent >= 50) {
		return `Mehr als jeder zweite Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent === 50) {
		return `Jeder zweite Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent >= 45) {
		return `Fast jeder zweite Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent >= 40) {
		return `Zwei von fünf Neuwagen in ${regionName} sind E-Autos.`;
	} else if (sharePercent > 33.33) {
		return `Mehr als jeder dritte Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent >= 30) {
		return `Fast jeder dritte Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent > 25) {
		return `Mehr als jeder vierte Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent >= 23) {
		return `Fast jeder vierte Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent > 20) {
		return `Mehr als jeder fünfte Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent >= 18) {
		return `Fast jeder fünfte Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent > 16.67) {
		return `Mehr als jeder sechste Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent >= 14) {
		return `Fast jeder sechste Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent > 10) {
		return `Mehr als jeder zehnte Neuwagen in ${regionName} ist ein E-Auto.`;
	} else if (sharePercent >= 8) {
		return `Fast jeder zehnte Neuwagen in ${regionName} ist ein E-Auto.`;
	} else {
		return `${elektroPercent}% der Neuwagen in ${regionName} sind E-Autos.`;
	}
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: VehicleRawData,
	waffleData: VehicleShareData[],
	regionName: string,
	mode: DataMode = 'bestand'
): Record<string, string | number> {
	const placeholders: Record<string, string | number> = {
		year: data.year,
		total: formatNumber(data.total, 0),
		totalRaw: data.total,
		regionName,
		title: generateTitle(waffleData, regionName, mode)
	};

	// Add per-category placeholders
	for (const cat of waffleData) {
		const safeKey = cat.key.replace(/[^a-zA-Z0-9]/g, '_');
		// Use formatPercent for German locale formatting
		placeholders[`${safeKey}_share`] = formatPercent(cat.share);
		placeholders[`${safeKey}_shareRaw`] = cat.share;
		placeholders[`${safeKey}_absolute`] = formatNumber(cat.absolute, 0);
		placeholders[`${safeKey}_absoluteRaw`] = cat.absolute;
		placeholders[`${safeKey}_cells`] = cat.cells;
	}

	return placeholders;
}

/** Check which data modes are available for a region (legacy - use checkDataAvailabilityWithFallback instead) */
export async function checkDataAvailability(
	region: Region | null
): Promise<{ hasBestand: boolean; hasNeuzulassungen: boolean }> {
	const [bestandResult, neuzulassungenResult] = await Promise.all([
		fetchBestandData(region).catch(() => null),
		fetchNeuzulassungenData(region).catch(() => null)
	]);

	// Check if data has meaningful content
	const hasBestand = bestandResult !== null && Object.keys(bestandResult.data.shares).length > 0;
	const hasNeuzulassungen = neuzulassungenResult !== null && Object.keys(neuzulassungenResult.data.shares).length > 0;

	return { hasBestand, hasNeuzulassungen };
}

/** Build ChartData object */
export function buildChartData(
	data: VehicleRawData,
	waffleData: VehicleShareData[],
	updateDate: string,
	regionName: string,
	region: Region | null,
	mode: DataMode = 'bestand',
	hasData: boolean = true,
	availability?: { hasBestand: boolean; hasNeuzulassungen: boolean },
	source?: string,
	fallbackInfo?: { originalRegionName: string; dataRegionName: string; originalLayerLabel?: string; dataLayerLabel?: string },
	regionLayerLabel?: string
): ChartData {
	// Transform waffleData to clean table rows
	const tableRows = waffleData.map((cat) => ({
		label: cat.label,
		absolute: cat.absolute,
		share: cat.share
	}));

	const modeLabel = mode === 'neuzulassungen' ? 'neuzulassungen' : 'bestand';

	// Build embed options if both modes are available
	const embedOptions =
		availability?.hasBestand && availability?.hasNeuzulassungen
			? [
					{
						key: 'mode',
						label: 'Datenansicht vorauswählen',
						choices: [
							{ value: 'bestand', label: 'Bestand' },
							{ value: 'neuzulassungen', label: 'Neuzulassungen' }
						],
						currentValue: mode
					}
				]
			: [];

	// Build source string, including fallback disclaimer if showing parent region data
	let sourceText = source || '';
	if (fallbackInfo && fallbackInfo.originalRegionName !== fallbackInfo.dataRegionName) {
		// Include layer labels in the disclaimer (e.g., "Landkreis Meißen" instead of just "Meißen")
		const dataRegionDisplay = fallbackInfo.dataLayerLabel
			? `${fallbackInfo.dataLayerLabel} ${fallbackInfo.dataRegionName}`
			: fallbackInfo.dataRegionName;
		const originalRegionDisplay = fallbackInfo.originalLayerLabel
			? `${fallbackInfo.originalLayerLabel} ${fallbackInfo.originalRegionName}`
			: fallbackInfo.originalRegionName;
		const disclaimer = `Daten für ${dataRegionDisplay} (nicht verfügbar für ${originalRegionDisplay})`;
		sourceText = sourceText ? `${sourceText} · ${disclaimer}` : disclaimer;
	}

	// Build regionName with layer_label prefix if available (e.g., "Landkreis Meißen")
	const displayRegionName = (fallbackInfo?.dataLayerLabel || regionLayerLabel) && regionName
		? `${fallbackInfo?.dataLayerLabel || regionLayerLabel} ${regionName}`
		: regionName;

	return {
		hasData,
		// Wrap in array so Card.svelte's `hasData` check works (chartData.raw.length > 0)
		raw: [data],
		table: {
			columns: getTableColumns(),
			rows: tableRows,
			filename: `kfz-${modeLabel}-antriebsarten-${regionName.toLowerCase().replace(/\s+/g, '-')}`
		},
		placeholders: getPlaceholders(data, waffleData, displayRegionName, mode),
		meta: {
			updateDate,
			source: sourceText,
			region
		},
		embedOptions
	};
}
