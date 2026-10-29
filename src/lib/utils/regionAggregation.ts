/**
 * Aggregate regions (e.g. a Metropolregion) have no data rows of their
 * own. They are linked as the LAST entry in each member's `parents` JSON
 * ({id, layer: 'metropolitan_region'}). Charts handle them in one of three ways:
 *
 * - growth endpoints that sum regions server-side: pass `getAggregateCodes(region)`
 *   as the region code (renewables, storage, charging)
 * - Directus tables with rows per district: query `getAggregateMembers(region)`
 *   and sum (cars) or weight by population with `weightedMeanRows` (modal split)
 * - data that only exists for larger regions: fall back to the members' states
 *   with `getFallbackParentIds` (emissions)
 */
import getDirectusInstance from '$lib/utils/directus';
import { readItem, readItems } from '@directus/sdk';

export const AGGREGATE_LAYERS = ['metropolitan_region', 'group'];

export interface AggregateMember {
	id: string;
	code: string;
	code_short: string | null;
	name: string;
	layer: string;
	layer_label: string | null;
	country: string;
	population: number | null;
	area: number | null;
	parents: Array<{ id: string; layer: string }> | null;
}

const MEMBER_FIELDS = [
	'id',
	'code',
	'code_short',
	'name',
	'layer',
	'layer_label',
	'country',
	'population',
	'area',
	'parents'
];
const CACHE_TTL = 60 * 60 * 1000;
const memberCache = new Map<string, { data: AggregateMember[]; expires: number }>();

export function isAggregateRegion(region: { layer?: string | null } | null | undefined): boolean {
	return !!region?.layer && AGGREGATE_LAYERS.includes(region.layer);
}

/**
 * Member regions of an aggregate region, by layer (default: districts).
 * Returns null when `region` isn't an aggregate region, so callers can branch on it.
 *
 * Directus can't filter on the `parents` JSON, so this loads all regions of the
 * layer in the aggregate's country and filters here (cached for an hour).
 */
export async function getAggregateMembers(
	region: { id?: string; layer?: string | null; country?: string | null } | null | undefined,
	fetch?: typeof globalThis.fetch,
	layer: 'district' | 'municipality' = 'district'
): Promise<AggregateMember[] | null> {
	if (!region?.id || !isAggregateRegion(region)) return null;

	const cacheKey = `${region.id}-${layer}`;
	const cached = memberCache.get(cacheKey);
	if (cached && Date.now() < cached.expires) return cached.data;

	const directus = getDirectusInstance(fetch);
	const filter: Record<string, unknown> = { layer: { _eq: layer } };
	if (region.country) filter.country = { _eq: region.country };

	const all = (await directus.request(
		readItems('regions', { filter, fields: MEMBER_FIELDS, limit: -1 })
	)) as AggregateMember[];
	const members = all.filter((r) => r.parents?.some((p) => p.id === region.id));

	memberCache.set(cacheKey, { data: members, expires: Date.now() + CACHE_TTL });
	return members;
}

type Row = Record<string, any>;

function groupKey(row: Row, keys: string[]): string {
	return keys.map((k) => String(row[k] ?? '')).join('\u0000');
}

/**
 * Weighted mean of `valueFields` over rows that share the same `keys`, for
 * shares and rates (percentages, per-capita values). `weight(row)` is usually
 * the member's population; rows with no weight or no value are skipped.
 */
export function weightedMeanRows<T extends Row>(
	rows: T[],
	keys: string[],
	valueFields: string[],
	weight: (row: T) => number | null | undefined,
	overrides: Row = {}
): (T & { _count: number })[] {
	const groups = new Map<string, { out: Row; sums: Record<string, number>; weights: Record<string, number> }>();
	for (const row of rows) {
		const k = groupKey(row, keys);
		let g = groups.get(k);
		if (!g) {
			g = { out: { ...row, ...overrides, _count: 0 }, sums: {}, weights: {} };
			groups.set(k, g);
		}
		g.out._count++;
		const w = Number(weight(row));
		if (!Number.isFinite(w) || w <= 0) continue;
		for (const f of valueFields) {
			const n = Number(row[f]);
			if (row[f] === null || row[f] === undefined || !Number.isFinite(n)) continue;
			g.sums[f] = (g.sums[f] ?? 0) + n * w;
			g.weights[f] = (g.weights[f] ?? 0) + w;
		}
	}
	return [...groups.values()].map(({ out, sums, weights }) => {
		for (const f of valueFields) out[f] = weights[f] ? sums[f] / weights[f] : null;
		return out as T & { _count: number };
	});
}

const regionLayerCache = new Map<string, { id: string; layer: string | null; country: string | null } | null>();

/**
 * Parent ids to fall back to when a region has no data of its own.
 * Normal regions: their `parents` as given. Aggregate regions have no parents,
 * so they fall back to the states of their members, most common first
 * (a region spanning two states → the one most members lie in first).
 */
export async function getFallbackParentIds(
	regionId: string,
	parentIds: string[],
	fetch?: typeof globalThis.fetch
): Promise<string[]> {
	if (parentIds.length > 0) return parentIds;

	let region = regionLayerCache.get(regionId);
	if (region === undefined) {
		try {
			const directus = getDirectusInstance(fetch);
			region = (await directus.request(
				readItem('regions', regionId, { fields: ['id', 'layer', 'country'] })
			)) as { id: string; layer: string | null; country: string | null };
		} catch {
			region = null;
		}
		regionLayerCache.set(regionId, region);
	}

	const members = await getAggregateMembers(region, fetch);
	if (!members) return parentIds;

	const stateCounts = new Map<string, number>();
	for (const m of members) {
		const state = m.parents?.find((p) => p.layer === 'state');
		if (state) stateCounts.set(state.id, (stateCounts.get(state.id) ?? 0) + 1);
	}
	return [...stateCounts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

/**
 * The growth endpoints (get-renewables-growth, get-storage-growth,
 * get-charging-growth) sum several comma-separated region codes server-side.
 * For an aggregate region this returns its member districts' codes as that
 * `region` parameter, else null so callers use their normal region code.
 */
export async function getAggregateCodes(
	region: { id?: string; layer?: string | null; country?: string | null } | null | undefined,
	fetch?: typeof globalThis.fetch
): Promise<string | null> {
	const members = await getAggregateMembers(region, fetch);
	return members ? members.map((m) => m.code_short || m.code).join(',') : null;
}
