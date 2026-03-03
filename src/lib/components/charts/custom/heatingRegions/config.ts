import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import type { Region } from '$lib/utils/getRegion';
import type { ChartData, TableColumn, ChartFetchParams } from '$lib/components/charts/types';

export interface HeatingCategory {
	key: string;
	label: string;
	color: string;
	featured?: boolean;
}

export interface HeatingDataPoint {
	category: string;
	value: number;
	percentage: number | null;
	region_label?: string;
}

export interface RegionWithDistance {
	id: string;
	code: string;
	name: string;
	layer: string;
	country?: string;
	center: [string, string];
	population?: number;
	parents?: Array<{ id: string; layer: string }>;
	distance?: number;
}

export const categories: HeatingCategory[] = [
	{ key: 'gas', label: 'Gasheizungen', color: '#118BD2', featured: true },
	{
		key: 'district heating (various energy sources)',
		label: 'Fernwärme',
		color: '#BF1A5C',
		featured: true
	},
	{ key: 'heating oil', label: 'Heizöl', color: '#9C3A03', featured: true },
	{ key: 'electricity (without heat pump)', label: 'Strom', color: '#EA2643' },
	{ key: 'wood, wood pellets', label: 'Holz', color: '#9F987A' },
	{
		key: 'solar/geothermal energy, heat pumps',
		label: 'Wärmepumpen, Solar-/Geothermie',
		color: '#047857',
		featured: true
	},
	{ key: 'no energy source (no heating)', label: 'Keine Heizung', color: '#6B7280' },
	{ key: 'coal', label: 'Kohle', color: '#374151' },
	{ key: 'biomass (excluding wood), biogas', label: 'Biomasse & Biogas', color: '#3F6212' }
];

export const cityRegions = ['091620000000', '110000000000', '020000000000'];

// Target year for climate goals (AT: 2040 Klimaneutralität, DE: 2045)
export const TARGET_YEAR_DE = 2045;
export const TARGET_YEAR_AT = 2040;
export const TARGET_YEAR = TARGET_YEAR_DE; // backwards compat default

export const CENSUS_DATE_DE = new Date('2022-05-15');

/** Get target year for a country */
export function getTargetYear(country?: string): number {
	return country === 'AT' ? TARGET_YEAR_AT : TARGET_YEAR_DE;
}

