// $lib/components/charts/custom/vehicleRegistrations/config.ts
import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { PUBLIC_VERSION } from '$env/static/public';

export type DataMode = 'neuzulassungen' | 'bestand';

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
	mode?: DataMode;
}

export interface FetchResult {
	data: VehicleRawData[];
	categories: string[];
	updateDate: string;
	source: string;
	regionId: string;
	regionName: string;
	regionLayerLabel: string;
	layerPriority: number;
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
	Benzin: { label: 'Benzin', color: '#E58A28', order: 0 },
	Diesel: { label: 'Diesel', color: '#9E2668', order: 1 },
	'Hybrid (ohne Plug-in)': { label: 'Hybrid', color: '#379AC5', order: 2 },
	Hybrid: { label: 'Hybrid', color: '#379AC5', order: 2 },
	Elektro: { label: 'Elektro', color: '#097347', order: 3 },
	'Plug-in-Hybrid': { label: 'Plug-in', color: '#1C128E', order: 4 },
	Sonstige: { label: 'Sonstige', color: '#464E5C', order: 5 },
	Gas: { label: 'Gas', color: '#464E5C', order: 6 },
	'Sonstige Kraftstoffarten': { label: 'Sonstige', color: '#464E5C', order: 7 }
};

// Fallback colors
export const categoryColors = ['#047857', '#1D4ED8', '#6B7280', '#DC2626', '#B45309', '#EAB308'];

// Categories to exclude from display
const excludedCategories = ['Insgesamt', 'Privat', 'Firmen'];

// Categories to merge into "Sonstige"
const sonstigeCategories = ['Gas', 'Sonstige Kraftstoffarten'];

