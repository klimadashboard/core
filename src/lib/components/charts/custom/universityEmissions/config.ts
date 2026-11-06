import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { formatNumber } from '$lib/utils/formatters';
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';

// ── Types (mirror the Directus collections `universities` / `universities_emissions`) ──

export interface FaqItem {
	question: string;
	answer: string | null;
}

export interface University {
	id: number;
	slug: string;
	name: string;
	short_name: string | null;
	city: string | null;
	website: string | null;
	sustainability_url: string | null;
	students: number | null;
	staff: number | null;
	headcount_year: number | null;
	description: string | null;
	challenges: string[] | null;
	faq: FaqItem[] | null;
}

export type AccountingType = 'location_based' | 'market_based';

export interface EmissionRow {
	id: number;
	university: number;
	year: number;
	category: string;
	subcategory: string;
	scope: number | null;
	/** null = identical for both accounting methods */
	type: AccountingType | null;
	/** null = not reported */
	value: number | null;
	unit: string;
	climcalc_version: string | null;
	is_estimate: boolean;
	note: string | null;
	source: string | null;
	source_link: string | null;
	reviewed: string | null;
}

export interface UniversityData {
	universities: University[];
	emissions: EmissionRow[];
}

// ── Labels & colours ────────────────────────────────────────────────────────

/** Display order of categories; colours follow the sector palette from the Tailwind config. */
export const CATEGORIES: Array<{ key: string; label: string; color: string }> = [
	{ key: 'energy', label: 'Energie', color: '#BD3737' },
	{ key: 'mobility', label: 'Mobilität', color: '#F5AF4A' },
	{ key: 'construction', label: 'Gebäudebau', color: '#4880A8' },
	{ key: 'materials', label: 'Materialeinsatz', color: '#373949' },
	{ key: 'canteen', label: 'Mensen', color: '#65987D' }
];

export const SUBCATEGORY_LABELS: Record<string, string> = {
	electricity: 'Strom',
	heat: 'Wärme (Brennstoffe)',
	district_heating: 'Fernwärme',
	district_cooling: 'Fernkälte',
	other_fuels: 'Sonstige Treibstoffe',
	business_travel: 'Dienstreisen (Mitarbeitende)',
	commuting_staff: 'Pendeln (Mitarbeitende)',
	commuting_students: 'Pendeln (Studierende)',
	student_exchange: 'Auslandsaufenthalte Studierende',
	fleet: 'Eigener Fuhrpark',
	paper: 'Papier',
	it_equipment: 'IT-Geräte',
	refrigerants: 'Kältemittel',
	building_construction: 'Gebäudebau',
	canteen: 'Mensen'
};

export const ACCOUNTING_LABELS: Record<AccountingType, string> = {
	location_based: 'Standortbasiert',
	market_based: 'Marktbasiert'
};

export const SCOPE_LABELS: Record<number, string> = {
	1: 'Scope 1',
	2: 'Scope 2',
	3: 'Scope 3'
};

// ── Data loading ────────────────────────────────────────────────────────────

export async function fetchUniversityData(
	fetchFn: typeof globalThis.fetch
): Promise<UniversityData> {
	const directus = getDirectusInstance(fetchFn);

	const [universities, emissions] = await Promise.all([
		directus.request(
			readItems('universities', {
				fields: [
					'id',
					'slug',
					'name',
					'short_name',
					'city',
					'website',
					'sustainability_url',
					'students',
					'staff',
					'headcount_year',
					'description',
					'challenges',
					'faq'
				],
				sort: ['name'],
				limit: -1
			})
		),
		directus.request(
			readItems('universities_emissions', {
				fields: [
					'id',
					'university',
					'year',
					'category',
					'subcategory',
					'scope',
					'type',
					'value',
					'unit',
					'climcalc_version',
					'is_estimate',
					'note',
					'source',
					'source_link',
					'reviewed'
				],
				sort: ['year', 'category', 'subcategory'],
				limit: -1
			})
		)
	]);

	return {
		universities: universities as University[],
		emissions: emissions as EmissionRow[]
	};
}

// ── Aggregation helpers (pure, shared by index.svelte and ChartData) ────────

/** Does a row apply to the chosen accounting method? Rows without `type` apply to both. */
export const matchesAccounting = (row: EmissionRow, accounting: AccountingType) =>
	row.type === null || row.type === accounting;

/** True when the university reports separate location- and market-based figures. */
export const hasBothAccountings = (rows: EmissionRow[]) =>
	rows.some((r) => r.type === 'location_based') && rows.some((r) => r.type === 'market_based');

