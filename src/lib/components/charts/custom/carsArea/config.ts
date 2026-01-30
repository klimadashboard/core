// $lib/components/charts/custom/carsArea/config.ts

import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { formatNumber } from '$lib/utils/formatters';
import {
	fetchData,
	getLatestData,
	getColor,
	type CarDensityData
} from '$lib/components/charts/custom/carsDensity/config';

// Re-export shared utilities
export { fetchData, getColor, type CarDensityData };

// =============================================================================
// Constants
// =============================================================================

/** Football pitch: 105m x 68m = 7,140 sqm */
export const PITCH_AREA_SQM = 7140;
export const PITCH_W = 105;
export const PITCH_H = 68;
export const SQM_PER_CAR = 11.5;

// =============================================================================
// Placeholders & Text Generation
// =============================================================================

/** Generate placeholders for CMS heading template */
export function getPlaceholders(
	data: CarDensityData,
	region?: Region | null
): Record<string, string | number> {
	const { region: regionData, periods, source } = data;
	const latest = getLatestData(regionData, periods);

	const totalCars = latest.cars ?? 0;
	const parkingAreaSqm = totalCars * SQM_PER_CAR;
	const footballPitches = parkingAreaSqm / PITCH_AREA_SQM;

	const regionName = region?.name ?? regionData.name;

	return {
		regionName,
		totalCars: formatNumber(totalCars),
		totalCarsRaw: totalCars,
		totalArea: formatNumber(parkingAreaSqm),
		parkingAreaSqm: formatNumber(parkingAreaSqm),
		footballFields: formatNumber(Math.round(footballPitches)),
		footballPitches: formatNumber(Math.round(footballPitches)),
		footballPitchesRaw: Math.round(footballPitches * 10) / 10,
		latestPeriod: latest.period,
		sqmPerCar: SQM_PER_CAR,
		pitchAreaSqm: formatNumber(PITCH_AREA_SQM),
		source: source || '',
		title: `${formatNumber(totalCars)} Autos in ${regionName} verbrauchen eine Fläche von ${formatNumber(Math.round(footballPitches))} Fußballfeldern.`
	};
}

// =============================================================================
// Table Configuration
// =============================================================================

/** Table columns for area chart data */
function getTableColumns(): TableColumn[] {
	return [
		{ key: 'label', label: 'Kennzahl', align: 'left' },
		{ key: 'value', label: 'Wert', align: 'right' }
	];
}

// =============================================================================
// ChartData Builder
// =============================================================================

/** Build ChartData for Card integration */
export function buildChartData(
	data: CarDensityData,
	region?: Region | null,
	privacyNote?: string
): ChartData {
	const { periods, source, region: regionData, hasPrivacySuppression } = data;
	const latest = getLatestData(regionData, periods);
	const placeholders = getPlaceholders(data, region);

	const totalCars = latest.cars ?? 0;
	const parkingAreaSqm = totalCars * SQM_PER_CAR;
	const footballPitches = parkingAreaSqm / PITCH_AREA_SQM;

	const tableRows = [
		{ label: 'Autos gesamt', value: formatNumber(totalCars) },
		{ label: 'Parkfläche (m²)', value: formatNumber(parkingAreaSqm) },
		{ label: 'Fußballfelder', value: formatNumber(Math.round(footballPitches)) }
	];

	const latestPeriod = periods[periods.length - 1];
	const updateDate = latestPeriod ? `${latestPeriod}-12-31` : new Date().toISOString();

	return {
		raw: tableRows,
		table: {
			columns: getTableColumns(),
			rows: tableRows,
			filename: 'car_area'
		},
		placeholders,
		meta: {
			updateDate,
			source,
			region: region ?? ({ name: regionData.name, id: regionData.code } as any),
			note: hasPrivacySuppression ? privacyNote : undefined
		},
		hasData: totalCars > 0 && footballPitches >= 2
	};
}