/** Fetch Bestand data using the get-mobility-cars endpoint */
export async function fetchBestandData(
	region: Region | null
): Promise<{ data: VehicleRawData[]; categories: string[]; updateDate: string; source: string; regionName?: string }> {
	const country = getCountryCode();

	// Use the custom endpoint that handles region lookup and aggregation
	// The endpoint accepts region IDs (UUIDs) and looks up codes internally
	const regionKey = region?.id || (country === 'DE' ? 'DE' : country);
	const url = `https://base.klimadashboard.org/get-mobility-cars?region=${encodeURIComponent(regionKey)}&country=${country}&includeMeta=true`;

	console.log('[fetchBestandData] Fetching for region:', { regionId: region?.id, regionCode: region?.code, regionKey, url });

	const response = await fetch(url);
	console.log('[fetchBestandData] Response status:', response.status);
	if (!response.ok) {
		// 404 or 400 means no data for this region
		if (response.status === 404 || response.status === 400) {
			console.log('[fetchBestandData] No data (404/400) for region:', regionKey);
			return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
		}
		throw new Error(`Failed to fetch Bestand data: ${response.status}`);
	}

	const result = await response.json();
	console.log('[fetchBestandData] Response result:', { hasError: !!result.error, regionInResult: result.region, dataKeys: result.data ? Object.keys(result.data) : null });

	// Handle error responses from the endpoint
	if (result.error) {
		console.log('[fetchBestandData] Error in response:', result.error);
		return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
	}

	// The endpoint returns { region: {...}, data: { [year]: { [category]: value } } }
	const yearData = result.data || {};
	const periods = Object.keys(yearData).sort();
	const regionName = result.region?.name || region?.name;

	if (periods.length === 0) {
		return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
	}

	// Get all categories from all years (excluding Insgesamt, Privat, Firmen)
	const allCategories = new Set<string>();
	for (const period of periods) {
		for (const cat of Object.keys(yearData[period])) {
			if (!excludedCategories.includes(cat)) {
				allCategories.add(cat);
			}
		}
	}

	// If no usable categories found (only Privat/Firmen/Insgesamt), return empty
	if (allCategories.size === 0) {
		console.log('[fetchBestandData] No usable categories found (only excluded categories like Privat/Firmen)');
		return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
	}

	// Merge sonstige categories and sort by order
	const rawCategories = [...allCategories];
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

	// Double-check we have displayable categories
	if (categories.length === 0) {
		console.log('[fetchBestandData] No displayable categories after filtering');
		return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
	}

	// Build time series data with shares
	const data: VehicleRawData[] = periods.map((period) => {
		const periodData = yearData[period] || {};
		const total =
			periodData['Insgesamt'] ||
			Object.entries(periodData).reduce((sum, [cat, value]) => {
				if (!excludedCategories.includes(cat)) {
					return sum + (value as number);
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
				const sonstigeValue = sonstigeCategories.reduce(
					(sum, sCat) => sum + ((periodData[sCat] as number) || 0),
					0
				);
				row[cat] = total > 0 ? sonstigeValue / total : 0;
			} else {
				const value = periodData[cat] as number;
				row[cat] = total > 0 && value ? value / total : 0;
			}
		}

		return row;
	});

	const lastRow = data[data.length - 1];
	const updateDate = lastRow?.date?.toISOString() || new Date().toISOString();

	// Source from DESTATIS
	const source = 'DESTATIS';

	console.log('[fetchBestandData] Returning data:', { dataLength: data.length, categories, regionName, firstRow: data[0], lastRow: data[data.length - 1] });

	return { data, categories, updateDate, source, regionName };
}

/** Fetch Neuzulassungen data from Directus */
export async function fetchNeuzulassungenData(
	region: Region | null
): Promise<{ data: VehicleRawData[]; categories: string[]; updateDate: string; source: string; regionName?: string }> {
	const country = getCountryCode();
	const regionCode = region?.id || country;

	// Build Directus API URL with filters
	const url = `https://base.klimadashboard.org/items/mobility_cars_registrations?filter[region][_eq]=${regionCode}&filter[country][_eq]=${country}&sort=period&limit=-1`;

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
		return { data: [], categories: [], updateDate: new Date().toISOString(), source: '', regionName: region?.name };
	}

	// Get unique periods and categories
	const periods = [...new Set(records.map((r) => r.period))].sort();
	const rawCategories = [...new Set(records.map((r) => r.category))];

	// Sort categories by configured order
	const categories = rawCategories.sort((a, b) => {
		const orderA = categoryConfig[a]?.order ?? 99;
		const orderB = categoryConfig[b]?.order ?? 99;
		return orderA - orderB;
	});

	// Build time series data
	const data: VehicleRawData[] = periods.map((period) => {
		const periodRecords = records.filter((r) => r.period === period);

		const row: VehicleRawData = {
			date: new Date(period)
		};

		// Add share values for each category
		for (const cat of categories) {
			const record = periodRecords.find((r) => r.category === cat);
			row[cat] = record?.value || 0;
		}

		return row;
	});

	const lastRow = data[data.length - 1];
	const updateDate = lastRow?.date?.toISOString() || new Date().toISOString();

	// Extract source from first record
	const source = records[0]?.source || '';

	return { data, categories, updateDate, source, regionName: region?.name };
}

/** Fetch data based on mode */
export async function fetchData(
	region: Region | null,
	params: VehicleParams
): Promise<{ data: VehicleRawData[]; categories: string[]; updateDate: string; source: string }> {
	if (params.mode === 'bestand') {
		return fetchBestandData(region);
	}
	return fetchNeuzulassungenData(region);
}

