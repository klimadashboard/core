import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';

const SOURCE = 'BLI 2025 (1990-2023)';

const SECTORS = [
	{ key: 'Energie', label: 'Energie' },
	{ key: 'Industrie', label: 'Industrie' },
	{ key: 'Verkehr', label: 'Verkehr' },
	{ key: 'Gebäude', label: 'Gebäude' },
	{ key: 'Landwirtschaft', label: 'Landwirtschaft' },
	{ key: 'Müll', label: 'Abfallwirtschaft' },
	{ key: 'F-Gase', label: 'Fluorierte Gase' }
];

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	const directus = getDirectusInstance(fetchFn);
	const country = PUBLIC_VERSION.toUpperCase();

	const data = (await directus.request(
		readItems('emissions_data', {
			filter: {
				_and: [
					{
						country: { _eq: country },
						source: { _eq: SOURCE },
						type: { _eq: 'Gesamt' }
					}
				]
			},
			sort: ['year', 'category.label'],
			fields: [
				'category.label',
				'gas.name',
				'gas.unit',
				'id',
				'region.id',
				'region.name',
				'source',
				'type',
				'value',
				'year'
			],
			limit: -1
		})
	)) as any[];

	if (!data.length) return null;

	// Flatten
	const rows = data.map((row) => ({
		value: row.value,
		year: row.year,
		region_id: row.region?.id,
		region: row.region?.name,
		sector: row.category?.label,
		unit: row.gas?.unit
	}));

	// Get unique regions, years, and available sectors
	const regions = [...new Set(rows.map((d) => d.region))].sort();
	const years = [...new Set(rows.map((d) => d.year))].sort((a, b) => a - b);
	const availableSectors = [...new Set(rows.map((d) => d.sector))];
	const latestYear = years[years.length - 1];

	// Also fetch population data for per-capita context
	const regionIds = [...new Set(rows.map((d) => d.region_id))];
	let populationByRegion: Record<string, number> = {};

	try {
		const popData = (await directus.request(
			readItems('population', {
				filter: { region: { _in: regionIds } },
				sort: ['-period'],
				limit: -1
			})
		)) as any[];

		// Get latest population per region
		for (const pop of popData) {
			if (!populationByRegion[pop.region]) {
				populationByRegion[pop.region] = pop.value;
			}
		}
	} catch {
		// Population data is optional
	}

	// Build table: latest year, regions × sector totals + per-capita total
	const activeSectors = SECTORS.filter((s) => availableSectors.includes(s.key));

	const columns: TableColumn[] = [
		{ key: 'region', label: 'Region', align: 'left' },
		...activeSectors.map((s) => ({
			key: s.key,
			label: `${s.label} (t)`,
			align: 'right' as const,
			format: (v: any) => (typeof v === 'number' ? Math.round(v).toLocaleString('de-AT') : '–')
		})),
		{
			key: 'total',
			label: 'Gesamt (t)',
			align: 'right' as const,
			format: (v: any) => (typeof v === 'number' ? Math.round(v).toLocaleString('de-AT') : '–')
		},
		{
			key: 'perCapita',
			label: 'Pro Kopf (t)',
			align: 'right' as const,
			format: (v: any) =>
				typeof v === 'number'
					? v.toLocaleString('de-AT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
					: '–'
		}
	];

	const tableRows = regions.map((region) => {
		const regionRows = rows.filter((d) => d.region === region && d.year === latestYear);
		const row: Record<string, any> = { region };
		let total = 0;
		for (const s of activeSectors) {
			const val = regionRows.find((d) => d.sector === s.key)?.value ?? null;
			row[s.key] = val;
			if (val != null) total += val;
		}
		row.total = total > 0 ? total : null;

		// Per-capita
		const regionId = regionRows[0]?.region_id;
		const pop = regionId ? populationByRegion[regionId] : null;
		row.perCapita = pop && total > 0 ? total / pop : null;

		return row;
	});

	// Compute overall total for placeholders
	const totalLatestYear = tableRows.reduce((sum, r) => sum + (r.total ?? 0), 0);

	const fmt = (v: number) =>
		(v / 1_000_000).toLocaleString('de-DE', {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1
		});

	return {
		raw: data,
		table: { columns, rows: tableRows, filename: 'emissionen_bundeslaender' },
		placeholders: {
			dataYear: String(latestYear),
			firstYear: String(years[0]),
			regionCount: String(regions.length),
			totalEmissions: fmt(totalLatestYear)
		},
		meta: {
			source: 'Bundesländer Inventur, Umweltbundesamt'
		}
	};
}
