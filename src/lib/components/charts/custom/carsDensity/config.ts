// $lib/components/charts/custom/mobilityCarDensity/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { getRegions } from '$lib/utils/regions';
import { PUBLIC_VERSION } from '$env/static/public';

// =============================================================================
// Types
// =============================================================================

export interface CarDensityParams {
	regionId?: string;
}

export interface RawMobilityRecord {
	period: string;
	region: string;
	category: 'Privat' | 'Firmen' | 'Insgesamt';
	value: number;
	source?: string;
}

export interface RegionShape {
	code: string;
	code_short?: string;
	name: string;
	layer: string;
	country: string;
	population: number;
	center?: [number, number];
	parents?: Array<{ layer: string; id: string }>;
	id?: string;
}

export interface TimeSeriesPoint {
	period: string;
	value: number | null;
}

export interface RegionWithData extends RegionShape {
	cars: TimeSeriesPoint[];
	carsPer1000Inhabitants: TimeSeriesPoint[];
	carsPrivateShare: TimeSeriesPoint[];
	carsCompanyShare: TimeSeriesPoint[];
}

export interface CarDensityData {
	region: RegionWithData;
	national: RegionWithData;
	periods: string[];
	source: string;
	country: RegionShape;
}

// =============================================================================
// Color Configuration
// =============================================================================

/** Colors with light/dark mode variants for accessibility */
export const colors = {
	cars: { light: '#84112E', dark: '#E85A7A' },
	carsLight: { light: '#B5173F', dark: '#F08CA3' },
	private: { light: '#B04C21', dark: '#E8844D' },
	privateLight: { light: '#D75D28', dark: '#F5A86A' },
	company: { light: '#DA9B34', dark: '#F5C563' },
	companyLight: { light: '#E5B870', dark: '#FFD88A' }
};

/** Helper to get color based on current theme */
export function getColor(
	colorKey: keyof typeof colors,
	isDark: boolean
): string {
	return isDark ? colors[colorKey].dark : colors[colorKey].light;
}

// =============================================================================
// Data Fetching
// =============================================================================

/** Fetch and process mobility data for a specific region */
export async function fetchData(
	fetchFn: typeof fetch,
	inputRegion: Region | null
): Promise<CarDensityData> {
	const directus = getDirectusInstance(fetchFn);
	const countryCode = PUBLIC_VERSION.toUpperCase();

	// Determine region code from Region object
	const regionCode = inputRegion
		? PUBLIC_VERSION === 'at'
			? inputRegion.code
			: (inputRegion.codeShort ?? inputRegion.code)
		: null;

	// Build filter for mobility data - only fetch for specific region if provided
	const mobilityFilter: any = {
		country: { _eq: countryCode },
		category: { _in: ['Privat', 'Firmen', 'Insgesamt'] }
	};

	// If we have a specific region, only fetch data for that region
	// Otherwise fetch all for national aggregate
	if (regionCode) {
		mobilityFilter.region = { _eq: regionCode };
	}

	// Fetch mobility data (filtered if region specified)
	const rawData = await directus.request(
		readItems<RawMobilityRecord>('mobility_cars', {
			filter: mobilityFilter,
			fields: ['period', 'region', 'category', 'value', 'source'],
			limit: -1
		})
	);

	// Extract metadata
	const sources = Array.from(new Set(rawData.map((d) => d.source).filter(Boolean)));
	const source = sources.join(', ');

	// Get periods from data
	const periods = Array.from(
		new Set(rawData.filter((d) => d.category === 'Privat').map((d) => d.period))
	).sort((a, b) => Number(a) - Number(b));

	// If we have a specific region, we can build the data directly
	if (inputRegion && regionCode && rawData.length > 0) {
		// Build region data from the filtered results
		const regionWithData = buildRegionWithDataFromRaw(inputRegion, rawData);

		// For national comparison, we need to fetch national stats separately
		// Use a lightweight approach - just get the country-level data if available
		const national = await fetchNationalData(fetchFn, countryCode, periods);

		// Get country shape for metadata
		const countryShape: RegionShape = {
			code: countryCode,
			name: countryCode === 'DE' ? 'Deutschland' : 'Österreich',
			layer: 'country',
			country: countryCode,
			population: national.population
		};

		return {
			region: regionWithData,
			national,
			periods,
			source,
			country: countryShape
		};
	}

	// Fallback: No specific region - need to compute national aggregate
	// This is the slower path, but only used when no region is specified
	return fetchNationalAggregate(fetchFn, countryCode, source);
}

