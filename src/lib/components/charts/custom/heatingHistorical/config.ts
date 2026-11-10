import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

const SOURCE = 'mikrozensus-statistik-austria';

const CATEGORIES = [
	{ key: 'gas', dbCategory: 'gas' },
	{ key: 'oil', dbCategory: 'heating oil' },
	{ key: 'coal', dbCategory: 'coal' },
	{ key: 'wood', dbCategory: 'wood, wood pellets' },
	{ key: 'electric', dbCategory: 'electricity (without heat pump)' },
	{ key: 'heatPump', dbCategory: 'solar/geothermal energy, heat pumps' },
	{ key: 'remote', dbCategory: 'district heating (various energy sources)' }
];

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	const directus = getDirectusInstance(fetchFn);

	// Look up AT country region UUID
	const atRegions = (await directus.request(
		readItems('regions', {
			filter: { code: { _eq: 'at' }, country: { _eq: 'AT' } },
			fields: ['id'],
			limit: 1
		})
	)) as Array<{ id: string }>;
	const atId = atRegions[0]?.id;
	if (!atId) return null;

	// Fetch all absolute Austrian timeline data
	const rows = (await directus.request(
		readItems('energy_heating_systems', {
			filter: {
				source: { _eq: SOURCE },
				region: { _eq: atId },
				unit: { _eq: 'absolute' },
				category: { _neq: 'total' }
			},
			sort: ['period'],
			limit: -1
		})
	)) as Array<{ category: string; value: number; period: string }>;

	if (!rows.length) return null;

	// Group by year
	const byYear = new Map<number, Map<string, number>>();
	for (const row of rows) {
		const year = new Date(row.period).getFullYear();
		if (!byYear.has(year)) byYear.set(year, new Map());
		byYear.get(year)!.set(row.category, row.value);
	}

	const years = [...byYear.keys()].sort((a, b) => a - b);
	const latestYear = years[years.length - 1];

	// Build table rows
	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		...CATEGORIES.map((c) => ({
			key: c.key,
			label: c.key.charAt(0).toUpperCase() + c.key.slice(1),
			align: 'right' as const,
			format: (v: any) => (typeof v === 'number' ? v.toLocaleString('de-AT') : '–')
		}))
	];

	const tableRows = years.map((year) => {
		const yearData = byYear.get(year)!;
		const row: Record<string, any> = { year };
		for (const c of CATEGORIES) {
			row[c.key] = yearData.get(c.dbCategory) ?? null;
		}
		return row;
	});

	// Get latest year values for placeholders
	const latestData = byYear.get(latestYear);
	const gasValue = latestData?.get('gas') ?? 0;
	const oilValue = latestData?.get('heating oil') ?? 0;
	const heatPumpValue = latestData?.get('solar/geothermal energy, heat pumps') ?? 0;

	return {
		raw: tableRows,
		table: { columns, rows: tableRows, filename: 'heizungen_historisch' },
		placeholders: {
			dataYear: String(latestYear),
			gasTotal: gasValue.toLocaleString('de-AT'),
			oilTotal: oilValue.toLocaleString('de-AT'),
			heatPumpTotal: heatPumpValue.toLocaleString('de-AT')
		},
		meta: {
			updateDate: undefined,
			source: 'Statistik Austria, Mikrozensus Energieeinsatz der Haushalte'
		}
	};
}
