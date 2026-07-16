import type { ChartFetchParams, ChartData, TableColumn } from '$lib/components/charts/types';
import {
	fetchElectrificationDataset,
	latestValue,
	SOURCE,
	SECTORS,
	EU_REGION_CODE,
	type ElectrificationDataset
} from '$lib/utils/electrification';

export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'country', label: 'Country', align: 'left' },
		{ key: 'sector', label: 'Sector', align: 'left' },
		{ key: 'year', label: 'Year', align: 'right' },
		{
			key: 'value',
			label: 'Electricity share (%)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? v.toFixed(1) : '–')
		}
	];
}

export function computeHeadline(dataset: ElectrificationDataset, selectedIds: string[]): string {
	if (selectedIds.length === 1) {
		const id = selectedIds[0];
		const region = dataset.regions.find((r) => r.id === id);
		const sectorVals = SECTORS.map((s) => ({
			short: s.short,
			value: latestValue(dataset, id, s.key)
		})).filter((s): s is { short: string; value: number } => s.value != null);

		if (!region || !sectorVals.length) return 'Electrification varies widely by sector';

		const sorted = [...sectorVals].sort((a, b) => b.value - a.value);
		const max = sorted[0];
		const min = sorted[sorted.length - 1];
		if (max.short === min.short) {
			return `In ${region.name}, electrification is fairly even across sectors`;
		}
		return `In ${region.name}, ${max.short} is highly electrified (${max.value.toFixed(0)}%) while ${min.short} lags (${min.value.toFixed(0)}%)`;
	}

	const compareIds = selectedIds.length ? selectedIds : dataset.regions.map((r) => r.id);
	const sectorAverages = SECTORS.map((s) => {
		const vals = compareIds
			.map((id) => latestValue(dataset, id, s.key))
			.filter((v): v is number => v != null);
		const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
		return { short: s.short, avg };
	}).filter((s): s is { short: string; avg: number } => s.avg != null);

	if (!sectorAverages.length) return 'Electrification varies widely by sector';

	const sorted = [...sectorAverages].sort((a, b) => b.avg - a.avg);
	const max = sorted[0];
	const min = sorted[sorted.length - 1];
	const scope = selectedIds.length ? 'the selected countries' : 'the EU';
	return `Across ${scope}, ${max.short} is consistently the most electrified sector, while ${min.short} lags behind`;
}

export function buildChartData(
	dataset: ElectrificationDataset,
	selectedIds: string[] = []
): ChartData {
	const sectorKeys = new Set(SECTORS.map((s) => s.key));
	const rows = dataset.points
		.filter((p) => sectorKeys.has(p.category))
		.map((p) => {
			const region = dataset.regions.find((r) => r.id === p.regionId);
			const sector = SECTORS.find((s) => s.key === p.category);
			return {
				country: region?.name ?? p.regionId,
				sector: sector?.label ?? p.category,
				year: p.year,
				value: p.value
			};
		});

	return {
		raw: rows,
		table: { columns: getTableColumns(), rows, filename: 'electrification-by-sector' },
		placeholders: { latestYear: dataset.latestYear, headline: computeHeadline(dataset, selectedIds) },
		meta: { source: SOURCE, updateDate: dataset.updateDate }
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const dataset = await fetchElectrificationDataset(fetch);
	if (!dataset.points.length) return null;
	const euId = dataset.regions.find((r) => r.code === EU_REGION_CODE)?.id;
	return buildChartData(dataset, euId ? [euId] : []);
}
