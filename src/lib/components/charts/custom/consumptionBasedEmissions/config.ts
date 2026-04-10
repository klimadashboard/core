import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';

const SOURCES = ['OLI 2025 (1990-2024)', 'manual_consumption'];

interface EmissionRow {
	category: string;
	gas: { name: string; unit: string } | null;
	id: string;
	source: string;
	type: string | null;
	value: number;
	year: number;
}

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	const directus = getDirectusInstance(fetchFn);

	const rows = (await directus.request(
		readItems('emissions_data', {
			filter: {
				_and: [
					{
						country: { _eq: PUBLIC_VERSION.toUpperCase() },
						source: { _in: SOURCES },
						gas: { _eq: 'THG' }
					}
				]
			},
			sort: ['year'],
			fields: ['category', 'gas.name', 'gas.unit', 'id', 'source', 'type', 'value', 'year'],
			limit: -1
		})
	)) as EmissionRow[];

	if (!rows.length) return null;

	// Filter to Gesamt type (same logic as existing component)
	const filtered = rows.filter((d) => d.type == null || d.type === 'Gesamt');

	// Group by year and pivot categories into columns
	const byYear = new Map<number, { consumption_based: number; production_based: number }>();
	for (const row of filtered) {
		const category = row.category === 'ksg' ? 'production_based' : row.category;
		if (!byYear.has(row.year)) {
			byYear.set(row.year, { consumption_based: 0, production_based: 0 });
		}
		const entry = byYear.get(row.year)!;
		if (category === 'consumption_based') entry.consumption_based = row.value;
		if (category === 'production_based') entry.production_based = row.value;
	}

	const unit = filtered[0]?.gas?.name ?? 'THG';
	const years = [...byYear.keys()].sort((a, b) => a - b);
	const lastYear = years[years.length - 1];
	const lastEntry = byYear.get(lastYear);

	// Build table
	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'consumption_based',
			label: `Konsumbasiert (t ${unit})`,
			align: 'right',
			format: (v: any) => (typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '–')
		},
		{
			key: 'production_based',
			label: `Produktionsbasiert (t ${unit})`,
			align: 'right',
			format: (v: any) => (typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : '–')
		}
	];

	const tableRows = years.map((year) => {
		const entry = byYear.get(year)!;
		return {
			year,
			consumption_based: entry.consumption_based || null,
			production_based: entry.production_based || null
		};
	});

	// Format large numbers for placeholders
	const fmt = (v: number) =>
		(v / 1_000_000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

	return {
		raw: rows,
		table: { columns, rows: tableRows, filename: 'emissionen_konsum_produktion' },
		placeholders: {
			lastYear: String(lastYear),
			lastConsumption: lastEntry?.consumption_based ? fmt(lastEntry.consumption_based) : '',
			lastProduction: lastEntry?.production_based ? fmt(lastEntry.production_based) : '',
			unit: `t ${unit}`
		},
		meta: {
			source: 'UBA, Global Carbon Project'
		}
	};
}
