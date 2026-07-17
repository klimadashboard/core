import type { ChartFetchParams, ChartData, TableColumn } from '$lib/components/charts/types';
import {
	fetchElectrificationDataset,
	latestValue,
	SOURCE,
	SECTORS,
	EU_REGION_CODE,
	type ElectrificationDataset
} from '$lib/utils/electrification';
import {
	strings,
	formatters,
	sectorLabel,
	sectorShort,
	toLang
} from '$lib/utils/electrification.i18n';

export function getTableColumns(lang: string = 'en'): TableColumn[] {
	const t = strings(lang);
	const f = formatters(toLang(lang));
	return [
		{ key: 'country', label: t.colCountry, align: 'left' },
		{ key: 'sector', label: t.colSector, align: 'left' },
		{ key: 'year', label: t.colYear, align: 'right' },
		{
			key: 'value',
			label: t.colShare,
			align: 'right',
			format: (v) => (typeof v === 'number' ? f.num(v, 1) : '–')
		}
	];
}

export function computeHeadline(
	dataset: ElectrificationDataset,
	selectedIds: string[],
	lang: string = 'en'
): string {
	const t = strings(lang);
	const f = formatters(toLang(lang));
	const l = toLang(lang);

	if (selectedIds.length === 1) {
		const id = selectedIds[0];
		const region = dataset.regions.find((r) => r.id === id);
		const sectorVals = SECTORS.map((s) => ({
			short: sectorShort(s.key, l),
			value: latestValue(dataset, id, s.key)
		})).filter((s): s is { short: string; value: number } => s.value != null);

		if (!region || !sectorVals.length) return t.hlSvFallback;

		const sorted = [...sectorVals].sort((a, b) => b.value - a.value);
		const max = sorted[0];
		const min = sorted[sorted.length - 1];
		if (max.short === min.short) return t.hlSvEven(region.name);
		return t.hlSvSingle(region.name, max.short, f.pct(max.value), min.short, f.pct(min.value));
	}

	const compareIds = selectedIds.length ? selectedIds : dataset.regions.map((r) => r.id);
	const sectorAverages = SECTORS.map((s) => {
		const vals = compareIds
			.map((id) => latestValue(dataset, id, s.key))
			.filter((v): v is number => v != null);
		const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
		return { short: sectorShort(s.key, l), avg };
	}).filter((s): s is { short: string; avg: number } => s.avg != null);

	if (!sectorAverages.length) return t.hlSvFallback;

	const sorted = [...sectorAverages].sort((a, b) => b.avg - a.avg);
	const max = sorted[0];
	const min = sorted[sorted.length - 1];
	const scope = selectedIds.length ? t.hlSvScopeSelected : t.hlSvScopeEu;
	return t.hlSvMulti(scope, max.short, min.short);
}

export function buildChartData(
	dataset: ElectrificationDataset,
	selectedIds: string[] = [],
	lang: string = 'en'
): ChartData {
	const l = toLang(lang);
	const sectorKeys = new Set(SECTORS.map((s) => s.key));
	const rows = dataset.points
		.filter((p) => sectorKeys.has(p.category))
		.map((p) => {
			const region = dataset.regions.find((r) => r.id === p.regionId);
			return {
				country: region?.name ?? p.regionId,
				sector: sectorLabel(p.category, l),
				year: p.year,
				value: p.value
			};
		});

	return {
		raw: rows,
		table: { columns: getTableColumns(lang), rows, filename: 'electrification-by-sector' },
		placeholders: {
			latestYear: dataset.latestYear,
			headline: computeHeadline(dataset, selectedIds, lang)
		},
		meta: { source: SOURCE, updateDate: dataset.updateDate }
	};
}

export async function fetchChartData({ fetch, lang }: ChartFetchParams): Promise<ChartData | null> {
	const dataset = await fetchElectrificationDataset(fetch, lang);
	if (!dataset.points.length) return null;
	const euId = dataset.regions.find((r) => r.code === EU_REGION_CODE)?.id;
	return buildChartData(dataset, euId ? [euId] : [], lang);
}
