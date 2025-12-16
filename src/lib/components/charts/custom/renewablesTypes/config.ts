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
		label: 'PV-Freiflächenanlagen',
		image: '7c1e1b42-2734-442d-bcab-b904e3ebc974'
	},
	{
		key: '853',
		label: 'PV-Dachanlagen',
		image: '1dd45bda-e254-41e9-9bbb-5018ba925be0'
	},
	{
		key: '2961',
		label: 'Balkonkraftwerke',
		image: '1e6120a1-538c-4d68-8506-8d711558adbf'
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
		totalUnits,
		totalPower,
		totalPowerMW: Math.round(totalPower / 1000),
		totalPowerGW: (totalPower / 1_000_000).toFixed(2),
		totalAddedUnitsThisYear,
		totalAddedPowerThisYear,
		totalAddedPowerThisYearMW: Math.round(totalAddedPowerThisYear / 1000),

		// Rooftop (Dachanlagen) - type 853
		rooftopUnits: rooftop.units,
		rooftopPower: rooftop.power_kw,
		rooftopPowerMW: Math.round(rooftop.power_kw / 1000),
		rooftopAddedUnitsThisYear: rooftop.added_units_this_year,
		rooftopAddedPowerThisYear: rooftop.added_power_kw_this_year,
		rooftopPowerPercent: totalPower > 0 ? Math.round((rooftop.power_kw / totalPower) * 100) : 0,

		// Ground-mounted (Freiflächenanlagen) - type 852
		groundMountedUnits: groundMounted.units,
		groundMountedPower: groundMounted.power_kw,
		groundMountedPowerMW: Math.round(groundMounted.power_kw / 1000),
		groundMountedAddedUnitsThisYear: groundMounted.added_units_this_year,
		groundMountedAddedPowerThisYear: groundMounted.added_power_kw_this_year,
		groundMountedPowerPercent:
			totalPower > 0 ? Math.round((groundMounted.power_kw / totalPower) * 100) : 0,

		// Balcony (Balkonkraftwerke) - type 2961
		balconyUnits: balcony.units,
		balconyPower: balcony.power_kw,
		balconyPowerMW: Math.round(balcony.power_kw / 1000),
		balconyAddedUnitsThisYear: balcony.added_units_this_year,
		balconyAddedPowerThisYear: balcony.added_power_kw_this_year,
		balconyPowerPercent: totalPower > 0 ? Math.round((balcony.power_kw / totalPower) * 100) : 0,

		// Other types
		otherUnits: otherStats.units,
		otherPower: otherStats.power_kw,
		otherAddedUnitsThisYear: otherStats.added_units_this_year,
		otherAddedPowerThisYear: otherStats.added_power_kw_this_year,
		otherPowerPercent: totalPower > 0 ? Math.round((otherStats.power_kw / totalPower) * 100) : 0
	};
}
