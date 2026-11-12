import Papa from 'papaparse';
import { PUBLIC_VERSION } from '$env/static/public';
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import { formatNumber } from '$lib/utils/formatters';

/**
 * Heat-related deaths — one chart, two national datasets.
 *
 * de (and org): Robert Koch-Institut, whole-year estimates for Germany and its
 *   federal states. Ships population and per-100,000 columns, so the chart offers
 *   a per-capita toggle. 2026 is a projection and is drawn in the estimate colour.
 *
 * at: AGES heat mortality monitoring — Table 1 (Austria) and Table 2 (federal
 *   states), summer period June–September only, kept in the Period column. No
 *   population columns, plain (unscaled) y-axis values, latest year highlighted.
 *   Source page: https://www.ages.at/umwelt/klima/klimawandelanpassung/hitze
 *
 * Everything that differs between the two sites lives in VARIANTS below; fetching,
 * region handling and the ChartData shape are shared.
 */

export interface DeathsHeatRow {
	Year: number;
	Region: string;
	ExpectedValue: number | null;
	LowerPredictionLimit: number | null;
	UpperPredictionLimit: number | null;
	/** AT only — summer period the row covers */
	Period?: string;
	/** DE only */
	Population?: number | null;
	ExpectedValuePer100000?: number | null;
	LowerPredictionLimitPer100000?: number | null;
	UpperPredictionLimitPer100000?: number | null;
	Update?: string;
}

/** Absolute counts */
function count(val: number | null | undefined): string {
	return val != null ? formatNumber(val) : '–';
}

/** Rates per 100,000 inhabitants */
function rate(val: number | null | undefined): string {
	return val != null ? formatNumber(val, 1) : '–';
}

function getUpdateRaw(rows: DeathsHeatRow[]): string | undefined {
	return rows.find((d) => d.Update)?.Update;
}

function formatUpdate(rows: DeathsHeatRow[], locale: string): string {
	const raw = getUpdateRaw(rows);
	const date = raw ? new Date(raw) : null;
	return date && !isNaN(+date)
		? date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
		: '';
}

function latestOf(rows: DeathsHeatRow[]): DeathsHeatRow | undefined {
	return rows.length ? rows.reduce((a, b) => (b.Year > a.Year ? b : a)) : undefined;
}

interface VariantConfig {
	/** Directus asset holding the source CSV */
	assetUrl: string;
	/** National region in the data — preselected and sorted first */
	national: string;
	source: string;
	filename: string;
	/** Locale for the update date */
	dateLocale: string;
	/** Only rows of this period are charted; null = every row */
	period: string | null;
	/** Shown next to the region picker when a period filter applies */
	periodLabel: string | null;
	/** Per-100,000 toggle — only where the source ships population columns */
	perCapita: boolean;
	/** Year drawn in the estimate colour; null = whichever year is latest */
	highlightYear: number | null;
	/** Scale the y axis to thousands once the values get large */
	scaleAxis: boolean;
	/** Y-axis unit used when the axis is not scaled */
	axisUnit: string;
	/** Wording the publisher uses for the 95 % range */
	intervalLabel: string;
	/** Bars grow in on load */
	animateBars: boolean;
	getTableColumns: () => TableColumn[];
	getPlaceholders: (rows: DeathsHeatRow[]) => Record<string, string | number>;
}

const PERIOD_AT = 'Jun-Sep';
const PERIOD_LABEL_AT = 'Juni–September';
const PERIOD_LABELS: Record<string, string> = { [PERIOD_AT]: PERIOD_LABEL_AT };