/** Get total days from a base date until target year */
export function getTotalDaysToTarget(country?: string, baseDate?: Date): number {
	const target = getTargetYear(country);
	const base = baseDate ?? CENSUS_DATE_DE;
	const targetDate = new Date(`${target}-01-01`);
	return Math.floor((targetDate.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}

/** Format exchange rate per time unit */
export function formatExchangeRate(total: number, country?: string, baseDate?: Date): { value: number; unit: 'day' | 'month' | 'year' } {
	const totalDays = getTotalDaysToTarget(country, baseDate);
	const perDay = total / totalDays;
	const perMonth = perDay * 30.4375;
	const perYear = perDay * 365;

	if (perYear > 100) {
		if (perMonth > 60) {
			return { value: Math.round(perDay), unit: 'day' };
		}
		return { value: Math.round(perMonth), unit: 'month' };
	}
	return { value: Math.round(perYear), unit: 'year' };
}

/** Get child municipalities for a district */
function getChildMunicipalities(
	regions: RegionWithDistance[],
	districtId: string
): RegionWithDistance[] {
	return regions.filter(
		(r) =>
			r.layer === 'municipality' &&
			Array.isArray(r.parents) &&
			r.parents.some((p) => p.id === districtId && p.layer === 'district')
	);
}

/** Find parent state for an AT region */
function findParentState(
	regionObj: RegionWithDistance,
	allRegions: RegionWithDistance[]
): RegionWithDistance | null {
	// If the region is itself a state, return it
	if (regionObj.layer === 'state') return regionObj;

	// Find parent state from parents array
	const stateParent = regionObj.parents?.find((p) => p.layer === 'state');
	if (stateParent) {
		return allRegions.find((r) => r.id === stateParent.id) ?? null;
	}

	// Fallback: for districts, look at child municipalities' parent states
	if (regionObj.layer === 'district') {
		const child = allRegions.find(
			(r) =>
				r.layer === 'municipality' &&
				r.parents?.some((p) => p.id === regionObj.id && p.layer === 'district')
		);
		if (child) {
			const childState = child.parents?.find((p) => p.layer === 'state');
			if (childState) return allRegions.find((r) => r.id === childState.id) ?? null;
		}
	}

	return null;
}

/** Get the region whose data is actually displayed (may differ from selected region).
 *  AT: data is at federal state level, so a municipality/district maps to its parent state.
 *  DE: municipality has its own data; districts aggregate child municipalities. */
export function getDataRegion(
	region: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): RegionWithDistance | null {
	if (!region) return null;
	if (region.country === 'AT') {
		return findParentState(region, allRegions) ?? region;
	}
	return region;
}

/** Fetch heating data for an AT region (mikrozensus, by federal state) */
async function fetchHeatingDataAT(
	regionObj: RegionWithDistance,
	allRegions: RegionWithDistance[]
): Promise<{ data: HeatingDataPoint[]; stateName: string; dataPeriod?: Date }> {
	const state = findParentState(regionObj, allRegions);
	if (!state) return { data: [], stateName: '' };

	const directus = getDirectusInstance(fetch);

	// Query mikrozensus data for the parent state, latest year, absolute values
	const rawData = (await directus.request(
		readItems('energy_heating_systems', {
			filter: {
				source: { _eq: 'mikrozensus-statistik-austria' },
				region: { _eq: state.id },
				unit: { _eq: 'absolute' }
			},
			sort: ['-period'],
			limit: -1
		})
	)) as any[];

	if (rawData.length === 0) return { data: [], stateName: state.name };

	// Get the latest period only
	const latestPeriod = rawData[0].period;
	const latestData = rawData.filter((d) => d.period === latestPeriod);

	const total = latestData.find((d) => d.category === 'total')?.value ?? 0;
	const data = latestData.map((d) => ({
		category: d.category,
		value: d.value,
		percentage: total ? (d.value / total) * 100 : null,
		region_label: state.name
	}));

	return {
		data: data.sort((a, b) => (a.category === 'total' ? -1 : b.category === 'total' ? 1 : 0)),
		stateName: state.name,
		dataPeriod: new Date(latestPeriod)
	};
}

/** Fetch heating data for a region (DE: census per municipality, AT: mikrozensus per federal state) */
export async function fetchHeatingData(
	regionObj: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): Promise<HeatingDataPoint[]> {
	if (!regionObj) return [];

	// AT regions: use mikrozensus data aggregated to federal state level
	if (regionObj.country === 'AT') {
		const { data } = await fetchHeatingDataAT(regionObj, allRegions);
		return data;
	}

	const directus = getDirectusInstance(fetch);

	// DE: If a district, collect all municipalities and query them in one go
	if (regionObj.layer === 'district') {
		const children = getChildMunicipalities(allRegions, regionObj.id);
		const muniIds = children.map((c) => c.id);

		if (muniIds.length === 0) return [];

		const rawData = await directus.request(
			readItems('energy_heating_systems', {
				filter: {
					region: { _in: muniIds },
					source: { _eq: 'zensus-federal-statistical-office' }
				},
				limit: -1
			})
		);

		// Sum values per category across municipalities
		const sums = new Map<string, number>();
		for (const row of rawData as any[]) {
			const key = row.category;
			sums.set(key, (sums.get(key) ?? 0) + (Number(row.value) || 0));
		}

		const total = sums.get('total') ?? 0;
		const data = Array.from(sums.entries()).map(([category, value]) => ({
			category,
			value,
			percentage: total ? (value / total) * 100 : null
		}));

		return data.sort((a, b) => (a.category === 'total' ? -1 : b.category === 'total' ? 1 : 0));
	}

	// DE: Default — municipality
	const rawData = await directus.request(
		readItems('energy_heating_systems', {
			filter: {
				region: { _eq: regionObj.id },
				source: { _eq: 'zensus-federal-statistical-office' }
			}
		})
	);

	const total = (rawData as any[]).find((d) => d.category === 'total')?.value ?? 0;
	return (rawData as any[]).map((d) => ({
		category: d.category,
		value: d.value,
		percentage: total ? (d.value / total) * 100 : null
	}));
}

/** Build region label with aggregation info for districts / AT state-level */
export function buildRegionLabel(
	region: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): string {
	if (!region) return '';

	// AT regions: show state-level attribution
	if (region.country === 'AT') {
		const state = findParentState(region, allRegions);
		if (state && state.id !== region.id) {
			return `${region.name} – Daten für ${state.name} (Bundesland)`;
		}
		return region.name ?? '';
	}

	if (region.layer === 'district') {
		const count = getChildMunicipalities(allRegions, region.id).length;
		return `${region.name} – aggregiert aus ${count} Gemeinden`;
	}
	return region.name ?? '';
}

/** Calculate distance between two points using Haversine formula */
export function getDistance(
	center1: [string, string],
	center2: [string, string]
): number {
	const R = 6371; // Earth's radius in km
	const lat1 = parseFloat(center1[1]);
	const lon1 = parseFloat(center1[0]);
	const lat2 = parseFloat(center2[1]);
	const lon2 = parseFloat(center2[0]);
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) *
			Math.cos(lat2 * (Math.PI / 180)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/** Get comparison regions — regions that have distinct data from the selected one.
 *  AT: always compares federal states (since data is at state level).
 *  DE: compares nearby same-layer regions or major cities. */
export function getComparisonRegions(
	selectedRegion: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): RegionWithDistance[] {
	if (!selectedRegion) return [];

	// AT: compare at state level (data is per federal state)
	if (selectedRegion.country === 'AT') {
		const dataRegion = getDataRegion(selectedRegion, allRegions);
		const otherStates = allRegions.filter(
			(r) =>
				r.country === 'AT' &&
				r.layer === 'state' &&
				r.id !== dataRegion?.id
		);
		// Sort by distance from the selected region (or its parent state)
		const anchor = dataRegion ?? selectedRegion;
		return otherStates
			.map((r) => ({
				...r,
				distance: anchor.center ? getDistance(anchor.center, r.center) : Infinity
			}))
			.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
			.slice(0, 5);
	}

	// DE large cities: show other major DE cities
	if (
		selectedRegion.population &&
		selectedRegion.population > 100000
	) {
		return allRegions.filter((d) => cityRegions.includes(d.code));
	}

	// DE: nearest same-layer regions by distance
	const comparable = allRegions.filter(
		(r) =>
			r.country === selectedRegion.country &&
			r.layer === selectedRegion.layer &&
			r.code !== selectedRegion.code
	);

	const regionsWithDistance = comparable
		.map((region) => ({
			...region,
			distance: selectedRegion.center
				? getDistance(selectedRegion.center, region.center)
				: Infinity
		}))
		.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

	return regionsWithDistance.slice(0, 5);
}

/** Process data for chart display */
export function processChartData(data: HeatingDataPoint[]): {
	visualised: HeatingDataPoint[];
	other: HeatingDataPoint[];
	total: number;
} {
	const totalEntry = data.find((d) => d.category === 'total');
	const total = totalEntry?.value ?? 0;

	const processed = data
		.filter((d) => d.category !== 'total')
		.map((d) => ({
			...d,
			percentage: total ? (d.value / total) * 100 : null
		}))
		.sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));

	return {
		visualised: processed.filter((d) => (d.percentage ?? 0) > 1),
		other: processed.filter((d) => (d.percentage ?? 0) <= 1),
		total
	};
}

/** Get category config by key */
export function getCategoryConfig(key: string): HeatingCategory | undefined {
	return categories.find((c) => c.key === key);
}

/** Format number for display */
export function formatNumber(value: number | null | undefined): string {
	if (value == null) return '–';
	return value.toLocaleString('de-DE', { maximumFractionDigits: 1 });
}

/** Build table columns */
export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'category', label: 'Energieträger', align: 'left' },
		{
			key: 'value',
			label: 'Anzahl',
			align: 'right',
			format: (v) => formatNumber(v)
		},
		{
			key: 'percentage',
			label: 'Anteil (%)',
			align: 'right',
			format: (v) => formatNumber(v)
		}
	];
}

