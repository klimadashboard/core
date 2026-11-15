import type { ChartFetchParams, ChartData, TableColumn } from '$lib/components/charts/types';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { formatNumber, formatPercent } from '$lib/utils/formatters';

interface Incident {
	date_start: string | null;
	lat: number | null;
}

export interface YearShare {
	year: number;
	total: number;
	geocoded: number;
	/** share of geocoded incidents, 0–100 */
	share: number;
}

const VIENNA_YEAR = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Vienna', year: 'numeric' });

export async function loadIncidents(fetchFn: typeof fetch): Promise<Incident[]> {
	const directus = getDirectusInstance(fetchFn);
	const items = await directus.request(
		readItems('mobility_tram_parking', {
			limit: -1,
			fields: ['date_start', 'lat'],
			// Exclude Wiener Linien "stoerungkurz" entries (incident_id like
			// "R1620-160") -- one duplicate per affected stop, see tramParkingChart.
			filter: { incident_id: { _nstarts_with: 'R' } }
		})
	);
	return items as Incident[];
}

/** Incidents per year and how many of them could be geocoded (same rule as the map: lat set). */
export function buildShares(incidents: Incident[]): YearShare[] {
	const byYear = new Map<number, { total: number; geocoded: number }>();
	for (const inc of incidents) {
		if (!inc.date_start) continue;
		const year = Number(VIENNA_YEAR.format(new Date(inc.date_start)));
		const entry = byYear.get(year) ?? { total: 0, geocoded: 0 };
		entry.total += 1;
		if (inc.lat != null) entry.geocoded += 1;
		byYear.set(year, entry);
	}
	return [...byYear.entries()]
		.sort(([a], [b]) => a - b)
		.map(([year, { total, geocoded }]) => ({
			year,
			total,
			geocoded,
			share: total ? (geocoded / total) * 100 : 0
		}));
}

export function buildChartData(rows: YearShare[]): ChartData | null {
	if (!rows.length) return null;

	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{ key: 'total', label: 'Vorfälle', align: 'right', format: (v) => formatNumber(v as number, 0) },
		{
			key: 'geocoded',
			label: 'davon verortet',
			align: 'right',
			format: (v) => formatNumber(v as number, 0)
		},
		{
			key: 'share',
			label: 'Anteil verortet',
			align: 'right',
			format: (v) => formatPercent(v as number, 1)
		}
	];

	const total = rows.reduce((s, r) => s + r.total, 0);
	const geocoded = rows.reduce((s, r) => s + r.geocoded, 0);
	const latest = rows[rows.length - 1];

	return {
		raw: rows,
		table: { columns, rows, filename: 'falschparker-wien-anteil-verortet' },
		placeholders: {
			total: formatNumber(total, 0),
			geocoded: formatNumber(geocoded, 0),
			shareAll: formatPercent(total ? (geocoded / total) * 100 : 0, 0),
			latestYear: latest.year,
			latestShare: formatPercent(latest.share, 0)
		},
		meta: { source: 'Wiener Linien Störungsmeldungen | f59.at, eigene Berechnungen' }
	};
}

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	try {
		return buildChartData(buildShares(await loadIncidents(fetchFn)));
	} catch (e) {
		console.error('tramParkingGeocoded fetchChartData error:', e);
		return null;
	}
}
