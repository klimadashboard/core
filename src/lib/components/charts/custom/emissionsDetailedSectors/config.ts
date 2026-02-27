import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { PUBLIC_VERSION } from '$env/static/public';

const KSG_SECTORS = [
	{ key: 'industry', label: 'Industrie' },
	{ key: 'traffic', label: 'Mobilität' },
	{ key: 'energy', label: 'Energie' },
	{ key: 'buildings', label: 'Gebäude' },
	{ key: 'agriculture', label: 'Landwirtschaft' },
	{ key: 'waste', label: 'Abfall' },
	{ key: 'fluorinated', label: 'Fluorierte Gase' }
];

const START_YEAR = 1990;

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	const version = PUBLIC_VERSION;
	const url = `https://data.klimadashboard.org/${version}/emissions/emissions_crf_${version}.json`;

	let response: Response;
	try {
		response = await fetchFn(url);
	} catch {
		return null;
	}
	if (!response.ok) return null;

	const dataset = await response.json();
	const thgData = dataset['THG'];
	if (!thgData?.length) return null;

	// Determine maxYear dynamically from the data
	const yearCount = thgData[0].absolute.length;
	const maxYear = START_YEAR + yearCount - 1;

	// Build sector lookup (exclude Memo)
	const sectorData = thgData.filter(
		(s: any) => s.key !== 'memo' && KSG_SECTORS.some((ks) => ks.key === s.key)
	);

	// Table: one row per year, columns per KSG sector (values in Mt CO₂eq)
	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		...KSG_SECTORS.filter((ks) => sectorData.some((s: any) => s.key === ks.key)).map((ks) => ({
			key: ks.key,
			label: ks.label,
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

	const tableRows = [];
	for (let yi = 0; yi < yearCount; yi++) {
		const row: Record<string, any> = { year: START_YEAR + yi };
		let total = 0;
		for (const sector of sectorData) {
			const val = sector.absolute[yi];
			row[sector.key] = val;
			if (typeof val === 'number') total += val;
		}
		row.total = total > 0 ? total : null;
		tableRows.push(row);
	}

	// Placeholders
	const latestRow = tableRows[tableRows.length - 1];
	const totalEmissions = latestRow?.total ?? 0;

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
		meta: {
			source: 'Umweltbundesamt'
		}
	};
}
