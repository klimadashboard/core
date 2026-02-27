import type { ChartFetchParams, ChartData, TableColumn } from '../../types';
import { PUBLIC_VERSION } from '$env/static/public';

const SECTORS = [
	{ key: 'energy', csvKey: 'energy_ipc1_Mt_CO2e', label: 'Energie', color: '#BD3737' },
	{
		key: 'industry',
		csvKey: 'industrial_processes_and_product_use_ipc2_Mt_CO2e',
		label: 'Industrie',
		color: '#373949'
	},
	{
		key: 'agriculture',
		csvKey: 'agriculture_and_livestock_ipcmag_Mt_CO2e',
		label: 'Landwirtschaft',
		color: '#65987D'
	},
	{ key: 'waste', csvKey: 'waste_ipc4_Mt_CO2e', label: 'Abfall', color: '#B7693D' },
	{ key: 'other', csvKey: 'other_ipc5_Mt_CO2e', label: 'Andere', color: '#A4A4A4' }
];

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	const version = PUBLIC_VERSION;
	const url = `https://data.klimadashboard.org/${version}/emissions/${version.toUpperCase()}_Historical-Emissions_PIK-PRIMAP.csv`;

	let response: Response;
	try {
		response = await fetchFn(url);
	} catch {
		return null;
	}
	if (!response.ok) return null;

	const text = await response.text();
	const lines = text.trim().split('\n');
	if (lines.length < 2) return null;

	// Detect delimiter (comma or semicolon)
	const delimiter = lines[0].includes(';') ? ';' : ',';
	const headers = lines[0].split(delimiter).map((h) => h.trim());

	const rows = lines.slice(1).map((line) => {
		const values = line.split(delimiter);
		const row: Record<string, any> = {};
		headers.forEach((h, i) => {
			const val = values[i]?.trim();
			row[h] = val === '' || val === undefined ? null : isNaN(Number(val)) ? val : Number(val);
		});
		return row;
	});

	if (!rows.length) return null;

	// Map to normalized format
	const dataset = rows
		.map((row) => {
			const entry: Record<string, any> = { year: row.year };
			for (const s of SECTORS) {
				entry[s.key] = row[s.csvKey] != null ? Math.round(row[s.csvKey] * 100) / 100 : null;
			}
			return entry;
		})
		.sort((a, b) => a.year - b.year);

	const lastEntry = dataset[dataset.length - 1];
	const lastTotal = lastEntry
		? SECTORS.reduce((sum, s) => sum + (lastEntry[s.key] ?? 0), 0)
		: 0;

	// Build table
	const columns: TableColumn[] = [
		{ key: 'year', label: 'Jahr', align: 'left' },
		...SECTORS.map((s) => ({
			key: s.key,
			label: s.label,
			align: 'right' as const,
			format: (v: any) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { maximumFractionDigits: 2 })
					: '–'
		})),
		{
			key: 'total',
			label: 'Gesamt',
			align: 'right' as const,
			format: (v: any) =>
				typeof v === 'number'
					? v.toLocaleString('de-DE', { maximumFractionDigits: 2 })
					: '–'
		}
	];

	const tableRows = dataset.map((d) => {
		const total = SECTORS.reduce((sum, s) => sum + (d[s.key] ?? 0), 0);
		return { ...d, total: total > 0 ? total : null };
	});

	return {
		raw: rows,
		table: { columns, rows: tableRows, filename: 'historische_emissionen' },
		placeholders: {
			lastYear: String(lastEntry?.year ?? ''),
			lastYearTotal: lastTotal.toLocaleString('de-DE', {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1
			})
		},
		meta: {
			source: 'PIK PRIMAP'
		}
	};
}