/** Build table rows */
export function buildTableRows(data: HeatingDataPoint[]): Array<Record<string, any>> {
	return data
		.filter((d) => d.category !== 'total')
		.map((d) => {
			const cat = getCategoryConfig(d.category);
			return {
				category: cat?.label || d.category,
				value: d.value,
				percentage: d.percentage
			};
		})
		.sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));
}

/** Get placeholders for text templates */
export function getPlaceholders(
	data: HeatingDataPoint[],
	region: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): Record<string, string | number> {
	const processed = processChartData(data);
	const gasEntry = data.find((d) => d.category === 'gas');
	const oilEntry = data.find((d) => d.category === 'heating oil');
	const heatPumpEntry = data.find((d) => d.category === 'solar/geothermal energy, heat pumps');

	const country = region?.country;
	const gasRate = formatExchangeRate(gasEntry?.value ?? 0, country);
	const oilRate = formatExchangeRate(oilEntry?.value ?? 0, country);

	// Use the actual data region name (e.g. Steiermark, not Graz)
	const dataRegion = getDataRegion(region, allRegions);
	const layerLabel = (dataRegion as any)?.layer_label || (region as any)?.layer_label || '';

	const isAT = country === 'AT';
	const isDE = country === 'DE' || !country;

	const districtHeatingEntry = data.find(
		(d) => d.category === 'district heating (various energy sources)'
	);
	const woodEntry = data.find((d) => d.category === 'wood, wood pellets');
	const fossilPct =
		(gasEntry?.percentage ?? 0) + (oilEntry?.percentage ?? 0);

	// Build regionName with layer_label suffix for disambiguation (e.g., "Salzburg (Bundesland)")
	const baseName = dataRegion?.name || region?.name || '';
	const regionNameDisplay = layerLabel && region?.layer !== 'country'
		? `${baseName} (${layerLabel})`
		: baseName;

	return {
		regionName: regionNameDisplay,
		layerLabel,
		regionLabel: buildRegionLabel(region, allRegions),
		total: processed.total,
		gasCount: gasEntry?.value ?? 0,
		gasPercentage: formatNumber(gasEntry?.percentage ?? 0),
		gasExchangeValue: gasRate.value,
		gasExchangeUnit: gasRate.unit,
		oilCount: oilEntry?.value ?? 0,
		oilPercentage: formatNumber(oilEntry?.percentage ?? 0),
		oilExchangeValue: oilRate.value,
		oilExchangeUnit: oilRate.unit,
		heatPumpCount: heatPumpEntry?.value ?? 0,
		heatPumpPercentage: formatNumber(heatPumpEntry?.percentage ?? 0),
		districtHeatingPercentage: formatNumber(districtHeatingEntry?.percentage ?? 0),
		woodPercentage: formatNumber(woodEntry?.percentage ?? 0),
		fossilPercentage: formatNumber(fossilPct),
		targetYear: getTargetYear(country),
		// Country flags for conditional text blocks
		isAT: isAT ? 1 : 0,
		isDE: isDE ? 1 : 0
	};
}

