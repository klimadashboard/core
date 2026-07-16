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

export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'country', label: 'Country', align: 'left' },
		{ key: 'year', label: 'Year', align: 'right' },
		{
			key: 'value',
			label: 'Electricity share of TFC (%)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? v.toFixed(1) : '–')
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

export function computeHeadline(dataset: ElectrificationDataset, selectedIds: string[]): string {
	const t2030 = TARGETS[0].value;
	const t2040 = TARGETS[TARGETS.length - 1].value;

	const paths = selectedIds
		.map((id) => {
			const region = dataset.regions.find((r) => r.id === id);
			const current = latestValue(dataset, id, 'total_economy');
			return region && current != null ? { name: region.name, current } : null;
		})
		.filter((p): p is { name: string; current: number } => p != null);

	if (!paths.length) {
		return 'Track country progress toward the EU electrification targets';
	}

	if (paths.length > 1) {
		const sorted = [...paths].sort((a, b) => b.current - a.current);
		const leader = sorted[0];
		const laggard = sorted[sorted.length - 1];
		if (leader.name === laggard.name) {
			return `The selected regions are progressing toward the 2030 and 2040 electrification goals`;
		}
		return `${leader.name} leads the selected regions at ${leader.current.toFixed(1)}%, while ${laggard.name} trails at ${laggard.current.toFixed(1)}%`;
	}

	const { name, current } = paths[0];
	if (current >= t2040) {
		return `${name} has already surpassed the 2040 electrification target`;
	}

	const hist = seriesFor(dataset, selectedIds[0], 'total_economy');
	const pace = recentAnnualPace(hist, dataset.latestYear);
	const yearsTo2040 = TARGETS[TARGETS.length - 1].year - dataset.latestYear;
	const neededPace = yearsTo2040 > 0 ? (t2040 - current) / yearsTo2040 : Infinity;
	const onTrack = pace >= neededPace;
	const met2030 = current >= t2030;

	if (met2030 && onTrack) {
		return `${name} has already reached its 2030 target and is on track for 2040`;
	}
	if (met2030 && !onTrack) {
		return `${name} has reached its 2030 target, but isn't on track for 2040 yet`;
	}
	if (onTrack) {
		return `${name} is on track to reach the 2030 and 2040 electrification goals`;
	}
	return `${name} is not yet on track to reach the 2030 and 2040 electrification goals`;
}

export function buildChartData(
	dataset: ElectrificationDataset,
	selectedIds: string[] = []
): ChartData {
	const eu = dataset.regions.find((r) => r.code === EU_REGION_CODE);
	const euLatest = eu ? latestValue(dataset, eu.id, 'total_economy') : null;

	const rows = dataset.points
		.filter((p) => p.category === 'total_economy')
		.map((p) => {
			const region = dataset.regions.find((r) => r.id === p.regionId);
			return { country: region?.name ?? p.regionId, year: p.year, value: p.value };
		})
		.sort((a, b) => a.country.localeCompare(b.country) || a.year - b.year);

	return {
		raw: rows,
		table: { columns: getTableColumns(), rows, filename: 'electrification-country-paths' },
		placeholders: {
			euLatest: euLatest != null ? euLatest.toFixed(1) : '–',
			latestYear: dataset.latestYear,
			headline: computeHeadline(dataset, selectedIds)
		},
		meta: { source: SOURCE, updateDate: dataset.updateDate }
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const dataset = await fetchElectrificationDataset(fetch);
	if (!dataset.points.length) return null;
	const euId = dataset.regions.find((r) => r.code === EU_REGION_CODE)?.id;
	return buildChartData(dataset, euId ? [euId] : []);
}
