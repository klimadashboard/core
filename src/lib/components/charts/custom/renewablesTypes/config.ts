export interface SolarTypeConfig {
	key: string;
	label: string;
	image: string;
}

export interface SolarTypeData {
	power_kw: number;
	units: number;
	added_power_kw_this_year: number;
	added_units_this_year: number;
}

export interface SolarTypesResponse {
	current_by_type: Record<string, SolarTypeData> | null;
	by_year: Array<{
		year: number;
		cumulative_power_kw: number;
		cumulative_units: number;
	}>;
	update_date: string;
}

export interface Region {
	name: string;
	codeShort?: string;
}

// Map API type keys to display labels and images
export const solarTypeConfigs: SolarTypeConfig[] = [
	{
		key: '852',
		label: 'Freiflächenanlagen',
		image: '7c80d095-65cb-47f8-9d6f-3377fc63a925'
	},
	{
		key: '853',
		label: 'Dachanlagen',
		image: '7360877b-f701-4829-b7af-b83b9b5f0090'
	},
	{
		key: '2961',
		label: 'Balkonkraftwerke',
		image: '7d2ceaf9-6b24-414c-9572-2b2c408edcd3'
	}
];

export const baseAssetUrl = 'https://base.klimadashboard.org/assets';

export function getImageUrl(imageId: string, size: string = 'medium'): string {
	return `${baseAssetUrl}/${imageId}?key=${size}`;
}

export function formatNumber(value: number, locale: string = 'de-DE'): string {
	return value.toLocaleString(locale, {
		maximumFractionDigits: 0
	});
}

export function formatPercentage(part: number, total: number): string {
	if (total === 0) return '0';
	const pct = Math.round((part / total) * 100);
	if (pct === 0 && part > 0) return '<1';
	if (pct === 100 && part < total) return '>99';
	return pct.toString();
}

/** Fetch solar types data from API */
export async function fetchSolarTypesData(region: Region | null): Promise<SolarTypesResponse> {
	const regionCode = region?.codeShort;

	const url = regionCode
		? `https://base.klimadashboard.org/get-renewables-growth?table=energy_solar_units&group=year&region=${regionCode}`
		: `https://base.klimadashboard.org/get-renewables-growth?table=energy_solar_units&group=year`;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	return await response.json();
}