export const availableYears = (rows: EmissionRow[]) =>
	[...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

/** Reported total for a year ("Summe" rows) or null when the university reports none. */
export function yearTotal(
	rows: EmissionRow[],
	year: number,
	accounting: AccountingType
): number | null {
	const row = rows.find(
		(r) =>
			r.year === year &&
			r.category === 'total' &&
			matchesAccounting(r, accounting) &&
			r.value !== null
	);
	return row ? row.value : null;
}

/** Sum of the detail rows of a category in a year (not-reported values count as 0). */
export function categoryTotal(
	rows: EmissionRow[],
	year: number,
	category: string,
	accounting: AccountingType
): number {
	return rows
		.filter(
			(r) =>
				r.year === year &&
				r.category === category &&
				matchesAccounting(r, accounting) &&
				r.value !== null
		)
		.reduce((sum, r) => sum + (r.value ?? 0), 0);
}

/** Sum per GHG-Protocol scope; rows without a scope (clarification pending) are returned separately. */
export function scopeTotals(rows: EmissionRow[], year: number, accounting: AccountingType) {
	const detail = rows.filter(
		(r) =>
			r.year === year &&
			r.category !== 'total' &&
			matchesAccounting(r, accounting) &&
			r.value !== null
	);
	const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
	let unassigned = 0;
	for (const r of detail) {
		if (r.scope && totals[r.scope] !== undefined) totals[r.scope] += r.value ?? 0;
		else unassigned += r.value ?? 0;
	}
	return { totals, unassigned };
}

/** Rows (with values) that are missing from a year's detail, e.g. "not reported". */
export const notReported = (rows: EmissionRow[], year: number) =>
	rows.filter((r) => r.year === year && r.category !== 'total' && r.value === null);

// ── ChartData for the Card (table download, placeholders, source) ───────────

const tableColumns: TableColumn[] = [
	{ key: 'university', label: 'Hochschule', align: 'left' },
	{ key: 'year', label: 'Jahr', align: 'left' },
	{ key: 'category', label: 'Kategorie', align: 'left' },
	{ key: 'subcategory', label: 'Quelle', align: 'left' },
	{ key: 'scope', label: 'Scope', align: 'right', format: (v) => (v ? String(v) : '–') },
	{
		key: 'type',
		label: 'Bilanzierung',
		align: 'left',
		format: (v) => (v ? ACCOUNTING_LABELS[v as AccountingType] : 'beide')
	},
	{
		key: 'value',
		label: 'Emissionen (t CO₂e)',
		align: 'right',
		format: (v) => (typeof v === 'number' ? formatNumber(v, 0) : 'nicht berichtet')
	}
];

export function buildChartData(
	university: University,
	allRows: EmissionRow[],
	accounting: AccountingType,
	selectedYear?: number | null
): ChartData {
	const rows = allRows.filter((r) => r.university === university.id);
	const years = availableYears(rows);
	const year = selectedYear && years.includes(selectedYear) ? selectedYear : years.at(-1);
	const first = years[0];
	const total = year !== undefined ? yearTotal(rows, year, accounting) : null;
	const firstTotal = first !== undefined ? yearTotal(rows, first, accounting) : null;
	// Relative change since the first year with data (null if not comparable)
	const change =
		total !== null && firstTotal && year !== first ? (total - firstTotal) / firstTotal : null;

	const flat = rows.map((r) => ({
		...r,
		university: university.name,
		category: CATEGORIES.find((c) => c.key === r.category)?.label ?? 'Summe',
		subcategory: SUBCATEGORY_LABELS[r.subcategory] ?? 'Summe'
	}));

	const reviewed = rows.map((r) => r.reviewed).filter(Boolean) as string[];
	const sources = [...new Set(rows.map((r) => r.source).filter(Boolean))];

	return {
		hasData: rows.length > 0,
		raw: rows,
		table: {
			columns: tableColumns,
			rows: flat,
			filename: `emissionen-${university.slug}`
		},
		// Used in the CMS heading, e.g.
		// {{university}} stößt {{total}} t CO₂e im Jahr {{year}} aus{{#if hasReduction}}, eine Reduktion von −{{changePercent}} % seit {{firstYear}}{{/if}}{{#if hasIncrease}}, eine Zunahme von +{{changePercent}} % seit {{firstYear}}{{/if}}.
		// ({{#if}} blocks cannot be nested, hence two flags.)
		placeholders: {
			university: university.name,
			universityShort: university.short_name ?? university.name,
			year: year ?? '',
			total: total !== null ? formatNumber(total, 0) : '–',
			firstYear: first ?? '',
			changePercent: change !== null ? formatNumber(Math.abs(change) * 100, 0) : '',
			hasReduction: change !== null && change <= 0,
			hasIncrease: change !== null && change > 0,
			students: university.students !== null ? formatNumber(university.students, 0) : '–',
			staff: university.staff !== null ? formatNumber(university.staff, 0) : '–'
		},
		meta: {
			source: sources.join(', ') || undefined,
			updateDate: reviewed.sort().at(-1)
		}
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	const { universities, emissions } = await fetchUniversityData(fetch);
	if (!universities.length) return null;
	return buildChartData(universities[0], emissions, 'market_based');
}
