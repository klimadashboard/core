import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { formatNumber, formatPower, formatPercent, formatDate } from '$lib/utils/formatters';
import { getAggregateCodes, getAggregateMembers } from '$lib/utils/regionAggregation';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';

const ENDPOINT = 'https://base.klimadashboard.org/get-charging-growth';
const FIRST_YEAR = 2015;

export interface ChargingYear {
	period: string;
	charging_points_normal: number;
	charging_points_fast: number;
	charging_points: number;
	power_kw_normal: number;
	power_kw_fast: number;
	power_kw: number;
	stations: number;
	added_charging_points: number;
}

export interface ChargingComparison {
	label: string;
	perThousand: number;
}

export interface ChargingRawData {
	series: ChargingYear[];
	latest: ChargingYear;
	population: number | null;
	electricCars: { period: string; value: number } | null;
	perThousand: number | null;
	evsPerPoint: number | null;
	comparisons: ChargingComparison[];
	updateDate: string | null;
	source: string;
	/** Yearly Zubau by class from the Ladesäulenregister (empty when not requested or unavailable) */
	zubau: ZubauYear[];
	/** Stichtag of the register the Zubau comes from */
	zubauUpdateDate: string | null;
}

async function regionParam(region: Region | null, fetch: typeof globalThis.fetch) {
	if (!region || region.layer === 'country') return null;
	return (await getAggregateCodes(region, fetch)) ?? region.id;
}

/** State to compare with: the region's own state, or the state most members of an aggregate lie in. */
async function comparisonStateCode(region: Region | null, fetch: typeof globalThis.fetch) {
	if (!region || region.layer === 'country' || region.layer === 'state') return null;
	const members = await getAggregateMembers(region, fetch);
	if (members) {
		const counts = new Map<string, number>();
		for (const m of members) counts.set(m.code.slice(0, 2), (counts.get(m.code.slice(0, 2)) ?? 0) + 1);
		return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
	}
	return region.code?.slice(0, 2) ?? null;
}

async function getJson(fetch: typeof globalThis.fetch, params: Record<string, string>) {
	const res = await fetch(`${ENDPOINT}?${new URLSearchParams(params)}`);
	if (!res.ok) throw new Error(`Ladesäulen-Daten konnten nicht geladen werden (${res.status})`);
	return res.json();
}

const perThousand = (points: number, population: number | null | undefined) =>
	population ? (points / population) * 1000 : null;

export async function fetchData(
	region: Region | null,
	fetch: typeof globalThis.fetch = globalThis.fetch,
	/** Zubau by class for the bars; off for server-side placeholders (the register takes seconds to load once) */
	withZubau = true
): Promise<ChargingRawData | null> {
	const param = await regionParam(region, fetch);
	const stateCode = await comparisonStateCode(region, fetch);

	const [main, germany, states, zubau] = await Promise.all([
		getJson(fetch, param ? { group: 'year', region: param } : { group: 'year' }),
		param ? getJson(fetch, { group: 'year' }) : null,
		stateCode ? getJson(fetch, { group: 'state' }) : null,
		withZubau ? fetchZubau(region, fetch) : null
	]);

	const series: ChargingYear[] = (main.by_period || []).filter(
		(d: ChargingYear) => Number(d.period) >= FIRST_YEAR
	);
	const latest = series.at(-1);
	if (!latest) return null;

	const comparisons: ChargingComparison[] = [];
	const state = states?.regions?.find((r: any) => r.region_code === stateCode);
	const stateValue = state && perThousand(state.charging_points, state.population);
	if (stateValue) comparisons.push({ label: state.name, perThousand: stateValue });
	const deLatest = germany?.by_period?.at(-1);
	const deValue = deLatest && perThousand(deLatest.charging_points, germany.population);
	if (deValue) comparisons.push({ label: 'Deutschland', perThousand: deValue });

	const evs = main.electric_cars?.value ?? null;

	return {
		series,
		latest,
		population: main.population ?? null,
		electricCars: main.electric_cars ?? null,
		perThousand: perThousand(latest.charging_points, main.population),
		evsPerPoint: evs && latest.charging_points ? evs / latest.charging_points : null,
		comparisons,
		updateDate: main.update_date ?? null,
		source: main.source || 'Bundesnetzagentur, Ladesäulenregister (CC BY 4.0)',
		zubau: zubau?.years ?? [],
		zubauUpdateDate: zubau?.updateDate ?? null
	};
}

