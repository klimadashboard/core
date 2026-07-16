import type { ChartFetchParams, ChartData, TableColumn } from '$lib/components/charts/types';
import {
	fetchElectrificationDataset,
	SOURCE,
	TARGETS,
	latestValue,
	type ElectrificationDataset
} from '$lib/utils/electrification';

export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'country', label: 'Country', align: 'left' },
		{
			key: 'value',
			label: 'Electricity share of TFC, latest year (%)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? v.toFixed(1) : '–')
		},
		{
			key: 'gap2030',
			label: `Gap to ${TARGETS[0].year} target (pp)`,
			align: 'right',
			format: (v) => (typeof v === 'number' ? v.toFixed(1) : '–')
		},
		{
			key: 'gap2040',
			label: `Gap to ${TARGETS[TARGETS.length - 1].year} target (pp)`,
			align: 'right',
			format: (v) => (typeof v === 'number' ? v.toFixed(1) : '–')
		}
	];
}

export function computeHeadline(dataset: ElectrificationDataset): string {
	const countries = dataset.regions
		.filter((r) => r.layer === 'country')
		.map((r) => ({ name: r.name, value: latestValue(dataset, r.id, 'total_economy') }))
		.filter((r): r is { name: string; value: number } => r.value != null);

	if (!countries.length) return 'Countries today differ widely in their electrification rates';

	const sorted = [...countries].sort((a, b) => b.value - a.value);
	const max = sorted[0];
	const min = sorted[sorted.length - 1];

	return `Electrification today ranges from ${min.value.toFixed(1)}% in ${min.name} to ${max.value.toFixed(1)}% in ${max.name} across the EU`;
}

export function buildChartData(dataset: ElectrificationDataset): ChartData {
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
		table: { columns: getTableColumns(), rows, filename: 'electrification-distance-to-target' },
		placeholders: { latestYear: dataset.latestYear, headline: computeHeadline(dataset) },
		meta: { source: SOURCE, updateDate: dataset.updateDate }
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const dataset = await fetchElectrificationDataset(fetch);
	if (!dataset.points.length) return null;
	return buildChartData(dataset);
}