const VARIANTS: Record<'de' | 'at', VariantConfig> = {
	de: {
		assetUrl: 'https://base.klimadashboard.org/assets/e5eb29a4-6c13-445e-8f01-bbf5f01c52ca',
		national: 'Deutschland',
		source: 'Robert Koch-Institut',
		filename: 'hitzetote',
		dateLocale: 'de-DE',
		period: null,
		periodLabel: null,
		perCapita: true,
		highlightYear: 2026,
		scaleAxis: true,
		axisUnit: '',
		intervalLabel: '95%-Prädiktionsintervall',
		animateBars: true,

		getTableColumns: () => [
			{ key: 'Year', label: 'Jahr', align: 'left' },
			{ key: 'Region', label: 'Region', align: 'left' },
			{
				key: 'ExpectedValue',
				label: 'Geschätzte Anzahl Sterbefälle',
				align: 'right',
				format: count
			},
			{
				key: 'LowerPredictionLimit',
				label: 'Untere Prädiktionsgrenze',
				align: 'right',
				format: count
			},
			{
				key: 'UpperPredictionLimit',
				label: 'Obere Prädiktionsgrenze',
				align: 'right',
				format: count
			},
			{ key: 'Population', label: 'Bevölkerung', align: 'right', format: count },
			{
				key: 'ExpectedValuePer100000',
				label: 'Sterbefälle pro 100.000 Einw.',
				align: 'right',
				format: rate
			},
			{
				key: 'LowerPredictionLimitPer100000',
				label: 'Untere Prädiktionsgrenze pro 100.000 Einw.',
				align: 'right',
				format: rate
			},
			{
				key: 'UpperPredictionLimitPer100000',
				label: 'Obere Prädiktionsgrenze pro 100.000 Einw.',
				align: 'right',
				format: rate
			}
		],

		getPlaceholders: (rows) => {
			const national = rows.filter((d) => d.Region === 'Deutschland');
			const latest = latestOf(national);

			const saarland2026 = rows.find((d) => d.Region === 'Saarland' && d.Year === 2026);
			const schleswig2026 = rows.find((d) => d.Region === 'Schleswig-Holstein' && d.Year === 2026);

			return {
				deaths: latest?.ExpectedValue != null ? count(latest.ExpectedValue) : '',
				year: latest?.Year ?? '',
				update: formatUpdate(rows, 'de-DE'),
				deathsSaarland2026per100000: rate(saarland2026?.ExpectedValuePer100000),
				'deathsSchleswig-Holstein2026per100000': rate(schleswig2026?.ExpectedValuePer100000)
			};
		}
	},

	at: {
		assetUrl: 'https://base.klimadashboard.org/assets/2c72c169-3538-48b1-80c2-2d22e9faaddf',
		national: 'Österreich',
		source: 'AGES',
		filename: 'hitzetote-oesterreich',
		dateLocale: 'de-AT',
		period: PERIOD_AT,
		periodLabel: PERIOD_LABEL_AT,
		perCapita: false,
		highlightYear: null,
		scaleAxis: false,
		axisUnit: 'Menschen',
		intervalLabel: '95 %-Unsicherheitsintervall',
		animateBars: false,

		getTableColumns: () => [
			{ key: 'Year', label: 'Jahr', align: 'left' },
			{
				key: 'Period',
				label: 'Zeitraum',
				align: 'left',
				format: (v) => PERIOD_LABELS[String(v)] ?? String(v)
			},
			{ key: 'Region', label: 'Region', align: 'left' },
			{
				key: 'ExpectedValue',
				label: 'Geschätzte Anzahl Sterbefälle',
				align: 'right',
				format: count
			},
			{ key: 'LowerPredictionLimit', label: 'Untere Grenze (95 %)', align: 'right', format: count },
			{ key: 'UpperPredictionLimit', label: 'Obere Grenze (95 %)', align: 'right', format: count }
		],

		getPlaceholders: (rows) => {
			const national = rows.filter((d) => d.Region === 'Österreich' && d.Period === PERIOD_AT);
			const latest = latestOf(national);
			if (!latest) return {};

			const max = national.reduce((a, b) =>
				(b.ExpectedValue ?? 0) > (a.ExpectedValue ?? 0) ? b : a
			);

			// Per-state values for the latest year, e.g. {{deathsNiederoesterreich}}.
			// Keys are ASCII because the placeholder regex in Card.svelte only matches [\w-].
			const asciiKey = (s: string) =>
				s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
			const states = Object.fromEntries(
				rows
					.filter(
						(d) => d.Region !== 'Österreich' && d.Period === PERIOD_AT && d.Year === latest.Year
					)
					.map((d) => [`deaths${asciiKey(d.Region)}`, count(d.ExpectedValue)])
			);

			return {
				deaths: count(latest.ExpectedValue),
				deathsLower: count(latest.LowerPredictionLimit),
				deathsUpper: count(latest.UpperPredictionLimit),
				year: latest.Year,
				maxDeaths: count(max.ExpectedValue),
				maxYear: max.Year,
				update: formatUpdate(rows, 'de-AT'),
				...states
			};
		}
	}
};

/** The dataset and presentation rules of the site this build serves. */
export const variant: VariantConfig = VARIANTS[PUBLIC_VERSION === 'at' ? 'at' : 'de'];

export async function fetchRows(
	fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<DeathsHeatRow[]> {
	const res = await fetchFn(variant.assetUrl);
	if (!res.ok) throw new Error(`Failed to fetch deathsHeat data: ${res.status}`);

	const csv = await res.text();
	const { data } = Papa.parse<DeathsHeatRow>(csv, {
		header: true,
		delimiter: ';',
		dynamicTyping: true,
		skipEmptyLines: true
	});

	return data.filter(
		(d) => d.Year != null && d.Region != null && (variant.period == null || d.Period != null)
	);
}

/** Rows of the period this variant charts (all rows where it has no period filter). */
export function getPeriodRows(rows: DeathsHeatRow[]): DeathsHeatRow[] {
	return variant.period == null ? rows : rows.filter((d) => d.Period === variant.period);
}

export function getRegions(rows: DeathsHeatRow[]): string[] {
	return [...new Set(getPeriodRows(rows).map((d) => d.Region))].sort((a, b) => {
		if (a === variant.national) return -1;
		if (b === variant.national) return 1;
		return a.localeCompare(b, 'de');
	});
}

export function getTableColumns(): TableColumn[] {
	return variant.getTableColumns();
}

export function getPlaceholders(rows: DeathsHeatRow[]): Record<string, string | number> {
	return variant.getPlaceholders(rows);
}

export function getUpdateDate(rows: DeathsHeatRow[]): string | undefined {
	return getUpdateRaw(rows);
}

export function buildChartData(rows: DeathsHeatRow[]): ChartData {
	return {
		raw: rows,
		table: {
			columns: getTableColumns(),
			rows,
			filename: variant.filename
		},
		placeholders: getPlaceholders(rows),
		meta: {
			source: variant.source,
			updateDate: getUpdateDate(rows)
		}
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const rows = await fetchRows(fetch);
	if (!rows.length) return null;
	return buildChartData(rows);
}
