import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SOURCE = 'mikrozensus-statistik-austria';

const FUEL_CONFIG: Record<string, { category: string; targetYear: number }> = {
	gas: { category: 'gas', targetYear: 2040 },
	oil: { category: 'heating oil', targetYear: 2035 }
};

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
				unit: { _eq: 'absolute' }
			},
			sort: ['period'],
			limit: -1
		})
	)) as Array<{ category: string; value: number; period: string }>;

	if (!rows.length) return null;

	// Extract year from period (stored as "YYYY-12-31")
	const withYear = rows.map((r) => ({
		...r,
		year: new Date(r.period).getFullYear()
	}));

	const latestYear = Math.max(...withYear.map((d) => d.year));

	// Compute daily phaseout rates for both fuel types
	const results: Record<string, { daily: number; total: number; targetYear: number }> = {};
	for (const [fuel, cfg] of Object.entries(FUEL_CONFIG)) {
		const entry = withYear.find((d) => d.year === latestYear && d.category === cfg.category);
		const total = entry?.value ?? 0;
		const startDate = new Date(latestYear, 11, 31);
		const endDate = new Date(cfg.targetYear, 0, 1);
		const diffDays = Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / ONE_DAY_MS));
		results[fuel] = {
			daily: diffDays > 0 ? total / diffDays : 0,
			total,
			targetYear: cfg.targetYear
		};
	}

	// Build table: gas + oil totals per year
	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		{
			key: 'gas',
			label: 'Gas',
			align: 'right',
			format: (v: any) => (typeof v === 'number' ? v.toLocaleString('de-AT') : '–')
		},
		{
			key: 'oil',
			label: 'Öl',
			align: 'right',
			format: (v: any) => (typeof v === 'number' ? v.toLocaleString('de-AT') : '–')
		}
	];

	const years = [...new Set(withYear.map((d) => d.year))].sort((a, b) => a - b);
	const tableRows = years.map((year) => ({
		year,
		gas: withYear.find((d) => d.year === year && d.category === 'gas')?.value ?? null,
		oil: withYear.find((d) => d.year === year && d.category === 'heating oil')?.value ?? null
	}));

	return {
		raw: Object.entries(results).map(([fuel, data]) => ({
			fuel,
			daily: Math.round(data.daily),
			total: data.total,
			targetYear: data.targetYear
		})),
		table: { columns, rows: tableRows, filename: 'heizungen_ausstieg' },
		placeholders: {
			gasDaily: Math.round(results.gas?.daily ?? 0).toString(),
			oilDaily: Math.round(results.oil?.daily ?? 0).toString(),
			gasTotal: (results.gas?.total ?? 0).toLocaleString('de-AT'),
			oilTotal: (results.oil?.total ?? 0).toLocaleString('de-AT'),
			gasTargetYear: String(results.gas?.targetYear ?? 2040),
			oilTargetYear: String(results.oil?.targetYear ?? 2035),
			dataYear: String(latestYear)
		},
		meta: {
			updateDate: undefined,
			source: 'Statistik Austria, Mikrozensus Energieeinsatz der Haushalte'
		}
	};
}