/** Fetch data for multiple region candidates and return the best match (most local with data) */
export async function fetchDataWithFallback(
	regionCandidates: Array<{ id: string; name: string; layer?: string; layer_label?: string; code?: string }>,
	params: VehicleParams
): Promise<FetchResult | null> {
	console.log('[fetchDataWithFallback] Called with candidates:', regionCandidates, 'params:', params);

	const country = getCountryCode();
	const countryName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : country;

	// If no candidates, add country as fallback
	const candidates = regionCandidates.length > 0
		? regionCandidates
		: [{ id: country, name: countryName, layer: 'country', layer_label: 'Land', code: country }];

	console.log('[fetchDataWithFallback] Using candidates:', candidates);

	// Try fetching for each candidate in parallel
	const results = await Promise.all(
		candidates.map(async (candidate) => {
			try {
				// Create a minimal Region object for the fetch functions
				// The API endpoint accepts region IDs (UUIDs) and looks them up internally
				const regionObj: Region = {
					id: candidate.id,
					name: candidate.name,
					layer: candidate.layer || 'unknown'
				} as Region;

				console.log('[fetchDataWithFallback] Trying candidate:', candidate.name, 'id:', candidate.id);

				const result = params.mode === 'bestand'
					? await fetchBestandData(regionObj)
					: await fetchNeuzulassungenData(regionObj);

				console.log('[fetchDataWithFallback] Result for', candidate.name, ':', { dataLength: result.data.length });

				if (result.data.length > 0) {
					return {
						...result,
						regionId: candidate.id,
						regionName: result.regionName || candidate.name,
						// Use layer_label from the region object (passed from getRegion), not from API response
						regionLayerLabel: candidate.layer_label || '',
						layerPriority: getLayerPriority(candidate.layer || 'unknown')
					} as FetchResult;
				}
			} catch (e) {
				console.log('[fetchDataWithFallback] Error for candidate', candidate.name, ':', e);
				// Ignore errors, try next candidate
			}
			return null;
		})
	);

	// Filter out null results and sort by layer priority (lowest = most local)
	const validResults = results.filter((r): r is FetchResult => r !== null);
	validResults.sort((a, b) => a.layerPriority - b.layerPriority);

	console.log('[fetchDataWithFallback] Valid results:', validResults.map(r => ({ regionId: r.regionId, regionName: r.regionName, dataLength: r.data.length, layerPriority: r.layerPriority })));

	// Return the most local result with data
	return validResults[0] || null;
}

/** Check data availability for multiple region candidates */
export async function checkDataAvailabilityWithFallback(
	regionCandidates: Array<{ id: string; name: string; layer?: string; layer_label?: string; code?: string }>
): Promise<{
	hasBestand: boolean;
	hasNeuzulassungen: boolean;
	bestandRegion: { id: string; name: string } | null;
	neuzulassungenRegion: { id: string; name: string } | null;
}> {
	console.log('[checkDataAvailabilityWithFallback] Checking availability for candidates:', regionCandidates);

	const [bestandResult, neuzulassungenResult] = await Promise.all([
		fetchDataWithFallback(regionCandidates, { mode: 'bestand' }),
		fetchDataWithFallback(regionCandidates, { mode: 'neuzulassungen' })
	]);

	console.log('[checkDataAvailabilityWithFallback] Results:', {
		hasBestand: bestandResult !== null,
		hasNeuzulassungen: neuzulassungenResult !== null,
		bestandRegion: bestandResult ? bestandResult.regionName : null,
		neuzulassungenRegion: neuzulassungenResult ? neuzulassungenResult.regionName : null
	});

	return {
		hasBestand: bestandResult !== null,
		hasNeuzulassungen: neuzulassungenResult !== null,
		bestandRegion: bestandResult ? { id: bestandResult.regionId, name: bestandResult.regionName } : null,
		neuzulassungenRegion: neuzulassungenResult ? { id: neuzulassungenResult.regionId, name: neuzulassungenResult.regionName } : null
	};
}

