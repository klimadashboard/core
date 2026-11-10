/**
 * The regions "around" a region, for quick comparisons and level switches
 * (RegionSwitcher). Two kinds:
 *
 * - levels: the larger regions it lies in, small → large
 *   (Kreis → Metropolregion → Bundesland → Land). For an aggregate region
 *   (Metropolregion) these are its members' states and the country.
 * - peers: regions on the same level in the same container, grouped by layer label
 *   - Metropolregion          → its member Kreise (Landkreise / Kreisfreie Städte)
 *   - Kreis in a Metropolregion → the other Kreise of the Metropolregion
 *   - Kreis elsewhere          → the other Kreise of its state
 *   - Gemeinde                 → the other Gemeinden of its Kreis
 *   - Bundesland               → the other states
 *
 * Directus can't filter on the `parents` JSON, so peers are loaded by code prefix
 * (AGS: state 09 → district 09574 → municipality 09574138) and checked against
 * `parents` here. Hidden regions (visible = false, e.g. kreisfreie Städte as
 * districts) are included on purpose: they have data, just no page of their own.
 */
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { withLayerLabel } from '$lib/utils/getRegion';
import { AGGREGATE_LAYERS, getAggregateMembers, isAggregateRegion } from '$lib/utils/regionAggregation';

export interface ContextRegion {
	id: string;
	name: string;
	code: string;
	code_short?: string | null;
	layer: string;
	layer_label?: string | null;
	country?: string | null;
	area?: number | null;
	population?: number | null;
	parents?: Array<{ id: string; layer: string }> | null;
}

export interface PeerGroup {
	label: string;
	regions: ContextRegion[];
}

export interface RegionContext {
	self: ContextRegion;
	/** Aggregate region (Metropolregion) this region is or belongs to */
	aggregate: ContextRegion | null;
	/** Larger regions, small → large */
	levels: ContextRegion[];
	/** Title for the peer list, e.g. "Kreise der Metropolregion Nürnberg" */
	peersTitle: string | null;
	/** Short label for the peers, e.g. "Kreise" */
	peersLabel: string | null;
	peers: PeerGroup[];
}

const FIELDS = [
	'id',
	'name',
	'code',
	'code_short',
	'layer',
	'layer_label',
	'country',
	'area',
	'population',
	'parents'
];
const LEVEL_ORDER = ['municipality', 'district', ...AGGREGATE_LAYERS, 'state', 'country'];
const PLURALS: Record<string, string> = {
	Landkreis: 'Landkreise',
	'Kreisfreie Stadt': 'Kreisfreie Städte',
	Stadtkreis: 'Stadtkreise',
	Kreis: 'Kreise',
	Stadt: 'Städte',
	Markt: 'Märkte',
	Gemeinde: 'Gemeinden',
	Bundesland: 'Bundesländer',
	Bezirk: 'Bezirke',
	Statutarstadt: 'Statutarstädte'
};

const PEER_LABELS: Record<string, string> = {
	district: 'Kreise',
	municipality: 'Gemeinden',
	state: 'Bundesländer'
};

const CACHE_TTL = 60 * 60 * 1000;
const cache = new Map<string, { data: Promise<RegionContext | null>; expires: number }>();

/** Plural of a layer label for group headings ("Landkreis" → "Landkreise") */
export function pluralLayerLabel(label: string | null | undefined): string {
	if (!label) return '';
	return PLURALS[label] ?? label;
}

/** The comparison code the growth endpoints expect for a region (null = whole country) */
export function growthCode(r: Pick<ContextRegion, 'code' | 'code_short' | 'layer'>): string | null {
	if (r.layer === 'country') return null;
	return r.code_short || r.code;
}

function byLevel(a: ContextRegion, b: ContextRegion) {
	return LEVEL_ORDER.indexOf(a.layer) - LEVEL_ORDER.indexOf(b.layer);
}

/** Districts split into Landkreise / Kreisfreie Städte; other layers stay one group */
function groupByLabel(regions: ContextRegion[], split: boolean, label: string): PeerGroup[] {
	// Same name twice (Bamberg city + Bamberg district) → add the layer label
	const nameCount = new Map<string, number>();
	for (const r of regions) nameCount.set(r.name, (nameCount.get(r.name) ?? 0) + 1);
	const named = regions
		.map((r) =>
			(nameCount.get(r.name) ?? 0) > 1 ? { ...r, name: withLayerLabel(r.name, r.layer_label) } : r
		)
		.sort((a, b) => a.name.localeCompare(b.name, 'de'));

	const groups = new Map<string, ContextRegion[]>();
	for (const r of named) {
		const key = split ? pluralLayerLabel(r.layer_label) || label : label;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(r);
	}
	// Largest group first (Landkreise before Kreisfreie Städte)
	return [...groups.entries()]
		.sort((a, b) => b[1].length - a[1].length)
		.map(([label, list]) => ({ label, regions: list }));
}