/** Build RegionWithData from raw mobility records and Region object */
function buildRegionWithDataFromRaw(
	inputRegion: Region,
	rawData: RawMobilityRecord[]
): RegionWithData {
	const periods = Array.from(new Set(rawData.map((d) => d.period))).sort(
		(a, b) => Number(a) - Number(b)
	);

	const cars = periods.map((p) => {
		const total = rawData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
		return { period: p, value: total ?? null };
	});

	const population = inputRegion.population ?? 0;

	const carsPer1000Inhabitants = periods.map((p) => {
		const total = cars.find((c) => c.period === p)?.value ?? null;
		return {
			period: p,
			value: total != null && population > 0 ? Math.round((total / population) * 1000) : null
		};
	});

	const carsPrivateShare = periods.map((p) => {
		const privat = rawData.find((d) => d.category === 'Privat' && d.period === p)?.value;
		const total = rawData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
		return { period: p, value: privat != null && total ? (privat / total) * 100 : null };
	});

	const carsCompanyShare = periods.map((p) => {
		const firmen = rawData.find((d) => d.category === 'Firmen' && d.period === p)?.value;
		const total = rawData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
		return { period: p, value: firmen != null && total ? (firmen / total) * 100 : null };
	});

	return {
		code: inputRegion.code,
		code_short: inputRegion.codeShort,
		name: inputRegion.name,
		layer: inputRegion.layer,
		country: '',
		population,
		center: inputRegion.center as [number, number] | undefined,
		cars,
		carsPer1000Inhabitants,
		carsPrivateShare,
		carsCompanyShare
	};
}

/** Fetch lightweight national data for comparison */
async function fetchNationalData(
	fetchFn: typeof fetch,
	countryCode: string,
	periods: string[]
): Promise<RegionWithData> {
	const directus = getDirectusInstance(fetchFn);

	// Try to get pre-aggregated national data if available
	// Or compute a simple estimate based on country population
	const countryPopulation = countryCode === 'DE' ? 84_000_000 : 9_000_000; // Approximate

	// For now, return placeholder national data
	// In production, this could be cached or pre-computed
	const nationalCarsPerCapita = countryCode === 'DE' ? 580 : 570; // Approximate averages

	return {
		code: 'ALL',
		name: countryCode === 'DE' ? 'Deutschland' : 'Österreich',
		layer: 'national',
		country: countryCode,
		population: countryPopulation,
		cars: periods.map((p) => ({
			period: p,
			value: Math.round((countryPopulation * nationalCarsPerCapita) / 1000)
		})),
		carsPer1000Inhabitants: periods.map((p) => ({
			period: p,
			value: nationalCarsPerCapita
		})),
		carsPrivateShare: periods.map((p) => ({ period: p, value: 85 })), // Approximate
		carsCompanyShare: periods.map((p) => ({ period: p, value: 15 })) // Approximate
	};
}

/** Fetch full national aggregate (slower, used when no region specified) */
async function fetchNationalAggregate(
	fetchFn: typeof fetch,
	countryCode: string,
	source: string
): Promise<CarDensityData> {
	const directus = getDirectusInstance(fetchFn);

	// Fetch all mobility data
	const rawData = await directus.request(
		readItems<RawMobilityRecord>('mobility_cars', {
			filter: {
				country: { _eq: countryCode },
				category: { _in: ['Privat', 'Firmen', 'Insgesamt'] }
			},
			fields: ['period', 'region', 'category', 'value', 'source'],
			limit: -1
		})
	);

	const periods = Array.from(
		new Set(rawData.filter((d) => d.category === 'Privat').map((d) => d.period))
	).sort((a, b) => Number(a) - Number(b));

	// Load region shapes
	const allShapes = await getRegions();
	const country = allShapes.find((r) => r.country === countryCode && r.layer === 'country');
	if (!country) throw new Error(`No country metadata found for code "${countryCode}"`);

	const muniShapes = allShapes.filter(
		(r) => r.country === countryCode && r.layer === 'municipality'
	);

	// Helper: get all mobility records for a shape
	const byShape = (shape: RegionShape) =>
		rawData.filter(
			(d) => d.region === shape.code || (shape.code_short && d.region === shape.code_short)
		);

	// Enrich municipalities
	const municipalities: RegionWithData[] = muniShapes.map((shape) =>
		enrichRegionWithData(shape, byShape(shape))
	);

	// Compute national aggregate
	const national = getRegionData(municipalities, null, country, periods);

	return {
		region: national,
		national,
		periods,
		source,
		country
	};
}

