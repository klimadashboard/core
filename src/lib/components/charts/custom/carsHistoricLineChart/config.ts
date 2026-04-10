// $lib/components/charts/custom/carsHistoricLineChart/config.ts
import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { PUBLIC_VERSION } from '$env/static/public';
import { PRIVACY_THRESHOLD } from '$lib/components/charts/utils/privacyFilter';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

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

/** Readable German labels for layer values (used as fallback when layer_label is empty) */
const layerLabels: Record<string, string> = {
	municipality: 'Gemeinde',
	gemeinde: 'Gemeinde',
	district: 'Bezirk',
	bezirk: 'Bezirk',
	kreis: 'Kreis',
	landkreis: 'Landkreis',
	city: 'Stadt',
	stadt: 'Stadt',
	region: 'Region',
	regierungsbezirk: 'Regierungsbezirk',
	bundesland: 'Bundesland',
	state: 'Bundesland',
	country: 'Land',
	land: 'Land'
};

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
	/** Whether any category values were suppressed for data privacy */
	hasPrivacySuppression?: boolean;
}

export interface VehicleRawData {
	date: Date;
	/** Dynamic keys: category names for percentages (0-1), category_abs for absolute values */
	[key: string]: number | Date;
}

export interface SeriesConfig {
	key: string;
	label: string;
	color: string;
}

// Category configuration with colors and display order
// Colors chosen to work well in both light and dark modes
export const categoryConfig: Record<string, { label: string; color: string; order: number }> = {
	Benzin: { label: 'Benzin', color: '#F59E0B', order: 0 },
	Diesel: { label: 'Diesel', color: '#DB2777', order: 1 },
	'Hybrid (ohne Plug-in)': { label: 'Hybrid', color: '#38BDF8', order: 2 },
	Hybrid: { label: 'Hybrid', color: '#38BDF8', order: 2 },
	Elektro: { label: 'Elektro', color: '#10B981', order: 3 },
	'Plug-in-Hybrid': { label: 'Plug-in', color: '#8B5CF6', order: 4 },
	Sonstige: { label: 'Sonstige', color: '#94A3B8', order: 5 },
	Gas: { label: 'Gas', color: '#94A3B8', order: 6 },
	'Sonstige Kraftstoffarten': { label: 'Sonstige', color: '#94A3B8', order: 7 }
};

// Fallback colors (work in both light and dark modes)
export const categoryColors = ['#10B981', '#3B82F6', '#94A3B8', '#EF4444', '#F59E0B', '#FBBF24'];

// Categories to exclude from display
const excludedCategories = ['Insgesamt', 'Privat', 'Firmen'];

// Categories to merge into "Sonstige"
const sonstigeCategories = ['Gas', 'Sonstige Kraftstoffarten'];

