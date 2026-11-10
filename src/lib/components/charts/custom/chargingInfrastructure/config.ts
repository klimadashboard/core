import type { Region } from '$lib/utils/getRegion';
import type { TableColumn, ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { formatNumber, formatPower, formatPercent } from '$lib/utils/formatters';
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
	fetch: typeof globalThis.fetch = globalThis.fetch
): Promise<ChargingRawData | null> {
	const param = await regionParam(region, fetch);
	const stateCode = await comparisonStateCode(region, fetch);

	const [main, germany, states] = await Promise.all([
		getJson(fetch, param ? { group: 'year', region: param } : { group: 'year' }),
		param ? getJson(fetch, { group: 'year' }) : null,
		stateCode ? getJson(fetch, { group: 'state' }) : null
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
		source: main.source || 'Bundesnetzagentur, Ladesäulenregister (CC BY 4.0)'
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
	return {
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
	const data = await fetchData(region, fetch);
	return data ? buildChartData(data, region) : null;
}
