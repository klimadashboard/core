// $lib/components/charts/custom/renewablesCapacityRanking/config.ts
//
// Installed renewable capacity (MaStR, units in operation today) of every member region of a
// region – districts of a Metropolregion or state, municipalities of a district – for a ranking.
// One request: get-renewables-capacity-by-region groups all members per carrier server-side.

import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import type { Region } from '$lib/utils/getRegion';
import { withLayerLabel } from '$lib/utils/getRegion';
import { readItem, readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { getAggregateMembers, type AggregateMember } from '$lib/utils/regionAggregation';
import { CARRIERS } from '$lib/components/charts/regionMap/regionMapData';
import { formatDate, formatNumber, formatPower } from '$lib/utils/formatters';

const ENDPOINT = 'https://base.klimadashboard.org/get-renewables-capacity-by-region';

/** The MaStR unit carriers of the renewables charts (solar, wind, biomass, hydro) */
export const carriers = Object.entries(CARRIERS)
	.filter(([, c]) => c.source.type === 'regionStats')
	.map(([key, c]) => ({ key, label: c.label, color: c.colors[1] }));

/** Endpoint carriers summed into a chart carrier (the biomass charts include Klärschlamm) */
const PARTS: Record<string, string[]> = { biomass: ['biomass', 'sewage_sludge'] };
const partsOf = (key: string) => PARTS[key] ?? [key];

/** Layer of the members of a non-aggregate region (aggregates: their districts) */
const MEMBER_LAYER: Record<string, 'district' | 'municipality'> = {
	state: 'district',
	district: 'municipality'
};

type RegionRef = Pick<Region, 'id' | 'layer' | 'code' | 'country'>;

export interface CapacityRow {
	code: string;
	name: string;
	/** layer_label of the member, e.g. "Landkreis" / "Kreisfreie Stadt" */
	kind: string;
	area: number | null;
	kw: Record<string, number>;
	total: number;
}

export interface CapacityData {
	rows: CapacityRow[];
	date: string;
}

async function getMembers(region: RegionRef, fetch: typeof globalThis.fetch) {
	const aggregate = await getAggregateMembers(region, fetch);
	if (aggregate) return { level: 'district' as const, members: aggregate };

	const level = MEMBER_LAYER[region.layer];
	if (!level || !region.code) return null;
	// Districts are keyed by their 5-digit `code`, municipalities by the 8-digit `code_short`
	const codeField = level === 'district' ? 'code' : 'code_short';
	const members = (await getDirectusInstance(fetch).request(
		readItems('regions', {
			filter: {
				layer: { _eq: level },
				...(region.country ? { country: { _eq: region.country } } : {}),
				[codeField]: { _starts_with: region.code }
			},
			fields: ['id', 'code', 'code_short', 'name', 'layer_label', 'area'],
			limit: -1
		})
	)) as AggregateMember[];
	return { level, members };
}

export async function fetchData(
	fetch: typeof globalThis.fetch,
	region: RegionRef | null
): Promise<CapacityData | null> {
	if (!region) return null;
	const resolved = await getMembers(region, fetch);
	if (!resolved?.members.length) return null;
	const { level, members } = resolved;

	const params = new URLSearchParams({
		region: region.id,
		level,
		carriers: carriers.flatMap((c) => partsOf(c.key)).join(',')
	});
	const res = await fetch(`${ENDPOINT}?${params}`);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const json = await res.json();

	const byCode = new Map<string, any>((json.rows ?? []).map((r: any) => [String(r.region), r]));
	const names = members.map((m) => m.name);
	const rows = members
		.map((m) => {
			const code = level === 'district' ? m.code : (m.code_short ?? m.code);
			const values = byCode.get(code)?.carriers ?? {};
			const kw = Object.fromEntries(
				carriers.map((c) => [
					c.key,
					partsOf(c.key).reduce((sum, p) => sum + (values[p]?.net_power_kw ?? 0), 0)
				])
			);
			const duplicate = names.filter((n) => n === m.name).length > 1;
			return {
				code,
				// "Ansbach" is both a city and a Landkreis
				name: duplicate ? withLayerLabel(m.name, m.layer_label) : m.name,
				kind: m.layer_label ?? '',
				area: m.area || null,
				kw,
				total: carriers.reduce((sum, c) => sum + kw[c.key], 0)
			};
		})
		.filter((r) => r.total > 0)
		.sort((a, b) => b.total - a.total);

	return rows.length ? { rows, date: json.date } : null;
}

export function buildChartData(data: CapacityData, region: RegionRef | null): ChartData {
	const { rows, date } = data;
	const kwColumn = (key: string, label: string): TableColumn => ({
		key,
		label: `${label} (kW)`,
		align: 'right',
		format: (v: number) => formatNumber(v, 0)
	});
	const columns: TableColumn[] = [
		{ key: 'name', label: 'Region', align: 'left' },
		...carriers.map((c) => kwColumn(c.key, c.label)),
		kwColumn('total', 'Gesamt'),
		{
			key: 'totalPerArea',
			label: 'Gesamt (kW/km²)',
			align: 'right',
			format: (v: number | null) => (v == null ? '–' : formatNumber(v, 1))
		}
	];
	const tableRows = rows.map((r) => ({
		name: r.name,
		...r.kw,
		total: r.total,
		totalPerArea: r.area ? r.total / r.area : null
	}));
	const top = rows[0];
	const bottom = rows[rows.length - 1];

	return {
		raw: tableRows,
		table: { columns, rows: tableRows, filename: 'erzeugungsleistung-regionen' },
		placeholders: {
			count: rows.length,
			totalKw: formatPower(rows.reduce((sum, r) => sum + r.total, 0)),
			topRegion: top.name,
			topKw: formatPower(top.total),
			bottomRegion: bottom.name,
			bottomKw: formatPower(bottom.total),
			updateDate: formatDate(date)
		},
		meta: {
			updateDate: date,
			source: 'Marktstammdatenregister der Bundesnetzagentur',
			region: (region as Region) ?? null
		}
	};
}

export async function fetchChartData({
	regionId,
	fetch
}: ChartFetchParams): Promise<ChartData | null> {
	if (!regionId) return null;
	const region = (await getDirectusInstance(fetch).request(
		readItem('regions', regionId, { fields: ['id', 'layer', 'code', 'country'] })
	)) as RegionRef;
	const data = await fetchData(fetch, region);
	return data ? buildChartData(data, region) : null;
}