/** Enrich a single region shape with calculated data */
function enrichRegionWithData(shape: RegionShape, regionData: RawMobilityRecord[]): RegionWithData {
	const uniqPeriods = Array.from(new Set(regionData.map((d) => d.period))).sort(
		(a, b) => Number(a) - Number(b)
	);

	const cars = uniqPeriods.map((p) => {
		const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
		return { period: p, value: total ?? null };
	});

	const carsPer1000Inhabitants = uniqPeriods.map((p) => {
		const total = cars.find((c) => c.period === p)?.value ?? null;
		return {
			period: p,
			value:
				total != null && shape.population ? Math.round((total / shape.population) * 1000) : null
		};
	});

	const carsPrivateShare = uniqPeriods.map((p) => {
		const privat = regionData.find((d) => d.category === 'Privat' && d.period === p)?.value;
		const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
		return { period: p, value: privat != null && total ? (privat / total) * 100 : null };
	});

	const carsCompanyShare = uniqPeriods.map((p) => {
		const firmen = regionData.find((d) => d.category === 'Firmen' && d.period === p)?.value;
		const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
		return { period: p, value: firmen != null && total ? (firmen / total) * 100 : null };
	});

	return { ...shape, cars, carsPer1000Inhabitants, carsPrivateShare, carsCompanyShare };
}

/** Aggregate a region from child regions */
function aggregateRegion(
	shape: RegionShape,
	childRows: RegionWithData[],
	periods: string[]
): RegionWithData {
	const popSum = childRows.reduce((s, c) => s + (c.population ?? 0), 0);

	const cars = periods.map((p) => {
		const sum = childRows.reduce((acc, r) => {
			const v = r.cars.find((d) => d.period === p)?.value ?? 0;
			return acc + v;
		}, 0);
		return { period: p, value: sum };
	});

	const carsPer1000Inhabitants = periods.map((p) => {
		const total = cars.find((d) => d.period === p)?.value ?? 0;
		return {
			period: p,
			value: popSum > 0 ? Math.round((total / popSum) * 1000) : null
		};
	});

	const carsPrivateShare = periods.map((p) => {
		let privatAbs = 0;
		let totalAbs = 0;
		for (const r of childRows) {
			const share = r.carsPrivateShare.find((d) => d.period === p)?.value;
			const abs = r.cars.find((d) => d.period === p)?.value;
			if (share != null && abs != null) {
				privatAbs += (share / 100) * abs;
				totalAbs += abs;
			}
		}
		return { period: p, value: totalAbs > 0 ? (privatAbs / totalAbs) * 100 : null };
	});

	const carsCompanyShare = periods.map((p) => {
		let firmenAbs = 0;
		let totalAbs = 0;
		for (const r of childRows) {
			const share = r.carsCompanyShare.find((d) => d.period === p)?.value;
			const abs = r.cars.find((d) => d.period === p)?.value;
			if (share != null && abs != null) {
				firmenAbs += (share / 100) * abs;
				totalAbs += abs;
			}
		}
		return { period: p, value: totalAbs > 0 ? (firmenAbs / totalAbs) * 100 : null };
	});

	return {
		...shape,
		population: popSum,
		cars,
		carsPer1000Inhabitants,
		carsPrivateShare,
		carsCompanyShare
	};
}

