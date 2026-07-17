import type { ChartFetchParams, ChartData, TableColumn } from '$lib/components/charts/types';
import {
	fetchElectrificationDataset,
	SOURCE,
	TARGETS,
	latestValue,
	type ElectrificationDataset
} from '$lib/utils/electrification';
import { strings, formatters, toLang } from '$lib/utils/electrification.i18n';

export function getTableColumns(lang: string = 'en'): TableColumn[] {
	const t = strings(lang);
	const f = formatters(toLang(lang));
	const num = (v: unknown) => (typeof v === 'number' ? f.num(v, 1) : '–');
	return [
		{ key: 'country', label: t.colCountry, align: 'left' },
		{ key: 'value', label: t.colShareTfcLatest, align: 'right', format: num },
		{ key: 'gap2030', label: t.colGapTo(TARGETS[0].year), align: 'right', format: num },
		{
			key: 'gap2040',
			label: t.colGapTo(TARGETS[TARGETS.length - 1].year),
			align: 'right',
			format: num
		}
	];
}

export function computeHeadline(dataset: ElectrificationDataset, lang: string = 'en'): string {
	const t = strings(lang);
	const f = formatters(toLang(lang));

	const countries = dataset.regions
		.filter((r) => r.layer === 'country')
		.map((r) => ({ name: r.name, value: latestValue(dataset, r.id, 'total_economy') }))
		.filter((r): r is { name: string; value: number } => r.value != null);

	if (!countries.length) return t.hlDtFallback;

	const sorted = [...countries].sort((a, b) => b.value - a.value);
	const max = sorted[0];
	const min = sorted[sorted.length - 1];

	return t.hlDtRange(f.pct(min.value, 1), min.name, f.pct(max.value, 1), max.name);
}

export function buildChartData(dataset: ElectrificationDataset, lang: string = 'en'): ChartData {
	const rows = dataset.regions
		.map((r) => {
			const value = latestValue(dataset, r.id, 'total_economy') ?? 0;
			return {
				country: r.name,
				value,
				gap2030: TARGETS[0].value - value,
				gap2040: TARGETS[TARGETS.length - 1].value - value
			};
		})
		.sort((a, b) => b.value - a.value);

	return {
		raw: rows,
		table: {
			columns: getTableColumns(lang),
			rows,
			filename: 'electrification-distance-to-target'
		},
		placeholders: { latestYear: dataset.latestYear, headline: computeHeadline(dataset, lang) },
		meta: { source: SOURCE, updateDate: dataset.updateDate }
	};
}

export async function fetchChartData({ fetch, lang }: ChartFetchParams): Promise<ChartData | null> {
	const dataset = await fetchElectrificationDataset(fetch, lang);
	if (!dataset.points.length) return null;
	return buildChartData(dataset, lang);
}
