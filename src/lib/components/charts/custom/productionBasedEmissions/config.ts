import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';

const SOURCES = ['BLI 2025 (1990-2023)', 'OLI 2025 (1990-2024)', 'Abschätzung UBA'];

export const SECTORS = [
	{ key: 'Energie', label: 'Energie', color: '#BD3737' },
	{ key: 'Industrie', label: 'Industrie', color: '#373949' },
	{ key: 'Gebäude', label: 'Gebäude', color: '#4880A8' },
	{ key: 'Verkehr', label: 'Verkehr', color: '#F5AF4A' },
	{ key: 'Landwirtschaft', label: 'Landwirtschaft', color: '#65987D' },
	{ key: 'Müll', label: 'Abfallwirtschaft', color: '#B7693D' },
	{ key: 'F-Gase', label: 'Fluorierte Gase', color: '#7CAFBA' }
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
						source: { _in: SOURCES }
					}
				]
			},
			sort: ['year', 'region.name'],
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

	// Flatten and normalize
	const rows = data.map((row) => ({
		value: row.value,
		year: row.year,
		region_id: row.region?.id,
		region: row.region?.name,
		sector: row.category?.label,
		unit: row.gas?.unit,
		classification: row.type,
		source: row.source,
		isEstimate: row.source === 'Abschätzung UBA'
	}));

	// Filter to Gesamt classification for table
	const gesamtRows = rows.filter(
		(d) => d.classification == null || d.classification === 'Gesamt'
	);

	// Find available sectors and latest year
	const availableSectors = [...new Set(gesamtRows.map((d) => d.sector))];
	const years = [...new Set(gesamtRows.map((d) => d.year))].sort((a, b) => a - b);
	const latestYear = years[years.length - 1];
	const regions = [...new Set(gesamtRows.map((d) => d.region))].sort();

	// Build table: latest year, all regions × sectors
	const columns: TableColumn[] = [
		{ key: 'region', label: 'Region', align: 'left' },
		{ key: 'year', label: 'Jahr', align: 'left' },
		...SECTORS.filter((s) => availableSectors.includes(s.key)).map((s) => ({
			key: s.key,
			label: s.label,
			align: 'right' as const,
			format: (v: any) => (typeof v === 'number' ? Math.round(v).toLocaleString('de-AT') : '–')
		})),
		{
			key: 'total',
			label: 'Gesamt',
			align: 'right' as const,
			format: (v: any) => (typeof v === 'number' ? Math.round(v).toLocaleString('de-AT') : '–')
		}
	];

	const tableRows = regions.flatMap((region) => {
		const regionLatest = gesamtRows.filter(
			(d) => d.region === region && d.year === latestYear
		);
		const row: Record<string, any> = { region, year: latestYear };
		let total = 0;
		for (const s of SECTORS) {
			const val = regionLatest.find((d) => d.sector === s.key)?.value ?? null;
			row[s.key] = val;
			if (val != null) total += val;
		}
		row.total = total > 0 ? total : null;
		return [row];
	});

	// Compute placeholders for first region
	const defaultRegion = regions[regions.length - 1] ?? '';
	const defaultLatest = gesamtRows.filter(
		(d) => d.region === defaultRegion && d.year === latestYear
	);
	const defaultFirst = gesamtRows.filter(
		(d) => d.region === defaultRegion && d.year === years[0]
	);
	const latestTotal = defaultLatest.reduce((sum, d) => sum + (d.value ?? 0), 0);
	const firstTotal = defaultFirst.reduce((sum, d) => sum + (d.value ?? 0), 0);

	const fmt = (v: number) =>
		(v / 1_000_000).toLocaleString('de-DE', {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1
		});

	return {
		raw: data,
		table: { columns, rows: tableRows, filename: 'emissionen_nach_sektoren' },
		placeholders: {
			dataYear: String(latestYear),
			firstYear: String(years[0]),
			regionCount: String(regions.length),
			defaultRegion,
			lastYearTotal: fmt(latestTotal),
			firstYearTotal: fmt(firstTotal)
		},
		meta: {
			source: 'Bundesländer Inventur, Umweltbundesamt'
		}
	};
}