async function loadContext(region: ContextRegion): Promise<RegionContext | null> {
	const directus = getDirectusInstance();
	const request = (query: Record<string, unknown>) =>
		directus.request(readItems('regions', { fields: FIELDS, limit: -1, ...query })) as Promise<
			ContextRegion[]
		>;

	// Fresh copy of the region itself (page regions lack code_short/area under these names)
	const [self] = await request({ filter: { id: { _eq: region.id } } });
	if (!self) return null;

	// --- Aggregate + peers source
	const aggregateRef = isAggregateRegion(self)
		? self
		: (self.parents ?? []).find((p) => AGGREGATE_LAYERS.includes(p.layer));
	let aggregate: ContextRegion | null = null;
	let members: ContextRegion[] = [];
	if (aggregateRef) {
		aggregate =
			aggregateRef.id === self.id
				? self
				: ((await request({ filter: { id: { _eq: aggregateRef.id } } }))[0] ?? null);
		if (aggregate) members = ((await getAggregateMembers(aggregate)) ?? []) as ContextRegion[];
	}

	// --- Levels
	let levelIds: string[];
	if (isAggregateRegion(self)) {
		const stateCounts = new Map<string, number>();
		for (const m of members) {
			const state = m.parents?.find((p) => p.layer === 'state');
			if (state) stateCounts.set(state.id, (stateCounts.get(state.id) ?? 0) + 1);
		}
		levelIds = [...stateCounts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
	} else {
		levelIds = (self.parents ?? []).map((p) => p.id);
	}
	const levels = levelIds.length ? await request({ filter: { id: { _in: levelIds } } }) : [];
	// German regions don't list the country among their parents: look it up by code
	if (self.layer !== 'country' && !levels.some((l) => l.layer === 'country') && self.country) {
		levels.push(
			...(await request({
				filter: { layer: { _eq: 'country' }, code: { _eq: self.country.toLowerCase() } },
				limit: 1
			}))
		);
	}
	// Same layer: keep the given order (aggregate: state with most members first)
	levels.sort((a, b) => byLevel(a, b) || levelIds.indexOf(a.id) - levelIds.indexOf(b.id));

	// --- Peers
	let peers: ContextRegion[] = [];
	let peersTitle: string | null = null;
	const parentOfLayer = (layer: string) => levels.find((l) => l.layer === layer);
	const prefixed = async (layer: string, container: ContextRegion) => {
		const all = await request({
			filter: {
				layer: { _eq: layer },
				country: { _eq: self.country },
				code: { _starts_with: container.code }
			}
		});
		return all.filter((r) => r.parents?.some((p) => p.id === container.id));
	};

	if (isAggregateRegion(self)) {
		peers = members;
		peersTitle = `${pluralLayerLabel('Kreis')} der ${self.name}`;
	} else if (self.layer === 'district' && aggregate) {
		peers = members;
		peersTitle = `Kreise der ${aggregate.name}`;
	} else if (self.layer === 'district') {
		const state = parentOfLayer('state');
		if (state) {
			peers = await prefixed('district', state);
			peersTitle = `Kreise in ${state.name}`;
		}
	} else if (self.layer === 'municipality') {
		const district = parentOfLayer('district');
		if (district) {
			peers = await prefixed('municipality', district);
			peersTitle = `Gemeinden in ${withLayerLabel(district.name, district.layer_label)}`;
		}
	} else if (self.layer === 'state') {
		peers = await request({ filter: { layer: { _eq: 'state' }, country: { _eq: self.country } } });
		peersTitle = pluralLayerLabel(self.layer_label) || 'Bundesländer';
	}
	peers = peers.filter((p) => p.id !== self.id);

	const peersLabel = PEER_LABELS[peers[0]?.layer] ?? null;
	return {
		self,
		aggregate,
		levels,
		peersTitle,
		peersLabel,
		peers: groupByLabel(peers, peers[0]?.layer === 'district', peersLabel ?? '')
	};
}

/** Levels and peers of a region (cached for an hour, failures are not cached) */
export function getRegionContext(
	region: Pick<ContextRegion, 'id'> | null | undefined
): Promise<RegionContext | null> {
	if (!region?.id) return Promise.resolve(null);
	const cached = cache.get(region.id);
	if (cached && Date.now() < cached.expires) return cached.data;

	const data = loadContext(region as ContextRegion).catch((e) => {
		console.error('[regionContext] failed to load', e);
		cache.delete(region.id);
		return null;
	});
	cache.set(region.id, { data, expires: Date.now() + CACHE_TTL });
	return data;
}