/**
 * Charging points commissioned per year by class (NLP / SLP / HPC) from the Ladesäulenregister,
 * for the region's districts (/api/charging-locations?zubau). Null if unavailable.
 */
async function fetchZubau(
	region: Region | null,
	fetch: typeof globalThis.fetch
): Promise<{ years: ZubauYear[]; updateDate: string | null } | null> {
	const params = new URLSearchParams({ zubau: '1' });
	if (region && region.layer !== 'country') {
		const members = await getAggregateCodes(region, fetch);
		const code = String(region.code ?? '');
		if (members) params.set('districts', members);
		else if (region.layer === 'state') params.set('state', code.slice(0, 2));
		else if (/^\d{5}/.test(code)) params.set('districts', code.slice(0, 5));
		else return null;
	}
	try {
		const res = await fetch(`/api/charging-locations?${params}`);
		if (!res.ok) return null;
		const body = await res.json();
		const lastYear = Math.max(...body.years.map((y: { year: number }) => y.year));
		const currentYear = new Date().getFullYear();
		return {
			updateDate: body.updateDate ?? null,
			years: body.years
				.filter((y: { year: number }) => y.year > FIRST_YEAR)
				.map((y: { year: number; nlp: number; slp: number; hpc: number }) => ({
					period: y.year,
					nlp: y.nlp,
					slp: y.slp,
					hpc: y.hpc,
					total: y.nlp + y.slp + y.hpc,
					partial: y.year === lastYear && y.year >= currentYear
				}))
		};
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------- yearly Zubau + 2030 goal

/** Map colours: locations with Normal- / Schnellladepunkten (from the Nürnberg charging explorer) */
export const ZUBAU_COLORS = { normal: '#31AAA9', fast: '#A82020' } as const;

/** Classes of the Zubau bars by the rated power of each charging point */
export const CHARGING_CLASSES = [
	// NLP and HPC in the colours of the map pins (Normal- / Schnellladen)
	// `short`: compact name for tooltips ("davon 2 HPC-Ladepunkte")
	{ key: 'nlp', label: 'Normalladepunkte (≤ 22 kW)', short: 'Normalladepunkte', color: ZUBAU_COLORS.normal },
	{ key: 'slp', label: 'Schnellladepunkte (> 22 kW – < 150 kW)', short: 'Schnellladepunkte', color: '#F5B700' },
	{
		key: 'hpc',
		label: 'High Power Charging (HPC) Ladestationen (≥ 150 kW)',
		short: 'HPC-Ladepunkte',
		color: ZUBAU_COLORS.fast
	}
] as const;
/** Goal path bars: semi-transparent fill with a dashed outline in the same colour */
export const GOAL_COLOR = '#892CDC';
export const GOAL_FILL_OPACITY = 0.3;

/** Masterplan Ladeinfrastruktur II: 1 million public charging points in Germany by 2030 */
export const CHARGING_GOAL = { target: 1_000_000, targetYear: 2030, startYear: 2026, endYear: 2029 } as const;
/** 1 million at 82,7 million inhabitants (Destatis forecast 2030) = 12,1 charging points per 1,000 inhabitants */
export const TARGET_PER_1000 = 12.1;

export interface ChargingGoal {
	target: number;
	targetYear: number;
	startYear: number;
	endYear: number;
	/** Stock at the end of startYear − 1 */
	baseStock: number;
	remaining: number;
	/** Required Zubau per goal year */
	perYear: number;
	/** Only for regions: the national target per inhabitant applied to this population */
	population?: number;
}

/** Charging points commissioned in a year (still in operation), by class */
export interface ZubauYear {
	period: number;
	nlp: number;
	slp: number;
	hpc: number;
	total: number;
	/** Current year: not over yet */
	partial: boolean;
}

/**
 * Goal path: what is missing to the target after the stock at the end of startYear − 1, spread evenly over the goal
 * years. Germany: 1 million; any other region: its population × 12,1 per 1,000.
 */
export function buildChargingGoal(data: ChargingRawData, region: Region | null): ChargingGoal | null {
	const base = data.series.find((d) => Number(d.period) === CHARGING_GOAL.startYear - 1);
	if (!base) return null;
	const national = !region || region.layer === 'country';
	const population = national ? undefined : data.population ?? undefined;
	if (!national && !population) return null;
	const target = national ? CHARGING_GOAL.target : Math.round((population! * TARGET_PER_1000) / 1000);
	const remaining = target - base.charging_points;
	if (remaining <= 0) return null;
	const years = CHARGING_GOAL.endYear - CHARGING_GOAL.startYear + 1;
	return {
		...CHARGING_GOAL,
		target,
		baseStock: base.charging_points,
		remaining,
		perYear: remaining / years,
		...(population ? { population } : {})
	};
}

export function getTableColumns(): TableColumn[] {
	return [
		{ key: 'period', label: 'Jahr', align: 'left' },
		{ key: 'charging_points_normal', label: 'Normalladepunkte', align: 'right', format: (v) => formatNumber(v) },
		{ key: 'charging_points_fast', label: 'Schnellladepunkte', align: 'right', format: (v) => formatNumber(v) },
		{ key: 'charging_points', label: 'Ladepunkte gesamt', align: 'right', format: (v) => formatNumber(v) },
		{ key: 'power_kw', label: 'Ladeleistung (kW)', align: 'right', format: (v) => formatNumber(v) },
		{ key: 'stations', label: 'Ladeeinrichtungen', align: 'right', format: (v) => formatNumber(v) }
	];
}

export function getPlaceholders(data: ChargingRawData, region: Region | null): Record<string, string | number> {
	const { latest } = data;
	const goal = buildChargingGoal(data, region);
	const first = data.series[0];
	return {
		// Stichtag of the Ladesäulenregister, e.g. for the source: "… (Stand: {{updateDate}})"
		updateDate: data.updateDate ? formatDate(data.updateDate) : '',
		firstYear: first?.period ?? '',
		firstChargingPoints: first ? formatNumber(first.charging_points) : '',
		goalTarget: goal ? formatNumber(goal.target) : '',
		goalYear: goal?.targetYear ?? '',
		goalPerYear: goal ? formatNumber(Math.round(goal.perYear)) : '',
		regionName: region?.name || 'Deutschland',
		chargingPoints: formatNumber(latest.charging_points),
		fastChargingPoints: formatNumber(latest.charging_points_fast),
		fastShare: formatPercent((latest.charging_points_fast / latest.charging_points) * 100, 0),
		power: formatPower(latest.power_kw),
		perThousand: data.perThousand != null ? formatNumber(data.perThousand, 1) : '–',
		evsPerPoint: data.evsPerPoint != null ? formatNumber(data.evsPerPoint, 1) : '–',
		addedThisYear: formatNumber(latest.added_charging_points),
		year: latest.period
	};
}

export function buildChartData(data: ChargingRawData, region: Region | null): ChartData {
	return {
		hasData: data.series.length > 0,
		raw: data.series,
		table: {
			columns: getTableColumns(),
			rows: data.series,
			filename: `ladeinfrastruktur-${region?.name || 'deutschland'}`
		},
		placeholders: getPlaceholders(data, region),
		// "Karte" tab: all charging stations (ChargingMap.svelte, data from /api/charging-locations)
		map: { energy: 'charging' },
		meta: {
			updateDate: data.updateDate ?? undefined,
			source: data.source,
			region
		}
	};
}

export async function fetchChartData({ fetch, regionId }: ChartFetchParams): Promise<ChartData | null> {
	const region = regionId
		? ((await getDirectusInstance(fetch).request(
				readItem('regions', regionId, { fields: ['id', 'code', 'name', 'layer', 'country'] })
			)) as Region)
		: null;
	// Placeholders and table only: the bars' Zubau loads in the browser
	const data = await fetchData(region, fetch, false);
	return data ? buildChartData(data, region) : null;
}