/** Get data for a specific region or national aggregate */
function getRegionData(
	regions: RegionWithData[],
	selCode: string | null,
	country: RegionShape,
	periods: string[]
): RegionWithData {
	// When a specific region is requested, return it
	if (selCode) {
		const found = regions.find((r) => r.code === selCode || r.code_short === selCode);
		if (found) return found;
	}

	// National aggregation (avoid double counting)
	const base = regions.filter((r) => r.layer === 'municipality').length
		? regions.filter((r) => r.layer === 'municipality')
		: regions.filter((r) => r.layer === 'district').length
			? regions.filter((r) => r.layer === 'district')
			: regions;

	const allPeriods =
		periods.length > 0
			? periods
			: Array.from(new Set(base.flatMap((r) => r.cars.map((d) => d.period)))).sort(
					(a, b) => Number(a) - Number(b)
				);

	return {
		code: 'ALL',
		name: country?.name ?? '',
		population: country.population,
		layer: 'national',
		country: '',
		center: [10.45, 51.1657],

		cars: allPeriods.map((p) => {
			const sum = base.reduce((acc, r) => {
				const val = r.cars.find((d) => d.period === p)?.value;
				return acc + (val ?? 0);
			}, 0);
			return { period: p, value: sum };
		}),

		carsPer1000Inhabitants: allPeriods.map((p) => {
			const totalCars = base.reduce((sum, r) => {
				const val = r.cars.find((d) => d.period === p)?.value;
				return sum + (val ?? 0);
			}, 0);
			return {
				period: p,
				value: country.population > 0 ? Math.round((totalCars / country.population) * 1000) : null
			};
		}),

		carsPrivateShare: allPeriods.map((p) => {
			let totalPrivat = 0;
			let total = 0;
			for (const r of base) {
				const share = r.carsPrivateShare.find((d) => d.period === p)?.value;
				const abs = r.cars.find((d) => d.period === p)?.value;
				if (share != null && abs != null) {
					totalPrivat += (share / 100) * abs;
					total += abs;
				}
			}
			return { period: p, value: total > 0 ? (totalPrivat / total) * 100 : null };
		}),

		carsCompanyShare: allPeriods.map((p) => {
			let totalFirmen = 0;
			let total = 0;
			for (const r of base) {
				const share = r.carsCompanyShare.find((d) => d.period === p)?.value;
				const abs = r.cars.find((d) => d.period === p)?.value;
				if (share != null && abs != null) {
					totalFirmen += (share / 100) * abs;
					total += abs;
				}
			}
			return { period: p, value: total > 0 ? (totalFirmen / total) * 100 : null };
		})
	};
}

// =============================================================================
// Fetch All Regions (for Map component)
// =============================================================================

export interface AllRegionsData {
	regions: RegionWithData[];
	periods: string[];
	source: string;
	country: RegionShape;
}

/** Fetch all regions data (for map visualization) */
export async function fetchAllRegions(fetchFn: typeof fetch): Promise<AllRegionsData> {
	const directus = getDirectusInstance(fetchFn);
	const countryCode = PUBLIC_VERSION.toUpperCase();

	// Fetch raw mobility data
	const rawData = await directus.request(
		readItems<RawMobilityRecord>('mobility_cars', {
			filter: {
				country: { _eq: countryCode },
				category: { _in: ['Privat', 'Firmen', 'Insgesamt'] }
			},
			fields: ['period', 'region', 'category', 'value', 'source'],
			limit: -1
		})
	);

	// Extract metadata
	const sources = Array.from(new Set(rawData.map((d) => d.source).filter(Boolean)));
	const source = sources.join(', ');
	const periods = Array.from(
		new Set(rawData.filter((d) => d.category === 'Privat').map((d) => d.period))
	).sort((a, b) => Number(a) - Number(b));

	// Load region shapes
	const allShapes = await getRegions();
	const country = allShapes.find((r) => r.country === countryCode && r.layer === 'country');
	if (!country) throw new Error(`No country metadata found for code "${countryCode}"`);

	const muniShapes = allShapes.filter(
		(r) => r.country === countryCode && r.layer === 'municipality'
	);
	const districtShapes = allShapes.filter(
		(r) => r.country === countryCode && r.layer === 'district'
	);

	// Helper: get all mobility records for a shape
	const byShape = (shape: RegionShape) =>
		rawData.filter(
			(d) => d.region === shape.code || (shape.code_short && d.region === shape.code_short)
		);

	// Enrich municipalities
	const municipalities: RegionWithData[] = muniShapes.map((shape) =>
		enrichRegionWithData(shape, byShape(shape))
	);

	// Helper to find child municipalities of a district
	const getChildren = (districtId: string) =>
		muniShapes.filter(
			(m) =>
				Array.isArray(m.parents) &&
				m.parents.some((p: any) => p.layer === 'district' && p.id === districtId)
		);

	// Aggregate districts from their municipalities
	const districts: RegionWithData[] = districtShapes.map((shape) => {
		const children = getChildren(shape.id!);
		const childRows = children
			.map((c) => municipalities.find((m) => m.code === c.code))
			.filter((x): x is RegionWithData => !!x);

		return aggregateRegion(shape, childRows, periods);
	});

	// Combine all regions
	const regions: RegionWithData[] = [...municipalities, ...districts];

	return {
		regions,
		periods,
		source,
		country
	};
}