/** Generate placeholders for text templates */
export function getPlaceholders(
	data: SolarTypesResponse | null,
	region: Region | null
): Record<string, string | number> {
	const currentYear = new Date().getFullYear();
	const currentByType = data?.current_by_type || {};
	const knownTypeKeys = new Set(solarTypeConfigs.map((t) => t.key));

	// Calculate totals
	const totalUnits = Object.values(currentByType).reduce((sum, d) => sum + (d.units || 0), 0);
	const totalPower = Object.values(currentByType).reduce((sum, d) => sum + (d.power_kw || 0), 0);
	const totalAddedUnitsThisYear = Object.values(currentByType).reduce(
		(sum, d) => sum + (d.added_units_this_year || 0),
		0
	);
	const totalAddedPowerThisYear = Object.values(currentByType).reduce(
		(sum, d) => sum + (d.added_power_kw_this_year || 0),
		0
	);

	// Calculate "other" category totals
	const otherStats = Object.entries(currentByType)
		.filter(([type]) => !knownTypeKeys.has(type))
		.reduce(
			(acc, [_, val]) => {
				acc.units += val.units || 0;
				acc.power_kw += val.power_kw || 0;
				acc.added_units_this_year += val.added_units_this_year || 0;
				acc.added_power_kw_this_year += val.added_power_kw_this_year || 0;
				return acc;
			},
			{ units: 0, power_kw: 0, added_units_this_year: 0, added_power_kw_this_year: 0 }
		);

	// Get stats per type
	const getTypeStats = (key: string) => {
		const entry = currentByType[key];
		return {
			units: entry?.units || 0,
			power_kw: entry?.power_kw || 0,
			added_units_this_year: entry?.added_units_this_year || 0,
			added_power_kw_this_year: entry?.added_power_kw_this_year || 0
		};
	};

	const rooftop = getTypeStats('853');
	const groundMounted = getTypeStats('852');
	const balcony = getTypeStats('2961');

	return {
		// Region
		regionName: region?.name || 'Deutschland',

		// Time
		currentYear,
		updateDate: data?.update_date || '',

		// Totals
		totalUnits: formatNumber(totalUnits),
		totalPower: formatNumber(totalPower),
		totalPowerMW: formatNumber(Math.round(totalPower / 1000)),
		totalPowerGW: (totalPower / 1_000_000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
		totalAddedUnitsThisYear: formatNumber(totalAddedUnitsThisYear),
		totalAddedPowerThisYear: formatNumber(totalAddedPowerThisYear),
		totalAddedPowerThisYearMW: formatNumber(Math.round(totalAddedPowerThisYear / 1000)),

		// Rooftop (Dachanlagen) - type 853
		rooftopUnits: formatNumber(rooftop.units),
		rooftopPower: formatNumber(rooftop.power_kw),
		rooftopPowerMW: formatNumber(Math.round(rooftop.power_kw / 1000)),
		rooftopAddedUnitsThisYear: formatNumber(rooftop.added_units_this_year),
		rooftopAddedPowerThisYear: formatNumber(rooftop.added_power_kw_this_year),
		rooftopPowerPercent: totalPower > 0 ? Math.round((rooftop.power_kw / totalPower) * 100) : 0,

		// Ground-mounted (Freiflächenanlagen) - type 852
		groundMountedUnits: formatNumber(groundMounted.units),
		groundMountedPower: formatNumber(groundMounted.power_kw),
		groundMountedPowerMW: formatNumber(Math.round(groundMounted.power_kw / 1000)),
		groundMountedAddedUnitsThisYear: formatNumber(groundMounted.added_units_this_year),
		groundMountedAddedPowerThisYear: formatNumber(groundMounted.added_power_kw_this_year),
		groundMountedPowerPercent:
			totalPower > 0 ? Math.round((groundMounted.power_kw / totalPower) * 100) : 0,

		// Balcony (Balkonkraftwerke) - type 2961
		balconyUnits: formatNumber(balcony.units),
		balconyPower: formatNumber(balcony.power_kw),
		balconyPowerMW: formatNumber(Math.round(balcony.power_kw / 1000)),
		balconyAddedUnitsThisYear: formatNumber(balcony.added_units_this_year),
		balconyAddedPowerThisYear: formatNumber(balcony.added_power_kw_this_year),
		balconyPowerPercent: totalPower > 0 ? Math.round((balcony.power_kw / totalPower) * 100) : 0,

		// Other types
		otherUnits: formatNumber(otherStats.units),
		otherPower: formatNumber(otherStats.power_kw),
		otherAddedUnitsThisYear: formatNumber(otherStats.added_units_this_year),
		otherAddedPowerThisYear: formatNumber(otherStats.added_power_kw_this_year),
		otherPowerPercent: totalPower > 0 ? Math.round((otherStats.power_kw / totalPower) * 100) : 0
	};
}

/** Get table columns */
export function getTableColumns(): Array<{
	key: string;
	label: string;
	align: 'left' | 'right';
	format?: (v: any) => string;
}> {
	return [
		{ key: 'type', label: 'Typ', align: 'left' },
		{ key: 'units', label: 'Anzahl', align: 'right', format: (v) => formatNumber(v) },
		{ key: 'power_kw', label: 'Leistung (kWp)', align: 'right', format: (v) => formatNumber(v) },
		{
			key: 'added_units_this_year',
			label: 'Neu (Anzahl)',
			align: 'right',
			format: (v) => formatNumber(v)
		},
		{
			key: 'added_power_kw_this_year',
			label: 'Neu (kWp)',
			align: 'right',
			format: (v) => formatNumber(v)
		}
	];
}

/** Build table rows from current_by_type data */
export function buildTableRows(data: SolarTypesResponse | null): Array<Record<string, any>> {
	if (!data?.current_by_type) return [];

	return solarTypeConfigs.map((config) => {
		const entry = data.current_by_type?.[config.key];
		return {
			type: config.label,
			units: entry?.units || 0,
			power_kw: entry?.power_kw || 0,
			added_units_this_year: entry?.added_units_this_year || 0,
			added_power_kw_this_year: entry?.added_power_kw_this_year || 0
		};
	});
}

/** Build ChartData object for Card.svelte integration */
export function buildChartData(
	data: SolarTypesResponse | null,
	region: Region | null
): {
	raw: any[];
	table: { columns: any[]; rows: any[]; filename: string };
	placeholders: Record<string, string | number>;
	meta: { updateDate: string; source: string; region: Region | null };
} {
	return {
		raw: buildTableRows(data),
		table: {
			columns: getTableColumns(),
			rows: buildTableRows(data),
			filename: 'solar_types'
		},
		placeholders: getPlaceholders(data, region),
		meta: {
			updateDate: data?.update_date || '',
			source: 'Marktstammdatenregister der Bundesnetzagentur',
			region
		}
	};
}