/** Fetch Bestand data using the get-mobility-cars endpoint */
export async function fetchBestandData(
	region: Region | null
): Promise<{ data: VehicleRawData[]; categories: string[]; updateDate: string; source: string; regionName?: string; hasPrivacySuppression?: boolean }> {
	const country = getCountryCode();
	const isCountryLevel = !region || region.layer === 'country';

	let yearData: Record<string, Record<string, number>>;
	let regionName: string | undefined;
	let source: string;

	if (isCountryLevel) {
		// Country-level: fetch all districts and aggregate
		const url = `https://base.klimadashboard.org/get-mobility-cars?layer=district&country=${country}&includeMeta=true`;
		const resp = await fetch(url);
		if (!resp.ok) {
			return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
		}

		const districts = await resp.json();
		if (!Array.isArray(districts) || districts.length === 0) {
			return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
		}

		yearData = {};
		const allSourceParts = new Set<string>();

		for (const district of districts) {
			const dData = district.data || {};
			if (district.source) {
				for (const part of String(district.source).split(',')) {
					const trimmed = part.trim();
					if (trimmed) allSourceParts.add(trimmed);
				}
			}

			for (const [year, categories] of Object.entries(dData)) {
				if (!yearData[year]) yearData[year] = {};
				for (const [cat, val] of Object.entries(categories as Record<string, number>)) {
					yearData[year][cat] = (yearData[year][cat] || 0) + ((val as number) || 0);
				}
			}
		}

		regionName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : country;
		// Compact sources: deduplicate by removing year suffixes
		const baseSourceNames = new Set([...allSourceParts].map((s) => s.replace(/\s+\d{4}(-\d{2})?$/, '')));
		source = [...baseSourceNames].join(', ');
	} else {
		// Single-region: use the region-specific endpoint
		const regionKey = region?.id || (country === 'DE' ? 'DE' : country);
		const url = `https://base.klimadashboard.org/get-mobility-cars?region=${encodeURIComponent(regionKey)}&country=${country}&includeMeta=true`;

		const response = await fetch(url);
		if (!response.ok) {
			if (response.status === 404 || response.status === 400) {
				return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
			}
			throw new Error(`Failed to fetch Bestand data: ${response.status}`);
		}

		const result = await response.json();
		if (result.error) {
			return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
		}

		yearData = result.data || {};
		regionName = result.region?.name || region?.name;
		source = result.source || result.meta?.source || '';
	}

	const periods = Object.keys(yearData).sort();

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
		return { data: [], categories: [], updateDate: new Date().toISOString(), source: '' };
	}

	// Build time series data with shares, applying privacy filter
	let hasPrivacySuppression = false;

	const data: VehicleRawData[] = periods.map((period) => {
		const periodData = yearData[period] || {};

		// First collect raw absolute values and apply privacy filter
		const filteredValues: Record<string, number> = {};
		for (const cat of categories) {
			if (cat === 'Sonstige') {
				// Sum up all sonstige categories
				const sonstigeValue = sonstigeCategories.reduce(
					(sum, sCat) => sum + ((periodData[sCat] as number) || 0),
					0
				);
				// Apply privacy filter
				if (sonstigeValue > 0 && sonstigeValue <= PRIVACY_THRESHOLD) {
					filteredValues[cat] = 0;
					hasPrivacySuppression = true;
				} else {
					filteredValues[cat] = sonstigeValue;
				}
			} else {
				const value = (periodData[cat] as number) || 0;
				// Apply privacy filter
				if (value > 0 && value <= PRIVACY_THRESHOLD) {
					filteredValues[cat] = 0;
					hasPrivacySuppression = true;
				} else {
					filteredValues[cat] = value;
				}
			}
		}

		// Calculate total from filtered values
		const total = Object.values(filteredValues).reduce((sum, val) => sum + val, 0);

		const row: VehicleRawData = {
			date: new Date(parseInt(period), 0, 1) // January 1st of the year
		};

		// Store both absolute values and shares
		for (const cat of categories) {
			row[`${cat}_abs`] = filteredValues[cat]; // Absolute value
			row[cat] = total > 0 ? filteredValues[cat] / total : 0; // Share (percentage)
		}

		return row;
	});

	const lastRow = data[data.length - 1];
	const updateDate = lastRow?.date?.toISOString() || new Date().toISOString();

	return { data, categories, updateDate, source, regionName, hasPrivacySuppression };
}