/** Build ChartData for Card integration */
export function buildChartData(
	data: HeatingDataPoint[],
	region: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): ChartData {
	const isAT = region?.country === 'AT';
	const dataRegion = getDataRegion(region, allRegions);
	return {
		raw: data,
		table: {
			columns: getTableColumns(),
			rows: buildTableRows(data),
			filename: 'heating_systems'
		},
		placeholders: getPlaceholders(data, region, allRegions),
		meta: {
			updateDate: isAT ? undefined : '2024-06-26',
			source: isAT
				? 'Statistik Austria, Mikrozensus Energieeinsatz der Haushalte'
				: 'Statistisches Bundesamt (2024): Zensus 2022',
			region: region as any,
			dataRegion: dataRegion as any
		}
	};
}

export async function fetchChartData({
	regionId,
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	if (!regionId) return null;

	const directus = getDirectusInstance(fetchFn);

	const allRegions = (await directus.request(
		readItems('regions', {
			fields: ['id', 'code', 'name', 'layer', 'layer_label', 'country', 'center', 'population', 'parents'],
			filter: { visible: { _eq: true } },
			limit: -1
		})
	)) as (RegionWithDistance & { layer_label?: string })[];

	const region = allRegions.find((r) => r.id === regionId) as RegionWithDistance | undefined;
	if (!region) return null;

	const data = await fetchHeatingData(region, allRegions);
	if (!data || data.length === 0) return null;

	return buildChartData(data, region, allRegions);
}
