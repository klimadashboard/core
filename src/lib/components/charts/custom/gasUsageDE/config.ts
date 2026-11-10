import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { PUBLIC_VERSION } from '$env/static/public';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

function getDayOfYear(d: Date): number {
	const start = new Date(d.getFullYear(), 0, 1);
	return Math.floor((d.getTime() - start.getTime()) / 86400000) + 1;
}

function formatDayLabel(d: Date): string {
	return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

export async function fetchChartData({ fetch: fetchFn }: ChartFetchParams): Promise<ChartData | null> {
	let rawData: any[];
	try {
		const directus = getDirectusInstance(fetchFn);
		rawData = await directus.request(
			readItems('energy', {
				filter: {
					_and: [{ region: { _eq: PUBLIC_VERSION } }, { category: { _eq: 'gas|usage' } }]
				},
				limit: -1,
				sort: ['period']
			})
		);
	} catch {
		return null;
	}

	if (!rawData?.length) return null;

	const years = Array.from(new Set(rawData.map((d) => new Date(d.period).getFullYear()))).sort() as number[];
	const lastYear = years[years.length - 1];

	const grouped: Record<number, Record<string, any>> = {};

	for (const d of rawData) {
		const date = new Date(d.period);
		const year = date.getFullYear();
		const day = getDayOfYear(date);

		if (!grouped[day]) {
			grouped[day] = { day, datum: formatDayLabel(date) };
			for (const y of years) grouped[day][String(y)] = null;
		}
		grouped[day][String(year)] = d.value;
	}

	const rows = Object.values(grouped)
		.filter((d) => years.some((y) => d[String(y)] != null))
		.sort((a, b) => a.day - b.day);

	const lastYearRows = rows.filter((d) => d[String(lastYear)] != null);
	const lastEntry = lastYearRows[lastYearRows.length - 1];

	const columns: TableColumn[] = [
		{ key: 'datum', label: 'Datum', align: 'left' },
		...years.map((y) => ({
			key: String(y),
			label: String(y),
			align: 'right' as const,
			format: (v: any) =>
				typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '–'
		}))
	];

	return {
		raw: rawData,
		table: { columns, rows, filename: 'gasverbrauch_de' },
		placeholders: {
			lastYear: String(lastYear),
			lastDate: lastEntry?.datum ?? '',
			lastValue: lastEntry
				? lastEntry[String(lastYear)].toLocaleString('de-DE', { maximumFractionDigits: 1 })
				: ''
		},
		meta: { source: 'AGSI / Directus' }
	};
}