/** Format percentage with German locale (comma as decimal separator) */
function formatPercent(value: number): string {
	return (value * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
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
			format: (v: number) => (v != null ? formatPercent(v) : '–')
		}))
	];
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: VehicleRawData[],
	categories: string[],
	region: Region | null,
	mode: DataMode = 'neuzulassungen',
	regionLayerLabel?: string
): Record<string, string | number> {
	const lastRow = data[data.length - 1];
	const currentYear = new Date().getFullYear();

	const latestValues: Record<string, string> = {};
	for (const cat of categories) {
		const value = lastRow?.[cat];
		if (typeof value === 'number') {
			latestValues[cat.replace(/[^a-zA-Z0-9]/g, '_')] = formatPercent(value);
		}
	}

	// Calculate Elektro share change over last 5 years
	const lastYear = lastRow?.date instanceof Date ? lastRow.date.getFullYear() : currentYear;
	const targetYear = lastYear - 5;

	// Find the data point closest to 5 years ago
	const startRow = data.find((d) => d.date instanceof Date && d.date.getFullYear() === targetYear);
	const elektroStart = typeof startRow?.Elektro === 'number' ? startRow.Elektro : null;
	const elektroEnd = typeof lastRow?.Elektro === 'number' ? lastRow.Elektro : null;

	// Format percentages with German locale
	const elektroShareStart = elektroStart !== null ? formatPercent(elektroStart) : '–';
	const elektroShareEnd = elektroEnd !== null ? formatPercent(elektroEnd) : '–';

	// Determine change verb
	let changeVerb = '';
	if (elektroStart !== null && elektroEnd !== null) {
		changeVerb = elektroEnd >= elektroStart ? 'gestiegen' : 'gesunken';
	}

	// Mode label
	const modeLabel = mode === 'bestand' ? 'im Bestand' : 'bei den Neuzulassungen';

	// Build regionName with layer_label prefix if available (e.g., "Landkreis Meißen")
	const regionName = regionLayerLabel && region?.name
		? `${regionLayerLabel} ${region.name}`
		: region?.name ?? '';

	return {
		regionName,
		currentYear,
		lastUpdateDate: lastRow?.date instanceof Date ? lastRow.date.toLocaleDateString('de-DE') : '',
		categoryCount: categories.length,
		dataPointCount: data.length,
		elektroShareStart,
		elektroShareEnd,
		changeVerb,
		modeLabel,
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

/** Check which data modes are available for a region */
export async function checkDataAvailability(
	region: Region | null
): Promise<{ hasBestand: boolean; hasNeuzulassungen: boolean }> {
	const [bestandResult, neuzulassungenResult] = await Promise.all([
		fetchBestandData(region).catch(() => ({ data: [] })),
		fetchNeuzulassungenData(region).catch(() => ({ data: [] }))
	]);

	return {
		hasBestand: bestandResult.data.length > 0,
		hasNeuzulassungen: neuzulassungenResult.data.length > 0
	};
}

/** Build ChartData object */
export function buildChartData(
	data: VehicleRawData[],
	categories: string[],
	updateDate: string,
	region: Region | null,
	mode: DataMode = 'neuzulassungen',
	hasData: boolean = true,
	availability?: { hasBestand: boolean; hasNeuzulassungen: boolean },
	source?: string,
	fallbackInfo?: { originalRegionName: string; dataRegionName: string; originalLayerLabel?: string; dataLayerLabel?: string },
	regionLayerLabel?: string
): ChartData {
	const tableRows = data.map((d) => ({
		date: d.date,
		...Object.fromEntries(categories.map((cat) => [cat, d[cat]]))
	}));

	// Build embed options if both modes are available
	const embedOptions =
		availability?.hasBestand && availability?.hasNeuzulassungen
			? [
					{
						key: 'mode',
						label: 'Datenansicht vorauswählen',
						choices: [
							{ value: 'neuzulassungen', label: 'Neuzulassungen' },
							{ value: 'bestand', label: 'Bestand' }
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

	return {
		hasData,
		raw: data,
		table: {
			columns: getTableColumns(categories),
			rows: tableRows,
			filename: mode === 'bestand' ? 'kfz-bestand' : 'neuzulassungen'
		},
		placeholders: getPlaceholders(data, categories, region, mode, fallbackInfo?.dataLayerLabel || regionLayerLabel),
		meta: {
			updateDate,
			source: sourceText,
			region
		},
		embedOptions
	};
}
