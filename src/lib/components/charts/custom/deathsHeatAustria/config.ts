import Papa from 'papaparse';
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import { formatNumber } from '$lib/utils/formatters';

// AGES heat mortality monitoring: Table 1 (Austria) and Table 2 (federal states),
// both for the summer period June–September. The Period column is kept in the data.
// Source page: https://www.ages.at/umwelt/klima/klimawandelanpassung/hitze
const ASSET_URL = 'https://base.klimadashboard.org/assets/2c72c169-3538-48b1-80c2-2d22e9faaddf';

export const NATIONAL = 'Österreich';

export type Period = 'Jun-Sep';
export const PERIOD: Period = 'Jun-Sep';
export const PERIOD_LABEL = 'Juni–September';
const PERIOD_LABELS: Record<string, string> = { 'Jun-Sep': PERIOD_LABEL };

export interface DeathsHeatAustriaRow {
	Year: number;
	Period: Period;
	Region: string;
	ExpectedValue: number | null;
	LowerPredictionLimit: number | null;
	UpperPredictionLimit: number | null;
	Update?: string;
}

export async function fetchRows(
	fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<DeathsHeatAustriaRow[]> {
	const res = await fetchFn(ASSET_URL);
	if (!res.ok) throw new Error(`Failed to fetch deathsHeatAustria data: ${res.status}`);

	const csv = await res.text();
	const { data } = Papa.parse<DeathsHeatAustriaRow>(csv, {
		header: true,
		delimiter: ';',
		dynamicTyping: true,
		skipEmptyLines: true
	});

	return data.filter((d) => d.Year != null && d.Region != null && d.Period != null);
}

export function getRegions(rows: DeathsHeatAustriaRow[]): string[] {
	return [...new Set(rows.map((d) => d.Region))].sort((a, b) => {
		if (a === NATIONAL) return -1;
		if (b === NATIONAL) return 1;
		return a.localeCompare(b, 'de');
	});
}

function fmt(val: number | null | undefined): string {
	return val != null ? formatNumber(val) : '–';
}

export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'Year', label: 'Jahr', align: 'left' },
		{
			key: 'Period',
			label: 'Zeitraum',
			align: 'left',
			format: (v) => PERIOD_LABELS[String(v)] ?? String(v)
		},
		{ key: 'Region', label: 'Region', align: 'left' },
		{ key: 'ExpectedValue', label: 'Geschätzte Anzahl Sterbefälle', align: 'right', format: fmt },
		{ key: 'LowerPredictionLimit', label: 'Untere Grenze (95 %)', align: 'right', format: fmt },
		{ key: 'UpperPredictionLimit', label: 'Obere Grenze (95 %)', align: 'right', format: fmt }
	];
}

export function getUpdateDate(rows: DeathsHeatAustriaRow[]): string | undefined {
	return rows.find((d) => d.Update)?.Update;
}

function latestOf(rows: DeathsHeatAustriaRow[]): DeathsHeatAustriaRow | undefined {
	return rows.length ? rows.reduce((a, b) => (b.Year > a.Year ? b : a)) : undefined;
}

export function getPlaceholders(rows: DeathsHeatAustriaRow[]): Record<string, string | number> {
	const national = rows.filter((d) => d.Region === NATIONAL && d.Period === PERIOD);
	const latest = latestOf(national);
	if (!latest) return {};

	const max = national.reduce((a, b) => ((b.ExpectedValue ?? 0) > (a.ExpectedValue ?? 0) ? b : a));

	const updateRaw = getUpdateDate(rows);
	const updateDate = updateRaw ? new Date(updateRaw) : null;
	const update =
		updateDate && !isNaN(+updateDate)
			? updateDate.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' })
			: '';

	// Per-state values for the latest year, e.g. {{deathsNiederoesterreich}}.
	// Keys are ASCII because the placeholder regex in Card.svelte only matches [\w-].
	const asciiKey = (s: string) =>
		s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
	const states = Object.fromEntries(
		rows
			.filter((d) => d.Region !== NATIONAL && d.Period === PERIOD && d.Year === latest.Year)
			.map((d) => [`deaths${asciiKey(d.Region)}`, fmt(d.ExpectedValue)])
	);

	return {
		deaths: fmt(latest.ExpectedValue),
		deathsLower: fmt(latest.LowerPredictionLimit),
		deathsUpper: fmt(latest.UpperPredictionLimit),
		year: latest.Year,
		maxDeaths: fmt(max.ExpectedValue),
		maxYear: max.Year,
		update,
		...states
	};
}

export function buildChartData(rows: DeathsHeatAustriaRow[]): ChartData {
	return {
		raw: rows,
		table: {
			columns: getTableColumns(),
			rows,
			filename: 'hitzetote-oesterreich'
		},
		placeholders: getPlaceholders(rows),
		meta: {
			source: 'AGES',
			updateDate: getUpdateDate(rows)
		}
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const rows = await fetchRows(fetch);
	if (!rows.length) return null;
	return buildChartData(rows);
}
