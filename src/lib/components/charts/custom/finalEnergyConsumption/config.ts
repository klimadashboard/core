import type { Region } from '$lib/utils/getRegion';
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import { formatNumber, formatPercent } from '$lib/utils/formatters';
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';

export interface EnergyCategory {
	key: string;
	label: string;
	color: string;
}

export interface FinalEnergyData {
	years: number[];
	categories: EnergyCategory[];
	/** MWh per `${year}|${category}` */
	values: Map<string, number>;
	source: string;
	updateDate: string | null;
}

/** First year shown; earlier balances are not displayed. */
export const FIRST_YEAR = 2017;

/** Energy-carrier rows of the region's own balance from FIRST_YEAR on; regions without one show the empty state (no parent fallback). */
export async function fetchData(
	regionId: string | null,
	fetch: typeof globalThis.fetch
): Promise<FinalEnergyData | null> {
	if (!regionId) return null;
	const rows = (await getDirectusInstance(fetch).request(
		readItems('energy_final_consumption', {
			filter: {
				region: { _eq: regionId },
				year: { _gte: FIRST_YEAR },
				category: { dimension: { _eq: 'carrier' } }
			},
			fields: [
				'year',
				'value',
				'source',
				'update',
				'category.code',
				'category.label',
				'category.color',
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
			categories.set(c.code, { key: c.code, label: c.label, color: c.color });
		values.set(`${r.year}|${c.code}`, Number(r.value));
	}
	return {
		years: [...new Set(rows.map((r) => r.year as number))],
		categories: [...categories.values()],
		values,
		source: rows[0].source ?? '',
		updateDate:
			rows
				.map((r) => r.update)
				.filter(Boolean)
				.sort()
				.at(-1) ?? null
	};
}

export interface FinalEnergyMatrix {
	year: number;
	sectors: EnergyCategory[];
	/** MWh per `${sector}|${carrier}`; combinations absent from the balance are missing */
	values: Map<string, number>;
}

/**
 * Carrier × sector split (BISKO balance), stored as a CSV file in Directus:
 * region, year, sector, carrier, value (MWh), source, update, note — sector/carrier are
 * energy_final_consumption_category codes.
 */
const MATRIX_ASSET_URL =
	'https://base.klimadashboard.org/assets/92cbe1b0-2563-41b9-ae45-9584c0c84c2a';

/** Splits one CSV line, honouring double-quoted fields */
function splitCsvLine(line: string): string[] {
	return [...line.matchAll(/("([^"]*)"|[^,]*)(,|$)/g)]
		.slice(0, -1)
		.map((m) => (m[2] !== undefined ? m[2] : m[1]));
}

/**
 * Latest year of the region's carrier × sector split; null when the region has none.
 * Optional extra view: any load or parse failure yields null instead of failing the chart.
 */
export async function fetchMatrix(
	regionId: string | null,
	fetch: typeof globalThis.fetch
): Promise<FinalEnergyMatrix | null> {
	if (!regionId) return null;
	let res: Response;
	let sectorRows: any[];
	try {
		[res, sectorRows] = await Promise.all([
			fetch(MATRIX_ASSET_URL),
			getDirectusInstance(fetch).request(
				readItems('energy_final_consumption_category', {
					filter: { dimension: { _eq: 'sector' } },
					fields: ['code', 'label', 'color', 'sort'],
					sort: ['sort']
				})
			) as Promise<any[]>
		]);
		if (!res.ok) return null;
	} catch {
		return null;
	}

	const [header, ...lines] = (await res.text()).trim().split(/\r?\n/);
	const col = Object.fromEntries(splitCsvLine(header).map((name, i) => [name.trim(), i]));
	if (['region', 'year', 'sector', 'carrier', 'value'].some((c) => col[c] === undefined))
		return null;
	const rows = lines
		.map(splitCsvLine)
		.filter(
			(p) =>
				p[col.region] === regionId &&
				Number(p[col.year]) >= FIRST_YEAR &&
				Number.isFinite(Number(p[col.value]))
		);
	if (!rows.length) return null;

	const year = Math.max(...rows.map((p) => Number(p[col.year])));
	const values = new Map<string, number>();
	for (const p of rows.filter((p) => Number(p[col.year]) === year))
		values.set(`${p[col.sector]}|${p[col.carrier]}`, Number(p[col.value]));

	// Column order and labels from the category collection; only sectors present in the file
	const sectors = sectorRows
		.filter((s) => [...values.keys()].some((k) => k.startsWith(`${s.code}|`)))
		.map((s) => ({ key: s.code, label: s.label, color: s.color }));
	return { year, sectors, values };
}

export function valueOf(data: FinalEnergyData, year: number, key: string) {
	return data.values.get(`${year}|${key}`) ?? 0;
}

export function totalOf(data: FinalEnergyData, year: number) {
	return data.categories.reduce((sum, c) => sum + valueOf(data, year, c.key), 0);
}

/**
 * Carriers counted as fossil for the headline share. Strom and Fernwärme are left out:
 * their generation mix is not part of this balance.
 */
const FOSSIL_CARRIERS = ['erdgas', 'heizoel', 'kohle', 'treibstoff_fossil'];

export function buildChartData(data: FinalEnergyData, region: Region | null): ChartData {
	const cats = data.categories;
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
		total: totalOf(data, year)
	}));

	const first = data.years[0];
	const last = data.years.at(-1)!;
	const firstTotal = totalOf(data, first);
	const lastTotal = totalOf(data, last);
	const change = firstTotal ? (lastTotal / firstTotal - 1) * 100 : 0;
	const fossilTotal = FOSSIL_CARRIERS.reduce((sum, key) => sum + valueOf(data, last, key), 0);
	const largest = [...cats].sort(
		(a, b) => valueOf(data, last, b.key) - valueOf(data, last, a.key)
	)[0];

	return {
		raw: rows,
		table: {
			columns,
			rows,
			filename: `endenergieverbrauch-energietraeger-${region?.name ?? ''}`
		},
		placeholders: {
			regionName: region?.name ?? '',
			firstYear: first,
			lastYear: last,
			firstTotalTWh: formatNumber(firstTotal / 1e6, 1),
			lastTotalTWh: formatNumber(lastTotal / 1e6, 1),
			changePercent: `${change > 0 ? '+' : ''}${formatPercent(change, 0)}`,
			fossilShare: lastTotal ? formatPercent((fossilTotal / lastTotal) * 100, 0) : '',
			fossilTWh: formatNumber(fossilTotal / 1e6, 1),
			largestCategory: largest?.label ?? '',
			largestCategoryTWh: largest ? formatNumber(valueOf(data, last, largest.key) / 1e6, 1) : ''
		},
		meta: { source: data.source, updateDate: data.updateDate ?? undefined, region }
	};
}

export async function fetchChartData({
	fetch,
	regionId
}: ChartFetchParams): Promise<ChartData | null> {
	const data = await fetchData(regionId, fetch);
	if (!data) return null;
	const region = (await getDirectusInstance(fetch).request(
		readItem('regions', regionId!, { fields: ['id', 'name', 'layer'] })
	)) as Region;
	return buildChartData(data, region);
}
