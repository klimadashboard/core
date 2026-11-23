// $lib/components/charts/custom/renewableShareRegions/config.ts
//
// Renewable share of electricity consumption (bilanziell) per region, from
// `energy_renewable_share_regions`. Shows the page region's member regions ranked,
// plus reference rows for the region itself and its parents. Regions without a
// row of their own (states, aggregates) are computed from the rows of their
// members, weighted with the consumption. Countries are never computed: the
// table may only cover part of them.
//
// Regions without members (districts, municipalities) get peers instead: all districts of
// their state, with the district itself (or the municipality's district) flagged as `focus`,
// so the distribution view can show where it stands.

import { readItem, readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { getAggregateMembers, getFallbackParentIds } from '$lib/utils/regionAggregation';
import { withLayerLabel } from '$lib/utils/getRegion';
import { formatNumber, formatPercent } from '$lib/utils/formatters';
import { t } from '$lib/utils/t';
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';

const COLLECTION = 'energy_renewable_share_regions';

interface RegionRef {
	id: string;
	name: string;
	code: string | null;
	center: [string, string] | null;
	layer: string;
	layer_label: string | null;
	population: number | null;
	parents: Array<{ id: string; layer: string }> | null;
}

interface DbRow {
	year: number;
	share: number;
	consumption_mwh: number | null;
	source: string | null;
	update: string | null;
	region: RegionRef;
}

export interface ShareRow {
	id: string;
	name: string;
	/**
	 * 'self' = the page region, 'parent' = a region it belongs to, 'member' = one of its members,
	 * 'peer' = a district of the same state (only for regions without members)
	 */
	kind: 'self' | 'parent' | 'member' | 'peer';
	/** the peer that stands for the page region: the district itself or a municipality's district */
	focus?: boolean;
	/** % of consumption, can be above 100 */
	share: number;
	consumption: number | null;
	/** inhabitants, sizes the dots in the distribution view */
	population: number | null;
	/** true when computed from the members (consumption-weighted) */
	computed: boolean;
	/** region code (AGS for German districts), matches the vector tiles of the map view */
	code?: string | null;
	/** [lon, lat] as strings, frames the map view */
	center?: [string, string] | null;
}

const REGION_FIELDS = ['id', 'name', 'code', 'center', 'layer', 'layer_label', 'population', 'parents'];

/** Σ share·consumption / Σ consumption over rows with a consumption */
function weighted(rows: DbRow[]): { share: number; consumption: number } | null {
	const parts = rows.filter((r) => r.consumption_mwh && Number.isFinite(r.share));
	const consumption = parts.reduce((s, r) => s + r.consumption_mwh!, 0);
	if (!consumption) return null;
	const renewable = parts.reduce((s, r) => s + (r.share / 100) * r.consumption_mwh!, 0);
	return { share: (renewable / consumption) * 100, consumption };
}

export async function fetchChartData({
	fetch,
	regionId,
	translations
}: ChartFetchParams): Promise<ChartData | null> {
	if (!regionId) return null;
	const directus = getDirectusInstance(fetch);

	const [region, all] = await Promise.all([
		directus.request(
			readItem('regions', regionId, { fields: [...REGION_FIELDS, 'country'] })
		) as Promise<RegionRef & { country: string | null }>,
		directus.request(
			readItems(COLLECTION, {
				fields: [
					'year',
					'share',
					'consumption_mwh',
					'source',
					'update',
					...REGION_FIELDS.map((f) => `region.${f}`)
				],
				sort: ['-year'],
				limit: -1
			})
		) as Promise<DbRow[]>
	]);
	if (!all.length) return null;

	const year = all[0].year;
	const rows = all.filter((r) => r.year === year && r.region);
	const membersOf = (id: string) => rows.filter((r) => r.region.parents?.some((p) => p.id === id));

	// Duplicate names (Ansbach city / Landkreis Ansbach) get their layer label
	const nameCount = new Map<string, number>();
	for (const r of rows) nameCount.set(r.region.name, (nameCount.get(r.region.name) ?? 0) + 1);
	const label = (r: RegionRef) =>
		(nameCount.get(r.name) ?? 0) > 1 ? withLayerLabel(r.name, r.layer_label) : r.name;

	function reference(r: RegionRef, kind: 'self' | 'parent'): ShareRow | null {
		const own = rows.find((row) => row.region.id === r.id);
		if (own)
			return {
				id: r.id,
				name: r.name,
				kind,
				share: own.share,
				consumption: own.consumption_mwh,
				population: r.population ?? null,
				computed: false
			};
		if (r.layer === 'country') return null;
		const agg = weighted(membersOf(r.id));
		return agg
			? { id: r.id, name: r.name, kind, ...agg, population: r.population ?? null, computed: true }
			: null;
	}

	// Parents: the region's own (without countries), or for aggregates the states of their members
	const ownParentIds = (region.parents ?? []).filter((p) => p.layer !== 'country').map((p) => p.id);
	const parentIds = await getFallbackParentIds(region.id, ownParentIds, fetch);
	const parents = parentIds.length
		? ((await directus.request(
				readItems('regions', {
					filter: { id: { _in: parentIds } },
					fields: REGION_FIELDS,
					limit: -1
				})
			)) as RegionRef[])
		: [];

	const references = [
		reference(region, 'self'),
		...parentIds
			.map((id) => parents.find((p) => p.id === id))
			.flatMap((p) => (p ? [reference(p, 'parent')] : []))
	].filter((r): r is ShareRow => !!r);

	const members: ShareRow[] = membersOf(region.id)
		.map((r) => ({
			id: r.region.id,
			name: label(r.region),
			kind: 'member' as const,
			share: r.share,
			consumption: r.consumption_mwh,
			population: r.region.population ?? null,
			computed: false,
			code: r.region.code,
			center: r.region.center
		}))
		.sort((a, b) => b.share - a.share);

	// No members: compare the district (the page region or a municipality's district) with
	// the other districts of its state
	let peers: ShareRow[] = [];
	let peerGroup: string | null = null;
	if (!members.length) {
		const districtId = rows.some((r) => r.region.id === region.id)
			? region.id
			: region.parents?.find((p) => p.layer === 'district')?.id;
		const district = rows.find((r) => r.region.id === districtId);
		const stateId = district?.region.parents?.find((p) => p.layer === 'state')?.id;
		const group = stateId ? membersOf(stateId) : [];
		if (district && group.length > 1) {
			peerGroup = parents.find((p) => p.id === stateId)?.name ?? null;
			peers = group
				.map((r) => ({
					id: r.region.id,
					name: label(r.region),
					kind: 'peer' as const,
					focus: r.region.id === district.region.id,
					share: r.share,
					consumption: r.consumption_mwh,
					population: r.region.population ?? null,
					computed: false,
					code: r.region.code,
					center: r.region.center
				}))
				.sort((a, b) => b.share - a.share);
		}
	}

	const result = [...references, ...members, ...peers];
	if (!result.length) return null;
	// The table lists every region once (the focus district is also a reference row)
	const tableRows = result.filter((r, i) => result.findIndex((o) => o.id === r.id) === i);

	// Members of an aggregate region that the source doesn't cover
	const expected = await getAggregateMembers(region, fetch);
	const covered = new Set(members.map((m) => m.id));
	const missing = expected?.filter((m) => !covered.has(m.id)).map((m) => m.name) ?? [];

	const sources = [...new Set(rows.map((r) => r.source).filter(Boolean))].join(', ');
	const self = references.find((r) => r.kind === 'self');

	const columns: TableColumn[] = [
		{ key: 'name', label: t(translations, 'table.region'), align: 'left' },
		{
			key: 'share',
			label: t(translations, 'domain.energy.renewableShareOfConsumption'),
			align: 'right',
			format: (v) => formatPercent(v, 1)
		},
		{
			key: 'consumption',
			label: t(translations, 'domain.energy.electricityConsumptionGwh'),
			align: 'right',
			format: (v) => (v == null ? '–' : formatNumber(v / 1000, 0))
		},
		{
			key: 'population',
			label: translations?.['table.population'] ?? 'Einwohner',
			align: 'right',
			format: (v) => (v == null ? '–' : formatNumber(v, 0))
		},
		{
			key: 'computed',
			label: t(translations, 'domain.energy.computed'),
			align: 'left',
			format: (v) => (v ? t(translations, 'domain.energy.computedFromMembers') : '')
		}
	];

	const notes = [
		t(translations, 'domain.energy.renewableShareBalanceNote'),
		missing.length
			? t(translations, 'status.noDataFor').replace('{regions}', missing.join(', '))
			: ''
	].filter(Boolean);

	return {
		raw: result,
		table: { columns, rows: tableRows, filename: 'renewable-share-regions' },
		placeholders: {
			year,
			share: self ? formatPercent(self.share, 1) : null,
			regionName: region.name,
			peerGroup
		},
		meta: {
			source: sources || undefined,
			updateDate: String(year),
			note: notes.join(' ')
		}
	};
}