/** Fetch Neuzulassungen data from Directus */
export async function fetchNeuzulassungenData(
	region: Region | null
): Promise<{ data: VehicleRawData[]; categories: string[]; updateDate: string; source: string; regionName?: string; hasPrivacySuppression?: boolean }> {
	const country = getCountryCode();
	const isCountryLevel = !region || region.layer === 'country';

	// Build Directus API URL - omit region filter for country-level aggregation
	const url = isCountryLevel
		? `https://base.klimadashboard.org/items/mobility_cars_registrations?filter[country][_eq]=${country}&sort=period&limit=-1`
		: `https://base.klimadashboard.org/items/mobility_cars_registrations?filter[region][_eq]=${region?.id || country}&filter[country][_eq]=${country}&sort=period&limit=-1`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch Neuzulassungen data: ${response.status}`);
	}

	const result = await response.json();
	let records = (result.data || []) as Array<{
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

	// For country-level, aggregate records across all regions by period+category
	if (isCountryLevel) {
		const aggregated = new Map<string, Map<string, number>>();
		for (const record of records) {
			if (!aggregated.has(record.period)) aggregated.set(record.period, new Map());
			const periodMap = aggregated.get(record.period)!;
			periodMap.set(record.category, (periodMap.get(record.category) || 0) + record.value);
		}
		const firstSource = records[0]?.source;
		records = [...aggregated.entries()].flatMap(([period, categories]) =>
			[...categories.entries()].map(([category, value]) => ({
				region: country,
				country,
				period,
				category,
				value,
				source: firstSource
			}))
		);
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

	// Build time series data with privacy filter
	let hasPrivacySuppression = false;

	const data: VehicleRawData[] = periods.map((period) => {
		const periodRecords = records.filter((r) => r.period === period);

		// First collect and filter absolute values
		const filteredValues: Record<string, number> = {};
		for (const cat of categories) {
			const record = periodRecords.find((r) => r.category === cat);
			const absolute = record?.value || 0;
			// Apply privacy filter
			if (absolute > 0 && absolute <= PRIVACY_THRESHOLD) {
				filteredValues[cat] = 0;
				hasPrivacySuppression = true;
			} else {
				filteredValues[cat] = absolute;
			}
		}

		// Calculate total from filtered values
		const total = Object.values(filteredValues).reduce((sum, val) => sum + val, 0);

		const row: VehicleRawData = {
			date: new Date(period)
		};

		// Store both absolute values and shares
		for (const cat of categories) {
			row[`${cat}_abs`] = filteredValues[cat]; // Absolute value
			row[cat] = total > 0 ? filteredValues[cat] / total : 0; // Share (percentage)
		}

		return row;
	});

	const lastRow = data[data.length - 1];
	const updateDate = lastRow?.date?.toISOString() || new Date().toISOString();

	// Extract source from first record
	const source = records[0]?.source || '';

	return { data, categories, updateDate, source, regionName: region?.name, hasPrivacySuppression };
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
	const country = getCountryCode();
	const countryName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : country;

	// If no candidates, add country as fallback
	const candidates = regionCandidates.length > 0
		? regionCandidates
		: [{ id: country, name: countryName, layer: 'country', layer_label: 'Land', code: country }];

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

				const result = params.mode === 'bestand'
					? await fetchBestandData(regionObj)
					: await fetchNeuzulassungenData(regionObj);

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
	regionCandidates: Array<{ id: string; name: string; layer?: string; layer_label?: string; code?: string }>
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

/** Format percentage with German locale (comma as decimal separator) - includes % sign for text output */
function formatPercent(value: number): string {
	return (value * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

/** Format percentage for table cells (without % sign, since it's in the column header) */
function formatPercentForTable(value: number): string {
	return (value * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Format absolute number with German locale (dot as thousand separator) */
function formatAbsolute(value: number): string {
	return value.toLocaleString('de-DE');
}

/** Get table columns dynamically based on categories */
export function getTableColumns(categories: string[]): TableColumn[] {
	const categoryColumns: TableColumn[] = [];

	// For each category, add both absolute and percentage columns
	for (const cat of categories) {
		const label = categoryConfig[cat]?.label || cat;

		// Absolute value column
		categoryColumns.push({
			key: `${cat}_abs`,
			label: `${label} (Anzahl)`,
			align: 'right' as const,
			format: (v: number) => (v != null ? formatAbsolute(v) : '–')
		});

		// Percentage column
		categoryColumns.push({
			key: cat,
			label: `${label} (%)`,
			align: 'right' as const,
			format: (v: number) => (v != null ? formatPercentForTable(v) : '–')
		});
	}

	return [
		{
			key: 'date',
			label: 'Datum',
			align: 'left',
			format: (v) => (v instanceof Date ? v.toLocaleDateString('de-DE') : String(v))
		},
		...categoryColumns
	];
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: VehicleRawData[],
	categories: string[],
	region: Region | null,
	mode: DataMode = 'neuzulassungen',
	regionLayerLabel?: string,
	source?: string
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

	// Build regionName with layer_label suffix for disambiguation (e.g., "Meißen (Landkreis)")
	const regionName = regionLayerLabel && region?.name && region?.layer !== 'country'
		? `${region.name} (${regionLayerLabel})`
		: region?.name ?? '';

	// Calculate first and last year for data range
	const firstRow = data[0];
	const firstYear = firstRow?.date instanceof Date ? firstRow.date.getFullYear() : '';
	const dataYearStart = firstYear;
	const dataYearEnd = lastYear;

	return {
		regionName,
		layerLabel: regionLayerLabel || '',
		currentYear,
		lastUpdateDate: lastRow?.date instanceof Date ? lastRow.date.toLocaleDateString('de-DE') : '',
		categoryCount: categories.length,
		dataPointCount: data.length,
		elektroShareStart,
		elektroShareEnd,
		changeVerb,
		modeLabel,
		dataYearStart,
		dataYearEnd,
		source: source || '',
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
	fallbackInfo?: { originalRegionName: string; dataRegionName: string; originalLayerLabel?: string; dataLayerLabel?: string; originalLayer?: string; dataLayer?: string },
	regionLayerLabel?: string,
	hasPrivacySuppression?: boolean,
	privacyNote?: string
): ChartData {
	const tableRows = data.map((d) => ({
		date: d.date,
		// Include both absolute values and percentages for each category
		...Object.fromEntries(
			categories.flatMap((cat) => [
				[`${cat}_abs`, d[`${cat}_abs`]], // Absolute value
				[cat, d[cat]] // Percentage
			])
		)
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
	if (fallbackInfo) {
		// Always include layer labels to distinguish regions with the same name (e.g., "Wien (Bundesland)" vs "Wien (Gemeinde)")
		// Fall back to layerLabels map when CMS layer_label is empty
		const dataLabel = fallbackInfo.dataLayerLabel || (fallbackInfo.dataLayer && layerLabels[fallbackInfo.dataLayer]) || '';
		const originalLabel = fallbackInfo.originalLayerLabel || (fallbackInfo.originalLayer && layerLabels[fallbackInfo.originalLayer]) || '';
		const dataRegionDisplay = dataLabel
			? `${fallbackInfo.dataRegionName} (${dataLabel})`
			: fallbackInfo.dataRegionName;
		const originalRegionDisplay = originalLabel
			? `${fallbackInfo.originalRegionName} (${originalLabel})`
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
		placeholders: getPlaceholders(data, categories, region, mode, fallbackInfo?.dataLayerLabel || regionLayerLabel, source),
		meta: {
			updateDate,
			source: sourceText,
			region,
			note: hasPrivacySuppression ? privacyNote : undefined
		},
		embedOptions,
		allowDataDownload: PUBLIC_VERSION !== 'at'
	};
}

export async function fetchChartData({
	regionId,
	parentIds,
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	if (!regionId) return null;

	// Fetch region metadata including layer_label for disambiguation
	const allIds = [regionId, ...parentIds];
	const directus = getDirectusInstance(fetchFn);
	const regionsData = await directus.request(
		readItems('regions', {
			filter: { id: { _in: allIds } },
			fields: ['id', 'name', 'layer', 'layer_label'],
			limit: allIds.length
		})
	) as Array<{ id: string; name: string; layer: string; layer_label?: string }>;

	const regionMap = new Map(regionsData.map((r) => [r.id, r]));

	const candidates = allIds.map((id) => {
		const meta = regionMap.get(id);
		return {
			id,
			name: meta?.name || '',
			layer: meta?.layer || 'unknown',
			layer_label: meta?.layer_label || ''
		};
	});

	const result = await fetchDataWithFallback(candidates, { mode: 'bestand' });
	if (!result || result.data.length === 0) return null;

	// Build a minimal region object for placeholder resolution
	const matchedCandidate = candidates.find((c) => c.id === result.regionId) || candidates[0];
	const ssrRegion = {
		id: result.regionId || regionId,
		name: result.regionName || matchedCandidate?.name || '',
		layer: matchedCandidate?.layer || 'unknown'
	} as Region;

	return buildChartData(
		result.data,
		result.categories,
		result.updateDate,
		ssrRegion,
		'bestand',
		true, // hasData
		undefined, // availability
		result.source,
		undefined, // fallbackInfo
		result.regionLayerLabel,
		result.hasPrivacySuppression
	);
}
