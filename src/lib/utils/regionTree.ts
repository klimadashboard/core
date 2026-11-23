/**
 * The regions *inside* a region, for drilling down in a chart (RegionDrilldown):
 *
 * - Metropolregion → its Kreise (Landkreise / Kreisfreie Städte), each with its Gemeinden
 * - Kreis          → its Gemeinden
 * - anything else  → null (nothing to drill into)
 *
 * Kreise come from getRegionContext (members of the aggregate). Gemeinden are loaded in one
 * request by AGS code prefix of their Kreise and checked against `parents`, like the peers in
 * regionContext.ts (Directus can't filter on the `parents` JSON).
 */
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { isAggregateRegion } from '$lib/utils/regionAggregation';
import { getRegionContext, type ContextRegion } from '$lib/utils/regionContext';

export interface RegionTreeNode {
	region: ContextRegion;
	/** Gemeinden; empty for a Kreisfreie Stadt (its one Gemeinde is the city itself) */
	children: ContextRegion[];
}

export interface RegionTreeGroup {
	label: string;
	nodes: RegionTreeNode[];
}

export interface RegionTree {
	root: ContextRegion;
	groups: RegionTreeGroup[];
}

const FIELDS = ['id', 'name', 'code', 'code_short', 'layer', 'layer_label', 'country', 'area', 'population', 'parents'];
const CACHE_TTL = 60 * 60 * 1000;
const cache = new Map<string, { data: Promise<RegionTree | null>; expires: number }>();

async function municipalitiesOf(districts: ContextRegion[]): Promise<Map<string, ContextRegion[]>> {
	const byDistrict = new Map<string, ContextRegion[]>(districts.map((d) => [d.id, []]));
	const withCode = districts.filter((d) => d.code);
	if (!withCode.length) return byDistrict;

	const directus = getDirectusInstance();
	const rows = (await directus.request(
		readItems('regions', {
			fields: FIELDS,
			limit: -1,
			filter: {
				layer: { _eq: 'municipality' },
				country: { _eq: withCode[0].country },
				_or: withCode.map((d) => ({ code: { _starts_with: d.code } }))
			}
		} as never)
	)) as ContextRegion[];

	for (const r of rows) {
		const parent = r.parents?.find((p) => byDistrict.has(p.id));
		if (parent) byDistrict.get(parent.id)!.push(r);
	}
	for (const list of byDistrict.values()) list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
	return byDistrict;
}

async function loadTree(id: string): Promise<RegionTree | null> {
	const ctx = await getRegionContext({ id });
	if (!ctx) return null;
	const { self } = ctx;

	if (isAggregateRegion(self)) {
		const districts = ctx.peers.flatMap((g) => g.regions);
		const gemeinden = await municipalitiesOf(districts);
		return {
			root: self,
			groups: ctx.peers.map((g) => ({
				label: g.label,
				nodes: g.regions.map((d) => {
					const children = gemeinden.get(d.id) ?? [];
					// A Kreisfreie Stadt has a single Gemeinde: itself
					return { region: d, children: children.length > 1 ? children : [] };
				})
			}))
		};
	}

	if (self.layer === 'district') {
		const children = (await municipalitiesOf([self])).get(self.id) ?? [];
		if (children.length < 2) return null;
		return {
			root: self,
			groups: [{ label: 'Gemeinden', nodes: children.map((r) => ({ region: r, children: [] })) }]
		};
	}

	return null;
}

/** Drill-down tree of a region, or null if it has nothing to drill into */
export function getRegionTree(region: { id: string } | null | undefined): Promise<RegionTree | null> {
	if (!region?.id) return Promise.resolve(null);
	const hit = cache.get(region.id);
	if (hit && hit.expires > Date.now()) return hit.data;
	const data = loadTree(region.id).catch((e) => {
		console.error('[regionTree] Failed to load', e);
		cache.delete(region.id);
		return null;
	});
	cache.set(region.id, { data, expires: Date.now() + CACHE_TTL });
	return data;
}

/** Whether RegionDrilldown has anything to offer for this region ('districts': Kreise only) */
export async function hasDrilldown(
	region: { id: string } | null | undefined,
	depth: 'all' | 'districts' = 'all'
): Promise<boolean> {
	const tree = await getRegionTree(region);
	if (!tree) return false;
	return tree.groups.some((g) =>
		g.nodes.some((n) => depth === 'all' || n.region.layer !== 'municipality')
	);
}
