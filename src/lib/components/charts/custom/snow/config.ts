// $lib/components/charts/custom/snow/config.ts

import type { TableColumn, ChartData } from '$lib/components/charts/types';
import { readItems, readItem } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';

export interface SnowRawData {
	date: string;
	sh: number; // snow height in cm
}

export interface WinterData {
	label: string;
	year: number; // winter start year (e.g. 2020 for "2020-2021")
	daysWithSnow: number;
	totalSnowAccumulation: number;
	isCurrentWinter: boolean;
}

export interface Station {
	id: string;
	name: string;
	latitude?: number;
	longitude?: number;
	elevation?: number;
}

export interface SnowResult {
	winters: WinterData[];
	station: Station;
	recordWinter: WinterData | null;
}

/** Get table name based on version */
function getTableName(): string {
	return PUBLIC_VERSION === 'de' ? 'de_dwd_data' : 'at_geosphere_data';
}

/** Get station table name based on version */
function getStationTableName(): string {
	return PUBLIC_VERSION === 'de' ? 'de_dwd_stations' : 'at_geosphere_stations';
}

/** Fetch snow data for a station */
export async function fetchSnowData(stationId: string): Promise<SnowResult | null> {
	if (!stationId) return null;

	const directus = getDirectusInstance();
	const tableName = getTableName();
	const stationTableName = getStationTableName();

	// Fetch station metadata
	const station = await directus.request(readItem(stationTableName, stationId));

	// Fetch snow data
	const data = (await directus.request(
		readItems(tableName, {
			fields: ['date', 'sh'],
			filter: {
				_and: [
					{ station: { id: { _eq: stationId } } },
					{ sh: { _gte: 1 } } // Include only days with snow (sh >= 1cm)
				]
			},
			limit: -1
		})
	)) as SnowRawData[];

	if (!data || data.length === 0) {
		return {
			winters: [],
			station: station as Station,
			recordWinter: null
		};
	}

	// Sort data by date ascending
	const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	// Process into winter seasons
	const winters = processWinterData(sortedData);

	// Find record winter (most snow days)
	const recordWinter =
		winters.length > 0
			? winters.reduce((max, w) => (w.daysWithSnow > max.daysWithSnow ? w : max), winters[0])
			: null;

	return {
		winters,
		station: station as Station,
		recordWinter
	};
}

/** Process raw snow data into winter seasons */
function processWinterData(sortedData: SnowRawData[]): WinterData[] {
	const winters: WinterData[] = [];
	let currentWinter: WinterData | null = null;
	let previousSh: number | null = null;
	let currentWinterStartYear: number | null = null;

	// Determine current winter for marking estimate
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;
	const currentWinterYear = currentMonth >= 7 ? currentYear : currentYear - 1;

	sortedData.forEach((entry) => {
		const date = new Date(entry.date);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;

		// Determine the winter start year (July-June season)
		const winterStartYear = month >= 7 ? year : year - 1;

		// Initialize new winter if needed
		if (currentWinterStartYear !== winterStartYear) {
			if (currentWinter !== null) {
				winters.push(currentWinter);
			}

			currentWinterStartYear = winterStartYear;
			currentWinter = {
				label: `${winterStartYear}-${winterStartYear + 1}`,
				year: winterStartYear,
				daysWithSnow: 0,
				totalSnowAccumulation: 0,
				isCurrentWinter: winterStartYear === currentWinterYear
			};
			previousSh = null;
		}

		if (currentWinter) {
			// Count snow days
			currentWinter.daysWithSnow += 1;

			// Calculate snow accumulation (when snow height increases)
			if (previousSh !== null && entry.sh > previousSh) {
				currentWinter.totalSnowAccumulation += entry.sh - previousSh;
			}

			previousSh = entry.sh;
		}
	});

	// Push the last winter
	if (currentWinter !== null) {
		winters.push(currentWinter);
	}

	return winters;
}

/** Build ChartData for Card integration */
export function buildChartData(
	result: SnowResult,
	translations: Record<string, string>
): ChartData {
	const { winters, station, recordWinter } = result;

	// Build table data
	const rows = winters.map((w) => ({
		winter: w.label,
		year: w.year,
		daysWithSnow: w.daysWithSnow,
		totalSnowAccumulation: w.totalSnowAccumulation
	}));

	const columns: TableColumn[] = [
		{ key: 'winter', label: 'Winter', align: 'left' },
		{
			key: 'daysWithSnow',
			label: 'Schneedeckentage',
			align: 'right',
			format: (v: any) => (typeof v === 'number' ? v.toLocaleString('de-DE') : '–')
		},
		{
			key: 'totalSnowAccumulation',
			label: 'Neuschnee (cm)',
			align: 'right',
			format: (v: any) =>
				typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '–'
		}
	];

	// Calculate placeholders
	const lastCompletedWinter = winters.filter((w) => !w.isCurrentWinter).slice(-1)[0];
	const previousWinter = winters.filter((w) => !w.isCurrentWinter).slice(-2)[0];

	// Calculate trend (comparing last two completed winters)
	let trendText = '';
	if (lastCompletedWinter && previousWinter) {
		const diff = lastCompletedWinter.daysWithSnow - previousWinter.daysWithSnow;
		if (diff > 0) {
			trendText = `${diff} Tage mehr als im Vorwinter`;
		} else if (diff < 0) {
			trendText = `${Math.abs(diff)} Tage weniger als im Vorwinter`;
		} else {
			trendText = 'gleich wie im Vorwinter';
		}
	}

	return {
		raw: winters,
		hasData: winters.length > 0,
		table: {
			columns,
			rows,
			filename: `schneedeckentage_${station.name.toLowerCase().replace(/\s+/g, '_')}`
		},
		placeholders: {
			stationName: station.name,
			recordWinterLabel: recordWinter?.label.replace('Winter ', '') ?? '',
			recordWinterDays: recordWinter?.daysWithSnow ?? 0,
			lastWinterLabel: lastCompletedWinter?.label ?? '',
			lastWinterDays: lastCompletedWinter?.daysWithSnow ?? 0,
			trendText,
			hasRecordWinter: recordWinter !== null && recordWinter.daysWithSnow < 200
		},
		meta: {
			updateDate: new Date().toISOString(),
			source: PUBLIC_VERSION === 'de' ? 'DWD' : 'GeoSphere Austria'
		}
	};
}

/** Bar color for snow chart */
export const SNOW_COLOR = '#11998E';
