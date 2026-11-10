import Papa from 'papaparse';
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';

const ASSET_URL = 'https://base.klimadashboard.org/assets/e5eb29a4-6c13-445e-8f01-bbf5f01c52ca';

export interface DeathsHeatRow {
	Year: number;
	Region: string;
	ExpectedValue: number | null;
	LowerPredictionLimit: number | null;
	UpperPredictionLimit: number | null;
	Population: number | null;
	ExpectedValuePer100000: number | null;
	LowerPredictionLimitPer100000: number | null;
	UpperPredictionLimitPer100000: number | null;
	Update?: string;
}

export async function fetchRows(
	fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<DeathsHeatRow[]> {
	const res = await fetchFn(ASSET_URL);
	if (!res.ok) throw new Error(`Failed to fetch deathsHeat data: ${res.status}`);

	const csv = await res.text();
	const { data } = Papa.parse<DeathsHeatRow>(csv, {
		header: true,
		delimiter: ';',
		dynamicTyping: true,
		skipEmptyLines: true
	});

	return data.filter((d) => d.Year != null && d.Region != null);
}

export function getRegions(rows: DeathsHeatRow[]): string[] {
	return [...new Set(rows.map((d) => d.Region))].sort((a, b) => {
		if (a === 'Deutschland') return -1;
		if (b === 'Deutschland') return 1;
		return a.localeCompare(b, 'de');
	});
}

function fmt(val: number | null | undefined): string {
	return val != null ? val.toLocaleString('de-DE') : '–';
}

function fmt1(val: number | null | undefined): string {
	return val != null ? val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '–';
}

export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'Year', label: 'Jahr', align: 'left' },
		{ key: 'Region', label: 'Region', align: 'left' },
		{ key: 'ExpectedValue', label: 'Geschätzte Anzahl Sterbefälle', align: 'right', format: fmt },
		{ key: 'LowerPredictionLimit', label: 'Untere Prädiktionsgrenze', align: 'right', format: fmt },
		{ key: 'UpperPredictionLimit', label: 'Obere Prädiktionsgrenze', align: 'right', format: fmt },
		{ key: 'Population', label: 'Bevölkerung', align: 'right', format: fmt },
		{
			key: 'ExpectedValuePer100000',
			label: 'Sterbefälle pro 100.000 Einw.',
			align: 'right',
			format: fmt1
		},
		{
			key: 'LowerPredictionLimitPer100000',
			label: 'Untere Prädiktionsgrenze pro 100.000 Einw.',
			align: 'right',
			format: fmt1
		},
		{
			key: 'UpperPredictionLimitPer100000',
			label: 'Obere Prädiktionsgrenze pro 100.000 Einw.',
			align: 'right',
			format: fmt1
		}
	];
}

export function getPlaceholders(rows: DeathsHeatRow[]): Record<string, string | number> {
	const deRows = rows.filter((d) => d.Region === 'Deutschland');
	const latest = deRows.reduce((a, b) => (b.Year > a.Year ? b : a), deRows[0]);

	const updateRaw = rows.find((d) => d.Update)?.Update;
	const updateDate = updateRaw ? new Date(updateRaw) : null;
	const update =
		updateDate && !isNaN(+updateDate)
			? updateDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
			: '';

	const saarland2026 = rows.find((d) => d.Region === 'Saarland' && d.Year === 2026);
	const schleswig2026 = rows.find((d) => d.Region === 'Schleswig-Holstein' && d.Year === 2026);

	return {
		deaths: latest?.ExpectedValue != null ? latest.ExpectedValue.toLocaleString('de-DE') : '',
		year: latest?.Year ?? '',
		update,
		deathsSaarland2026per100000: fmt1(saarland2026?.ExpectedValuePer100000),
		'deathsSchleswig-Holstein2026per100000': fmt1(schleswig2026?.ExpectedValuePer100000)
	};
}

export function getUpdateDate(rows: DeathsHeatRow[]): string | undefined {
	return rows.find((d) => d.Update)?.Update;
}

export function buildChartData(rows: DeathsHeatRow[]): ChartData {
	return {
		raw: rows,
		table: {
			columns: getTableColumns(),
			rows,
			filename: 'hitzetote'
		},
		placeholders: getPlaceholders(rows),
		meta: {
			source: 'Robert Koch-Institut',
			updateDate: getUpdateDate(rows)
		}
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const rows = await fetchRows(fetch);
	if (!rows.length) return null;
	return buildChartData(rows);
}
