import type { ChartFetchParams, ChartData, TableColumn } from '$lib/components/charts/types';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { formatNumber } from '$lib/utils/formatters';

interface Incident {
	date_start: string | null;
}

export interface YearSeries {
	year: number;
	/** cumulative incidents per day of year, index 0 = 1 Jan; shorter for the running year */
	cases: number[];
}

const VIENNA_DATE = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Europe/Vienna',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

/** [year, dayOfYear (1-based)] of a timestamp in Vienna local time */
function viennaYearDay(iso: string): [number, number] {
	const [y, m, d] = VIENNA_DATE.format(new Date(iso)).split('-').map(Number);
	return [y, Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1];
}

export async function loadIncidents(fetchFn: typeof fetch): Promise<Incident[]> {
	const directus = getDirectusInstance(fetchFn);
	const items = await directus.request(
		readItems('mobility_tram_parking', {
			limit: -1,
			fields: ['date_start'],
			// Exclude Wiener Linien "stoerungkurz" entries (incident_id like
			// "R1620-160") -- one duplicate per affected stop, see tramParkingChart.
			filter: { incident_id: { _nstarts_with: 'R' } }
		})
	);
	return items as Incident[];
}

export function buildSeries(incidents: Incident[], today = new Date()): YearSeries[] {
	const [currentYear, currentDay] = viennaYearDay(today.toISOString());
	const daily = new Map<number, number[]>();

	for (const inc of incidents) {
		if (!inc.date_start) continue;
		const [year, day] = viennaYearDay(inc.date_start);
		if (!daily.has(year)) daily.set(year, new Array(366).fill(0));
		daily.get(year)![day - 1] += 1;
	}

	return [...daily.entries()]
		.sort(([a], [b]) => a - b)
		.map(([year, d]) => {
			const isLeap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
			const length = year === currentYear ? currentDay : isLeap ? 366 : 365;
			let sum = 0;
			return { year, cases: d.slice(0, length).map((v) => (sum += v)) };
		});
}

export function buildChartData(series: YearSeries[]): ChartData | null {
	if (!series.length) return null;

	const current = series[series.length - 1];
	const previous = series.find((s) => s.year === current.year - 1);
	const day = current.cases.length;

	const rows = series.map((s) => ({
		year: s.year,
		cases: s.cases.at(-1) ?? 0,
		casesToDate: s.cases[Math.min(day, s.cases.length) - 1] ?? 0
	}));

	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'cases',
			label: 'Vorfälle (Gesamtjahr)',
			align: 'right',
			format: (v) => formatNumber(v as number, 0)
		},
		{
			key: 'casesToDate',
			label: `Vorfälle bis Tag ${day}`,
			align: 'right',
			format: (v) => formatNumber(v as number, 0)
		}
	];

	return {
		raw: rows,
		table: { columns, rows, filename: 'falschparker-wien-jahresverlauf' },
		placeholders: {
			currentYear: current.year,
			casesToDate: formatNumber(current.cases.at(-1) ?? 0, 0),
			previousYear: previous?.year ?? null,
			previousCasesToDate: previous ? formatNumber(previous.cases[day - 1] ?? 0, 0) : null
		},
		meta: { source: 'Wiener Linien Störungsmeldungen | f59.at' }
	};
}

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	try {
		return buildChartData(buildSeries(await loadIncidents(fetchFn)));
	} catch (e) {
		console.error('tramParkingCumulative fetchChartData error:', e);
		return null;
	}
}
