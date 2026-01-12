import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import type { Region } from '$lib/utils/getRegion';
import type { ChartData, TableColumn } from '$lib/components/charts/types';

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

// Target year for climate goals
export const TARGET_YEAR = 2045;
export const CENSUS_DATE = new Date('2022-05-15');

/** Get total days from census date until target year */
export function getTotalDaysToTarget(): number {
	const targetDate = new Date(`${TARGET_YEAR}-01-01`);
	return Math.floor((targetDate.getTime() - CENSUS_DATE.getTime()) / (1000 * 60 * 60 * 24));
}

/** Format exchange rate per time unit */
export function formatExchangeRate(total: number): { value: number; unit: 'day' | 'month' | 'year' } {
	const totalDays = getTotalDaysToTarget();
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

/** Fetch heating data for a region */
export async function fetchHeatingData(
	regionObj: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): Promise<HeatingDataPoint[]> {
	if (!regionObj) return [];

	const directus = getDirectusInstance(fetch);

	// If a district: collect all municipalities and query them in one go
	if (regionObj.layer === 'district') {
		const children = getChildMunicipalities(allRegions, regionObj.id);
		const muniCodes = children.map((c) => c.code);

		if (muniCodes.length === 0) return [];

		const rawData = await directus.request(
			readItems('energy_heating_systems', {
				filter: { region: { _in: muniCodes } },
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

	// Default: municipality
	const rawData = await directus.request(
		readItems('energy_heating_systems', {
			filter: { region: { _eq: regionObj.code } }
		})
	);

	const total = (rawData as any[]).find((d) => d.category === 'total')?.value ?? 0;
	return (rawData as any[]).map((d) => ({
		category: d.category,
		value: d.value,
		percentage: total ? (d.value / total) * 100 : null
	}));
}

/** Build region label with aggregation info for districts */
export function buildRegionLabel(
	region: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): string {
	if (!region) return '';
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

/** Get comparison regions based on distance or city status */
export function getComparisonRegions(
	selectedRegion: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): RegionWithDistance[] {
	if (!selectedRegion) return [];

	// For large cities, show other major cities
	if (selectedRegion.population && selectedRegion.population > 100000) {
		return allRegions.filter((d) => cityRegions.includes(d.code));
	}

	// Otherwise, show nearest regions
	const regionsWithDistance = allRegions
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

	const gasRate = formatExchangeRate(gasEntry?.value ?? 0);
	const oilRate = formatExchangeRate(oilEntry?.value ?? 0);

	return {
		regionName: region?.name || '',
		regionLabel: buildRegionLabel(region, allRegions),
		total: processed.total,
		gasCount: gasEntry?.value ?? 0,
		gasPercentage: gasEntry?.percentage ?? 0,
		gasExchangeValue: gasRate.value,
		gasExchangeUnit: gasRate.unit,
		oilCount: oilEntry?.value ?? 0,
		oilPercentage: oilEntry?.percentage ?? 0,
		oilExchangeValue: oilRate.value,
		oilExchangeUnit: oilRate.unit,
		heatPumpCount: heatPumpEntry?.value ?? 0,
		heatPumpPercentage: heatPumpEntry?.percentage ?? 0,
		targetYear: TARGET_YEAR
	};
}

/** Build ChartData for Card integration */
export function buildChartData(
	data: HeatingDataPoint[],
	region: RegionWithDistance | null,
	allRegions: RegionWithDistance[]
): ChartData {
	return {
		raw: data,
		table: {
			columns: getTableColumns(),
			rows: buildTableRows(data),
			filename: 'heating_systems'
		},
		placeholders: getPlaceholders(data, region, allRegions),
		meta: {
			updateDate: '2024-06-26', // Census 2022 data release date
			source: 'Statistisches Bundesamt (2024): Zensus 2022',
			region: region as any
		}
	};
}