// =============================================================================
// Data Processing Helpers
// =============================================================================

/** Get the latest period's data */
export function getLatestData(
	region: RegionWithData,
	periods: string[]
): {
	period: string;
	cars: number | null;
	carsPer1000: number | null;
	privateShare: number | null;
	companyShare: number | null;
} {
	const latestPeriod = periods[periods.length - 1];

	return {
		period: latestPeriod,
		cars: region.cars.find((d) => d.period === latestPeriod)?.value ?? null,
		carsPer1000:
			region.carsPer1000Inhabitants.find((d) => d.period === latestPeriod)?.value ?? null,
		privateShare: region.carsPrivateShare.find((d) => d.period === latestPeriod)?.value ?? null,
		companyShare: region.carsCompanyShare.find((d) => d.period === latestPeriod)?.value ?? null
	};
}

// =============================================================================
// Table Configuration
// =============================================================================

/** Get table columns */
export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'period', label: 'Jahr', align: 'left' },
		{
			key: 'cars',
			label: 'Autos gesamt',
			align: 'right',
			format: (v) => (typeof v === 'number' ? v.toLocaleString('de-DE') : '–')
		},
		{
			key: 'carsPer1000',
			label: 'Autos pro 1000 EW',
			align: 'right',
			format: (v) => (typeof v === 'number' ? v.toLocaleString('de-DE') : '–')
		},
		{
			key: 'privateShare',
			label: 'Privat (%)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : '–')
		},
		{
			key: 'companyShare',
			label: 'Firmen (%)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : '–')
		}
	];
}

/** Build table rows from region data */
export function buildTableRows(
	region: RegionWithData,
	periods: string[]
): Array<{
	period: string;
	cars: number | null;
	carsPer1000: number | null;
	privateShare: number | null;
	companyShare: number | null;
}> {
	return periods.map((period) => ({
		period,
		cars: region.cars.find((d) => d.period === period)?.value ?? null,
		carsPer1000: region.carsPer1000Inhabitants.find((d) => d.period === period)?.value ?? null,
		privateShare: region.carsPrivateShare.find((d) => d.period === period)?.value ?? null,
		companyShare: region.carsCompanyShare.find((d) => d.period === period)?.value ?? null
	}));
}

// =============================================================================
// Placeholders & Text Generation
// =============================================================================

