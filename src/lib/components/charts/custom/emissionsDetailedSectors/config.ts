import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { PUBLIC_VERSION } from '$env/static/public';
import mappingAt from './mapping.at.json';
import mappingDe from './mapping.de.json';
const mapping = PUBLIC_VERSION === 'de' ? mappingDe : mappingAt;

const FLU_GASES = ['HFC', 'PFC', 'SF6', 'NF3'];
const ALL_GASES = ['THG', 'CO2', 'CH4', 'N2O', ...FLU_GASES];
const ALL_CODES = mapping.sectors.flatMap((s) => s.subsectors.map((sub) => sub.code));

export async function loadDataset(fetchFn?: typeof globalThis.fetch) {
	const directus = getDirectusInstance(fetchFn);

	const rows = (await directus.request(
		readItems('emissions_data', {
			filter: {
				_and: [
					{ country: { _eq: PUBLIC_VERSION.toUpperCase() } },
					{ category: { _in: ALL_CODES } },
					{ gas: { _in: ALL_GASES } }
				]
			},
			fields: ['category', 'year', 'value', 'value_weighted', 'gas'],
			sort: ['year'],
			limit: -1
		})
	)) as Array<{ category: string; year: number; value: number; value_weighted?: number; gas: string }>;

	if (!rows.length) return null;

	const rowMap = new Map<string, number>();
	const rowMapWeighted = new Map<string, number>();
	for (const row of rows) {
		const key = `${row.category}|${row.year}|${row.gas}`;
		rowMap.set(key, row.value);
		if (row.value_weighted != null) rowMapWeighted.set(key, row.value_weighted);
	}

	const dbYears = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
	const maxYear = dbYears[dbYears.length - 1];
	const years = Array.from({ length: maxYear - 1990 + 1 }, (_, i) => 1990 + i);

	const toMt = (tons: number) => tons / 1_000_000;

	function getVal(code: string, year: number, gasKey: string): number {
		if (gasKey === 'FLU') {
			return FLU_GASES.reduce((sum, g) => {
				const key = `${code}|${year}|${g}`;
				return sum + (rowMapWeighted.get(key) ?? rowMap.get(key) ?? 0);
			}, 0);
		}
		const key = `${code}|${year}|${gasKey}`;
		return rowMapWeighted.get(key) ?? rowMap.get(key) ?? 0;
	}

	function buildGasDataset(gasKey: string) {
		return mapping.sectors.map((sector) => {
			const subsectors = sector.subsectors.map((sub) => ({
				code: sub.code,
				key: sector.key,
				label: sub.label,
				absolute: years.map((year) => toMt(getVal(sub.code, year, gasKey)))
			}));
			return {
				key: sector.key,
				label: sector.label,
				ksgSector: sector.label,
				absolute: years.map((_, yi) => subsectors.reduce((sum, sub) => sum + sub.absolute[yi], 0)),
				sectors: subsectors
			};
		});
	}

	return {
		THG: buildGasDataset('THG'),
		CO2: buildGasDataset('CO2'),
		CH4: buildGasDataset('CH4'),
		N2O: buildGasDataset('N2O'),
		FLU: buildGasDataset('FLU')
	};
}

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	const data = await loadDataset(fetchFn);
	if (!data) return null;

	const thgSectors = data.THG.filter((s) => s.key !== 'memo');
	const yearCount = thgSectors[0]?.absolute.length ?? 0;
	if (!yearCount) return null;

	const years = Array.from({ length: yearCount }, (_, i) => 1990 + i);
	const maxYear = years[years.length - 1];

	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		...thgSectors.map((s) => ({
			key: s.key,
			label: s.label,
			align: 'right' as const,
			format: (v: any) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
					: '–'
		})),
		{
			key: 'total',
			label: 'Gesamt',
			align: 'right' as const,
			format: (v: any) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
					: '–'
		}
	];

	const tableRows = years.map((year, yi) => {
		const row: Record<string, any> = { year };
		let total = 0;
		for (const s of thgSectors) {
			const val = s.absolute[yi];
			row[s.key] = val;
			total += val;
		}
		row.total = total > 0 ? total : null;
		return row;
	});

	const totalEmissions = tableRows[tableRows.length - 1]?.total ?? 0;

	return {
		raw: tableRows,
		hasData: true,
		table: { columns, rows: tableRows, filename: 'emissionen_sektoren_detail' },
		placeholders: {
			latestYear: String(maxYear),
			totalEmissions: totalEmissions.toLocaleString('de-DE', {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1
			})
		},
		meta: { source: 'Umweltbundesamt' }
	};
}
