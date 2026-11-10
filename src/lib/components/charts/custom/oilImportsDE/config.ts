import type { ChartFetchParams, ChartData, TableColumn } from '../../types';

const CSV_URL =
	'https://data.klimadashboard.org/de/energy/fossil/oil_imports-destatis.csv';

interface OilRow {
	Jahr: number;
	Tonnen: number;
}

function parseCsv(text: string): OilRow[] {
	const lines = text.trim().split('\n');
	if (lines.length < 2) return [];
	const delimiter = lines[0].includes(';') ? ';' : ',';
	const headers = lines[0].split(delimiter).map((h) => h.trim());

	return lines
		.slice(1)
		.map((line) => {
			const values = line.split(delimiter);
			const row: Record<string, any> = {};
			headers.forEach((h, i) => {
				const val = values[i]?.trim();
				row[h] = val !== '' && val !== undefined && !isNaN(Number(val)) ? Number(val) : null;
			});
			return row as OilRow;
		})
		.filter((r) => r.Jahr != null && r.Tonnen != null)
		.sort((a, b) => a.Jahr - b.Jahr);
}

function formatTonnen(v: number): string {
	if (v >= 1_000_000) return (v / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' Mio';
	if (v >= 1_000) return (v / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' Tsd';
	return v.toLocaleString('de-DE');
}

export async function fetchChartData({ fetch: fetchFn }: ChartFetchParams): Promise<ChartData | null> {
	let response: Response;
	try {
		response = await fetchFn(CSV_URL);
	} catch {
		return null;
	}
	if (!response.ok) return null;

	const data = parseCsv(await response.text());
	if (!data.length) return null;

	const last = data[data.length - 1];
	const peak = data.reduce((max, d) => (d.Tonnen > max.Tonnen ? d : max), data[0]);

	const columns: TableColumn[] = [
		{ key: 'Jahr', label: 'Jahr', align: 'left' },
		{
			key: 'Tonnen',
			label: 'Importe (t)',
			align: 'right',
			format: (v) => (typeof v === 'number' ? formatTonnen(v) : '–')
		}
	];

	return {
		raw: data,
		table: { columns, rows: data, filename: 'oel_importe_de' },
		placeholders: {
			lastYear: String(last.Jahr),
			lastValue: formatTonnen(last.Tonnen),
			peakYear: String(peak.Jahr),
			peakValue: formatTonnen(peak.Tonnen)
		},
		meta: { source: 'Destatis' }
	};
}
