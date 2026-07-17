import type { ChartFetchParams, ChartData, TableColumn } from '$lib/components/charts/types';
import {
	fetchElectrificationDataset,
	seriesFor,
	SOURCE,
	TARGETS,
	EU_REGION_CODE,
	latestValue,
	type ElectrificationDataset
} from '$lib/utils/electrification';
import { strings, formatters, toLang } from '$lib/utils/electrification.i18n';

export function getTableColumns(lang: string = 'en'): TableColumn[] {
	const t = strings(lang);
	const f = formatters(toLang(lang));
	return [
		{ key: 'country', label: t.colCountry, align: 'left' },
		{ key: 'year', label: t.colYear, align: 'right' },
		{
			key: 'value',
			label: t.colShareTfc,
			align: 'right',
			format: (v) => (typeof v === 'number' ? f.num(v, 1) : '–')
		}
	];
}

/** Average annual pp change over the last ~10 years of available history. */
function recentAnnualPace(hist: [number, number][], latestYear: number): number {
	if (hist.length < 2) return 0;
	const targetPastYear = latestYear - 10;
	let past = hist[0];
	for (const p of hist) {
		if (p[0] <= targetPastYear) past = p;
	}
	const [pastYear, pastVal] = past;
	const [curYear, curVal] = hist[hist.length - 1];
	if (curYear === pastYear) return 0;
	return (curVal - pastVal) / (curYear - pastYear);
}

export function computeHeadline(
	dataset: ElectrificationDataset,
	selectedIds: string[],
	lang: string = 'en'
): string {
	const t = strings(lang);
	const f = formatters(toLang(lang));
	const y30 = TARGETS[0].year;
	const y40 = TARGETS[TARGETS.length - 1].year;
	const t2030 = TARGETS[0].value;
	const t2040 = TARGETS[TARGETS.length - 1].value;

	const paths = selectedIds
		.map((id) => {
			const region = dataset.regions.find((r) => r.id === id);
			const current = latestValue(dataset, id, 'total_economy');
			return region && current != null ? { name: region.name, current } : null;
		})
		.filter((p): p is { name: string; current: number } => p != null);

	if (!paths.length) return t.hlCpFallback;

	if (paths.length > 1) {
		const sorted = [...paths].sort((a, b) => b.current - a.current);
		const leader = sorted[0];
		const laggard = sorted[sorted.length - 1];
		if (leader.name === laggard.name) return t.hlCpMultiSame(y40);
		return t.hlCpMulti(leader.name, f.pct(leader.current, 1), laggard.name, f.pct(laggard.current, 1));
	}

	const { name, current } = paths[0];
	if (current >= t2040) return t.hlCpSurpassed(name, y40);

	const hist = seriesFor(dataset, selectedIds[0], 'total_economy');
	const pace = recentAnnualPace(hist, dataset.latestYear);
	const yearsTo2040 = y40 - dataset.latestYear;
	const neededPace = yearsTo2040 > 0 ? (t2040 - current) / yearsTo2040 : Infinity;
	const onTrack = pace >= neededPace;
	const met2030 = current >= t2030;

	if (met2030 && onTrack) return t.hlCpMetOnTrack(name, y30, y40);
	if (met2030 && !onTrack) return t.hlCpMetOffTrack(name, y30, y40);
	if (onTrack) return t.hlCpOnTrack(name, y30, y40);
	return t.hlCpOffTrack(name, y30, y40);
}

export function buildChartData(
	dataset: ElectrificationDataset,
	selectedIds: string[] = [],
	lang: string = 'en'
): ChartData {
	const eu = dataset.regions.find((r) => r.code === EU_REGION_CODE);
	const euLatest = eu ? latestValue(dataset, eu.id, 'total_economy') : null;
	const f = formatters(toLang(lang));

	const rows = dataset.points
		.filter((p) => p.category === 'total_economy')
		.map((p) => {
			const region = dataset.regions.find((r) => r.id === p.regionId);
			return { country: region?.name ?? p.regionId, year: p.year, value: p.value };
		})
		.sort((a, b) => a.country.localeCompare(b.country) || a.year - b.year);

	return {
		raw: rows,
		table: {
			columns: getTableColumns(lang),
			rows,
			filename: 'electrification-country-paths'
		},
		placeholders: {
			euLatest: euLatest != null ? f.num(euLatest, 1) : '–',
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
