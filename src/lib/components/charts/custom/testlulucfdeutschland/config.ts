import type { ChartFetchParams, ChartData, TableColumn } from '../../types';

const DATA_URL =
	'https://base.klimadashboard.org/assets/f5e3ead2-c97f-4981-a442-aa0445d119a9';

const LULUCF_SECTORS = [
	{ key: '4A', label: 'Wälder' },
	{ key: '4B', label: 'Ackerland' },
	{ key: '4C', label: 'Grünland' },
	{ key: '4D', label: 'Feuchtgebiete' },
	{ key: '4E', label: 'Siedlungen' },
	{ key: '4G', label: 'Holzprodukte' }
];

type Record = { sector: string; sector_name: string; year: number; value: number };

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const res = await fetch(DATA_URL);
	if (!res.ok) return null;

	const text = await res.text();
	const lines = text.trim().split('\n').slice(1); // skip header row
	const records: Record[] = lines
		.map((line) => {
			const cols = line.split(';');
			return {
				sector: cols[8]?.trim() ?? '',
				sector_name: cols[9]?.trim() ?? '',
				year: parseInt(cols[14] ?? ''),
				value: parseFloat(cols[16] ?? '')
			};
		})
		.filter((r) => r.sector && !isNaN(r.year) && !isNaN(r.value));

	if (!records.length) return null;

	const years = [...new Set(records.map((r) => r.year))].sort((a, b) => a - b);
	const latestYear = years.at(-1)!;
	const latestRecords = records.filter((r) => r.year === latestYear);

	const fmt = (v: number) => Math.round(v).toLocaleString('de-DE');

	const columns: TableColumn[] = [
		{ key: 'sektor', label: 'Sektor', align: 'left' },
		{
			key: 'value',
			label: `${latestYear} (t CO₂-Äq.)`,
			align: 'right',
			format: (v) => (typeof v === 'number' ? fmt(v) : '–')
		}
	];

	const tableRows = [
		{
			sektor: 'Gesamt (LULUCF)',
			value: latestRecords.find((r) => r.sector === 'LULUCF')?.value ?? null
		},
		...LULUCF_SECTORS.map((s) => ({
			sektor: s.label,
			value: latestRecords.find((r) => r.sector === s.key)?.value ?? null
		}))
	];

	const gesamtLatest = latestRecords.find((r) => r.sector === 'LULUCF');
	const fmtMio = (v: number) =>
		(v / 1_000_000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

	return {
		raw: records,
		table: { columns, rows: tableRows, filename: 'lulucf_emissionen_deutschland' },
		placeholders: {
			dataYear: String(latestYear),
			latestValue: gesamtLatest ? fmtMio(gesamtLatest.value) : ''
		},
		meta: {
			source: 'Umweltbundesamt (UBA) – Treibhausgasemissionen nach KSG-Sektoren'
		}
	};
}