/** Generate placeholders for titles/descriptions */
export function getPlaceholders(
	data: CarDensityData,
	region?: Region | null
): Record<string, string | number> {
	const { region: regionData, national, periods } = data;
	const latest = getLatestData(regionData, periods);
	const nationalLatest = getLatestData(national, periods);

	// Calculate trend (first vs last period)
	const firstPeriod = periods[0];
	const firstCars = regionData.cars.find((d) => d.period === firstPeriod)?.value ?? 0;
	const lastCars = latest.cars ?? 0;
	const carsTrend = firstCars > 0 ? ((lastCars - firstCars) / firstCars) * 100 : 0;

	// Calculate recent trend (last 2–3 periods) for heading description
	const recentPeriods = periods.slice(-3);
	const recentValues = recentPeriods
		.map((p) => regionData.cars.find((d) => d.period === p)?.value)
		.filter((v): v is number => v != null);
	let trendDescription = 'konstant geblieben';
	if (recentValues.length >= 2) {
		const first = recentValues[0];
		const last = recentValues[recentValues.length - 1];
		const recentChange = first > 0 ? ((last - first) / first) * 100 : 0;
		if (recentChange > 5) trendDescription = 'gestiegen';
		else if (recentChange > 2) trendDescription = 'leicht gestiegen';
		else if (recentChange < -5) trendDescription = 'gesunken';
		else if (recentChange < -2) trendDescription = 'leicht gesunken';
	}

	// Cars per 10 people (for pictogram)
	const carsPerTen = (latest.carsPer1000 ?? 0) / 100;

	// Comparison to national
	const vsNational = (latest.carsPer1000 ?? 0) - (nationalLatest.carsPer1000 ?? 0);
	const vsNationalPercent =
		(nationalLatest.carsPer1000 ?? 0) > 0
			? ((latest.carsPer1000 ?? 0) / (nationalLatest.carsPer1000 ?? 1) - 1) * 100
			: 0;

	// Format numbers for display in text templates
	const formatNumber = (n: number) => n.toLocaleString('de-DE');

	const regionName = region?.name ?? regionData.name;

	return {
		regionName,
		population: regionData.population,
		totalPopulation: formatNumber(regionData.population),
		latestPeriod: latest.period,
		totalCars: formatNumber(latest.cars ?? 0),
		totalCarsRaw: latest.cars ?? 0,
		carsPer1000: latest.carsPer1000 ?? 0,
		carsPerTen: Math.round(carsPerTen * 10) / 10,
		privateShare: latest.privateShare ?? 0,
		companyShare: latest.companyShare ?? 0,
		nationalCarsPer1000: nationalLatest.carsPer1000 ?? 0,
		nationalPrivateShare: nationalLatest.privateShare ?? 0,
		nationalCompanyShare: nationalLatest.companyShare ?? 0,
		vsNational,
		vsNationalPercent,
		carsTrend,
		trendDescription,
		title: `In ${regionName} kommen ${(Math.round(carsPerTen * 10) / 10).toLocaleString('de-DE')} Autos auf 10 Einwohner:innen. Zuletzt ist die Anzahl der Autos ${trendDescription}.`,
		dataYearStart: periods[0],
		dataYearEnd: latest.period
	};
}

/** Generate dynamic title */
export function generateTitle(placeholders: Record<string, string | number>): string {
	const { regionName, totalCars, population } = placeholders;
	const formattedCars = Number(totalCars).toLocaleString('de-DE');
	const formattedPop = Number(population).toLocaleString('de-DE');
	return `In ${regionName} kommen ${formattedCars} Autos auf ${formattedPop} Einwohner:innen.`;
}

/** Generate dynamic subtitle */
export function generateSubtitle(placeholders: Record<string, string | number>): string {
	const { carsPer1000, nationalCarsPer1000, vsNational, regionName } = placeholders;
	const comparison = Number(vsNational) > 0 ? 'mehr' : 'weniger';
	const diff = Math.abs(Number(vsNational));
	return `Mit ${carsPer1000} Autos pro 1000 Einwohner:innen liegt ${regionName} ${diff.toFixed(0)} ${comparison} als der Bundesdurchschnitt (${nationalCarsPer1000}).`;
}

// =============================================================================
// ChartData Builder
// =============================================================================

/** Build ChartData object for Card integration */
export function buildChartData(data: CarDensityData, region?: Region | null): ChartData {
	const { region: regionData, periods, source } = data;
	const placeholders = getPlaceholders(data, region);
	const tableRows = buildTableRows(regionData, periods);

	// Use latest period as update date (format: "YYYY" -> "YYYY-12-31")
	const latestPeriod = periods[periods.length - 1];
	const updateDate = latestPeriod ? `${latestPeriod}-12-31` : new Date().toISOString();

	return {
		raw: tableRows,
		table: {
			columns: getTableColumns(),
			rows: tableRows,
			filename: 'car_density'
		},
		placeholders,
		meta: {
			updateDate,
			source,
			region: region ?? ({ name: regionData.name, id: regionData.code } as any)
		},
		hasData: tableRows.length > 0 && tableRows.some((row) => row.cars != null)
	};
}
