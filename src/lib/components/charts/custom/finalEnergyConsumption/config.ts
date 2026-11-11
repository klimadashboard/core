import type { Region } from '$lib/utils/getRegion';
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import { formatNumber, formatPercent } from '$lib/utils/formatters';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';

export type Dimension = 'sector' | 'carrier';

export interface EnergyCategory {
	key: string;
	label: string;
	color: string;
	dimension: Dimension;
}

export interface FinalEnergyData {
	years: number[];
	categories: EnergyCategory[];
	/** MWh per `${year}|${category}` */
	values: Map<string, number>;
	source: string;
	updateDate: string | null;
}

/** Rows of the region's own balance; regions without one show the empty state (no parent fallback). */
export async function fetchData(
	regionId: string | null,
	fetch: typeof globalThis.fetch
): Promise<FinalEnergyData | null> {
	if (!regionId) return null;
	const rows = (await getDirectusInstance(fetch).request(
		readItems('energy_final_consumption', {
			filter: { region: { _eq: regionId } },
			fields: [
				'year',
				'value',
				'source',
				'update',
				'category.code',
				'category.label',
				'category.color',
				'category.dimension',
				'category.sort'
			],
			sort: ['year', 'category.sort'],
			limit: -1
		})
	)) as any[];
	if (!rows.length) return null;

	const categories = new Map<string, EnergyCategory>();
	const values = new Map<string, number>();
	for (const r of rows) {
		const c = r.category;
		if (!categories.has(c.code))
			categories.set(c.code, { key: c.code, label: c.label, color: c.color, dimension: c.dimension });
		values.set(`${r.year}|${c.code}`, Number(r.value));
	}
	return {
		years: [...new Set(rows.map((r) => r.year as number))],
		categories: [...categories.values()],
		values,
		source: rows[0].source ?? '',
		updateDate: rows.map((r) => r.update).filter(Boolean).sort().at(-1) ?? null
	};
}

export function categoriesOf(data: FinalEnergyData, dimension: Dimension) {
	return data.categories.filter((c) => c.dimension === dimension);
}

export function valueOf(data: FinalEnergyData, year: number, key: string) {
	return data.values.get(`${year}|${key}`) ?? 0;
}

export function totalOf(data: FinalEnergyData, year: number, dimension: Dimension) {
	return categoriesOf(data, dimension).reduce((sum, c) => sum + valueOf(data, year, c.key), 0);
}

/** Sector view if available, else carriers. */
export function defaultDimension(data: FinalEnergyData): Dimension {
	return categoriesOf(data, 'sector').length ? 'sector' : 'carrier';
}

export function buildChartData(
	data: FinalEnergyData,
	region: Region | null,
	dimension: Dimension = defaultDimension(data)
): ChartData {
	const cats = categoriesOf(data, dimension);
	const mwh = (v: number) => formatNumber(v, 0);
	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		...[...cats, { key: 'total', label: 'Gesamt' }].map((c) => ({
			key: c.key,
			label: `${c.label} (MWh)`,
			align: 'right' as const,
			format: mwh
		}))
	];
	const rows = data.years.map((year) => ({
		year,
		...Object.fromEntries(cats.map((c) => [c.key, valueOf(data, year, c.key)])),
		total: totalOf(data, year, dimension)
	}));

	const first = data.years[0];
	const last = data.years.at(-1)!;
	const firstTotal = totalOf(data, first, dimension);
	const lastTotal = totalOf(data, last, dimension);
	const change = firstTotal ? (lastTotal / firstTotal - 1) * 100 : 0;
	const largest =[...cats].sort((a, b) => valueOf(data, last, b.key) - valueOf(data, last, a.key))[0];

	return {
		raw: rows,
		table: {
			columns,
			rows,
			filename: `endenergieverbrauch-${dimension === 'sector' ? 'sektoren' : 'energietraeger'}-${region?.name ?? ''}`
		},
		placeholders: {
			regionName: region?.name ?? '',
			firstYear: first,
			lastYear: last,
			firstTotalTWh: formatNumber(firstTotal / 1e6, 1),
			lastTotalTWh: formatNumber(lastTotal / 1e6, 1),
			changePercent: `${change > 0 ? '+' : ''}${formatPercent(change, 0)}`,
			largestCategory: largest?.label ?? '',
			largestCategoryTWh: largest ? formatNumber(valueOf(data, last, largest.key) / 1e6, 1) : ''
		},
		meta: { source: data.source, updateDate: data.updateDate ?? undefined, region }
	};
}

export async function fetchChartData({ fetch, regionId }: ChartFetchParams): Promise<ChartData | null> {
	const data = await fetchData(regionId, fetch);
	if (!data) return null;
	const region = (await getDirectusInstance(fetch).request(
		readItem('regions', regionId!, { fields: ['id', 'name', 'layer'] })
	)) as Region;
	return buildChartData(data, region);
}
