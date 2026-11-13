// $lib/components/charts/custom/heatwavesKysely/config.ts

import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import { readItem, readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';
import { formatDate, formatNumber } from '$lib/utils/formatters';
import {
	analyseHeatwaves,
	fillDailySeries,
	findHeatwaveRanges,
	type DailyTmax,
	type HeatwaveYear
} from './kysely';

export interface Station {
	id: string;
	name: string;
	height?: number;
	state?: string;
	latitude?: number;
	longitude?: number;
}

export interface HeatwaveResult {
	station: Station;
	years: HeatwaveYear[];
	/** Last date with a Tmax value (Datenstand) */
	lastDate: string | null;
	firstDate: string | null;
}

export const SOURCE =
	PUBLIC_VERSION === 'de'
		? { name: 'Deutscher Wetterdienst (DWD)', url: 'https://www.dwd.de/DE/klimaumwelt/cdc/cdc_node.html' }
		: { name: 'GeoSphere Austria', url: 'https://www.geosphere.at' };

export const DEFINITION_URL = 'https://www.geosphere.at/en/topics/disaster-protection/heat';

/**
 * Link to the heat-related deaths chart.
 * TODO (AT): placeholder — replace with the Austrian chart/page once it exists in Directus.
 */
export const HEAT_DEATHS_URL: string =
	PUBLIC_VERSION === 'de' ? '/charts/b4fae367-cf62-487f-9c0e-34d736943d3e' : '#TODO-hitzetote-at';
export const isPlaceholderUrl = (url: string) => url.startsWith('#TODO');

const dataTable = () => (PUBLIC_VERSION === 'de' ? 'de_dwd_data' : 'at_geosphere_data');
const stationTable = () => (PUBLIC_VERSION === 'de' ? 'de_dwd_stations' : 'at_geosphere_stations');

/** Loads all daily Tmax values of a station and finds the heatwaves */
export async function fetchHeatwaveData(
	stationId: string,
	fetchFn: typeof globalThis.fetch = fetch
): Promise<HeatwaveResult | null> {
	if (!stationId) return null;
	const directus = getDirectusInstance(fetchFn);

	const [station, rows] = await Promise.all([
		directus.request(readItem(stationTable(), stationId)) as Promise<Station>,
		directus.request(
			readItems(dataTable(), {
				fields: ['date', 'tlmax'],
				filter: {
					_and: [{ station: { id: { _eq: stationId } } }, { tlmax: { _nnull: true } }]
				},
				sort: ['date'],
				limit: -1
			})
		) as Promise<DailyTmax[]>
	]);

	const years = analyseHeatwaves(rows ?? []);
	return {
		station,
		years,
		firstDate: rows?.length ? rows[0].date.slice(0, 10) : null,
		lastDate: rows?.length ? rows[rows.length - 1].date.slice(0, 10) : null
	};
}

export interface RecentHeatwaveStations {
	/** Station IDs with a Kysely day yesterday */
	yesterday: Set<string>;
	/** Station IDs with a Kysely day in the last 7 days (yesterday included) */
	lastWeek: Set<string>;
	/** Latest date found in the data of all stations */
	lastDate: string | null;
}

/** Local calendar date (YYYY-MM-DD), `offset` days from today */
function localIsoDate(offset = 0): string {
	const d = new Date();
	d.setDate(d.getDate() + offset);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A heatwave that is still going on may have started weeks ago, so the
// detection needs enough history before the 7-day window.
const RECENT_HISTORY_DAYS = 60;

/**
 * Finds all stations that had a heatwave (Kysely day) yesterday or in the last 7 days.
 * Loads the last ~60 days of Tmax for all stations in one request.
 */
export async function fetchRecentHeatwaveStations(
	fetchFn: typeof globalThis.fetch = fetch
): Promise<RecentHeatwaveStations> {
	const directus = getDirectusInstance(fetchFn);
	const rows = (await directus.request(
		readItems(dataTable(), {
			fields: ['station', 'date', 'tlmax'],
			filter: {
				_and: [{ date: { _gte: localIsoDate(-RECENT_HISTORY_DAYS) } }, { tlmax: { _nnull: true } }]
			},
			sort: ['date'],
			limit: -1
		})
	)) as Array<DailyTmax & { station: string | number | { id: string | number } }>;

	const byStation = new Map<string, DailyTmax[]>();
	let lastDate: string | null = null;
	for (const r of rows ?? []) {
		const id = String(typeof r.station === 'object' && r.station ? r.station.id : r.station);
		if (!byStation.has(id)) byStation.set(id, []);
		byStation.get(id)!.push({ date: r.date, tlmax: r.tlmax });
		const d = r.date.slice(0, 10);
		if (!lastDate || d > lastDate) lastDate = d;
	}

	const yesterdayIso = localIsoDate(-1);
	const weekStartIso = localIsoDate(-7);
	const yesterday = new Set<string>();
	const lastWeek = new Set<string>();

	for (const [id, stationRows] of byStation) {
		const series = fillDailySeries(stationRows);
		for (const [a, b] of findHeatwaveRanges(series)) {
			const start = series[a].date;
			const end = series[b].date;
			if (start <= yesterdayIso && end >= yesterdayIso) yesterday.add(id);
			if (end >= weekStartIso) lastWeek.add(id);
		}
	}

	return { yesterday, lastWeek, lastDate };
}

/** Builds the ChartData (table, placeholders, source) for the chart card */
export function buildChartData(result: HeatwaveResult): ChartData {
	const { station, years, lastDate } = result;

	const rows = years.map((y) => ({
		year: y.year,
		kysely_days: y.kyselyDays,
		heatwave_count: y.waves.length,
		longest_heatwave_days: y.waves.length ? Math.max(...y.waves.map((w) => w.length)) : 0,
		max_tmax: y.waves.length ? Math.max(...y.waves.map((w) => w.maxTmax)) : null
	}));

	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{ key: 'kysely_days', label: 'Kysely-Tage', align: 'right' },
		{ key: 'heatwave_count', label: 'Hitzewellen', align: 'right' },
		{ key: 'longest_heatwave_days', label: 'Längste Hitzewelle (Tage)', align: 'right' },
		{
			key: 'max_tmax',
			label: 'Höchste Tmax in Hitzewellen (°C)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? formatNumber(v, 1) : '')
		}
	];

	const lastYear = years.at(-1);
	const slug = String(station?.name ?? station?.id ?? 'station')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_|_$/g, '');

	return {
		raw: rows,
		hasData: years.length > 0,
		table: { columns, rows, filename: `hitzewellen_kysely_${slug}` },
		placeholders: {
			stationName: station?.name ?? '',
			lastYear: lastYear?.year ?? null,
			lastYearKyselyDays: lastYear?.kyselyDays ?? 0,
			lastYearHeatwaves: lastYear?.waves.length ?? 0,
			dataUntil: lastDate ? formatDate(lastDate) : ''
		},
		meta: {
			source: SOURCE.name,
			updateDate: lastDate ?? undefined
		}
	};
}

/**
 * The chart needs a weather station, not a region.
 * For SSR we skip it (same as the snow chart); data is loaded client-side.
 */
export async function fetchChartData(_params: ChartFetchParams): Promise<ChartData | null> {
	return null;
}
