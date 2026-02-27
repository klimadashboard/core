import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

const SOURCE = 'mikrozensus-statistik-austria';

const CATEGORIES = [
	{ key: 'gas', dbCategory: 'gas', label: 'Gas' },
	{ key: 'oil', dbCategory: 'heating oil', label: 'Öl' },
	{ key: 'coal', dbCategory: 'coal', label: 'Kohle' },
	{ key: 'wood', dbCategory: 'wood, wood pellets', label: 'Holz' },
	{ key: 'electric', dbCategory: 'electricity (without heat pump)', label: 'Strom' },
	{ key: 'heatPump', dbCategory: 'solar/geothermal energy, heat pumps', label: 'Wärmepumpe' },
	{ key: 'remote', dbCategory: 'district heating (various energy sources)', label: 'Fernwärme' }
];

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	const directus = getDirectusInstance(fetchFn);

	// Look up AT state region IDs (exclude country-level)
	const stateRegions = (await directus.request(
		readItems('regions', {
			filter: { country: { _eq: 'AT' }, layer: { _eq: 'state' } },
			fields: ['id', 'name'],
			limit: -1
		})
	)) as Array<{ id: string; name: string }>;

	const stateIds = stateRegions.map((r) => r.id);
	const stateIdToName = new Map(stateRegions.map((r) => [r.id, r.name]));

	// Fetch all absolute state-level timeline data
	const rows = (await directus.request(
		readItems('energy_heating_systems', {
			filter: {
				source: { _eq: SOURCE },
				region: { _in: stateIds },
				unit: { _eq: 'absolute' }
			},
			sort: ['period'],
			limit: -1
		})
	)) as Array<{ region: string; category: string; value: number; period: string }>;

	if (!rows.length) return null;

	// Find latest year
	const years = [...new Set(rows.map((r) => new Date(r.period).getFullYear()))].sort(
		(a, b) => a - b
	);
	const latestYear = years[years.length - 1];

	// Build table: latest year, one row per state, columns for each category
	const columns: TableColumn[] = [
		{ key: 'region', label: 'Bundesland', align: 'left' },
		...CATEGORIES.map((c) => ({
			key: c.key,
			label: c.label,
			align: 'right' as const,
			format: (v: any) => (typeof v === 'number' ? v.toLocaleString('de-AT') : '–')
		}))
	];

	const latestRows = rows.filter((r) => new Date(r.period).getFullYear() === latestYear);
	const tableRows = stateRegions
		.sort((a, b) => a.name.localeCompare(b.name, 'de'))
		.map((state) => {
			const stateRows = latestRows.filter((r) => r.region === state.id);
			const row: Record<string, any> = { region: state.name };
			for (const c of CATEGORIES) {
				row[c.key] = stateRows.find((r) => r.category === c.dbCategory)?.value ?? null;
			}
			return row;
		});

	return {
		raw: rows,
		table: { columns, rows: tableRows, filename: 'heizungen_bundeslaender' },
		placeholders: {
			dataYear: String(latestYear),
			firstYear: String(years[0])
		},
		meta: {
			updateDate: undefined,
			source: 'Statistik Austria, Mikrozensus Energieeinsatz der Haushalte'
		}
	};
}
