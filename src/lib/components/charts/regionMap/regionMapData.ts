/**
 * Data for the regional choropleth map used by the renewables and storage charts.
 *
 * Two independent parts:
 *  1. Which regions to draw (`loadMapRegions`): the current region plus the regions of the
 *     same layer around it, or the members of an aggregate region (Metropolregion), with
 *     their simplified outlines from Directus.
 *  2. The values per region (`loadCarrierValues`), driven by the `CARRIERS` registry below.
 *
 * Adding a new energy carrier (e.g. biomass, hydro) only needs an entry in `CARRIERS` – and the
 * server endpoint has to accept its table (see klimadashboard-base/extensions).
 */
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { getAggregateMembers, isAggregateRegion } from '$lib/utils/regionAggregation';

export type MapMetric = 'power' | 'units' | 'capacity';

export interface CarrierConfig {
	/** Label used in legends/tooltips, e.g. "Photovoltaik" */
	label: string;
	/** Metrics this carrier offers (first one is the default) */
	metrics: MapMetric[];
	/** Single-hue colour ramp [light end, dark end] (light mode; dark mode is derived) */
	ramp: [string, string];
	/** How values are loaded */
	source:
		| { type: 'regionStats'; table: string }
		| { type: 'storageSnapshot'; categories: string[] };
}

/**
 * Registry of energy carriers the map understands. Keys match the chart config `energy`
 * parameter (and the `energy_<key>_units` MaStR tables).
 */
export const CARRIERS: Record<string, CarrierConfig> = {
	solar: {
		label: 'Photovoltaik',
		metrics: ['power', 'units'],
		ramp: ['#FFF7D6', '#8A5A00'],
		source: { type: 'regionStats', table: 'energy_solar_units' }
	},
	wind: {
		label: 'Windkraft',
		metrics: ['power', 'units'],
		ramp: ['#E8F1FA', '#08306B'],
		source: { type: 'regionStats', table: 'energy_wind_units' }
	},
	biomass: {
		label: 'Biomasse',
		metrics: ['power', 'units'],
		ramp: ['#F2F7E8', '#2F5016'],
		source: { type: 'regionStats', table: 'energy_biomass_units' }
	},
	hydro: {
		label: 'Wasserkraft',
		metrics: ['power', 'units'],
		ramp: ['#E6F5F7', '#0B4F5C'],
		source: { type: 'regionStats', table: 'energy_hydro_units' }
	},
	storage: {
		label: 'Batteriespeicher',
		metrics: ['capacity', 'power', 'units'],
		ramp: ['#F1ECF7', '#3F1F6B'],
		// Battery types only, like the storage charts (no pumped hydro, hydrogen, compressed air)
		source: {
			type: 'storageSnapshot',
			categories: ['heimspeicher', 'gewerbespeicher', 'grossspeicher']
		}
	}
};

export function getCarrier(energy: string): CarrierConfig {
	return CARRIERS[energy] ?? CARRIERS.solar;
}

export interface MapRegion {
	id: string;
	code: string;
	/** Key used by the stats endpoints (code_short || code) */
	key: string;
	name: string;
	slug: string | null;
	layer: string;
	layer_label: string | null;
	area: number | null;
	center: [number, number] | null;
	outline: any;
	/** The region the page is about */
	isCurrent: boolean;
}

export interface MapRegionSet {
	regions: MapRegion[];
	/** Layer of the drawn regions (district, municipality, state) */
	layer: string;
	/** Outline of an aggregate region drawn on top of its members */
	aggregateOutline: any | null;
	mode: 'members' | 'neighbours';
}

export interface RegionValues {
	power_kw: number | null;
	units: number | null;
	capacity_kwh: number | null;
}

type FetchFn = typeof globalThis.fetch;

/** How many regions to show around the current one, by layer */
const NEIGHBOUR_COUNT: Record<string, number> = {
	district: 28,
	municipality: 45,
	state: 30
};

const BASE_FIELDS = [
	'id',
	'code',
	'code_short',
	'name',
	'slug',
	'layer',
	'layer_label',
	'area',
	'center',
	'parents'
];

const TTL = 30 * 60 * 1000;
const cache = new Map<string, { expires: number; data: Promise<any> }>();

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
	const hit = cache.get(key);
	if (hit && Date.now() < hit.expires) return hit.data;
	const data = fn().catch((e) => {
		cache.delete(key);
		throw e;
	});
	cache.set(key, { expires: Date.now() + TTL, data });
	return data;
}

function parseCenter(c: any): [number, number] | null {
	if (!Array.isArray(c) || c.length < 2) return null;
	const lon = parseFloat(c[0]);
	const lat = parseFloat(c[1]);
	return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
}

/** Squared equirectangular distance – good enough to rank neighbours */
function dist2(a: [number, number], b: [number, number]): number {
	const kx = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
	const dx = (a[0] - b[0]) * kx;
	const dy = a[1] - b[1];
	return dx * dx + dy * dy;
}

function nearest<T extends { center: [number, number] | null }>(
	items: T[],
	origin: [number, number],
	n: number
): T[] {
	return items
		.filter((i) => i.center)
		.sort((a, b) => dist2(a.center!, origin) - dist2(b.center!, origin))
		.slice(0, n);
}

function toMapRegion(r: any, currentId: string | null): MapRegion {
	return {
		id: r.id,
		code: r.code,
		key: (r.code_short && String(r.code_short).trim()) || r.code,
		name: r.name,
		slug: r.slug ?? null,
		layer: r.layer,
		layer_label: r.layer_label ?? null,
		area: r.area ?? null,
		center: parseCenter(r.center),
		outline: r.outline_simple ?? null,
		isCurrent: r.id === currentId
	};
}

async function fetchOutlines(ids: string[], fetch?: FetchFn): Promise<Map<string, any>> {
	const directus = getDirectusInstance(fetch);
	const out = new Map<string, any>();
	const CHUNK = 60;
	const chunks: string[][] = [];
	for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
	const results = await Promise.all(
		chunks.map((slice) =>
			directus.request(
				readItems('regions', {
					filter: { id: { _in: slice } },
					fields: ['id', 'outline_simple'],
					limit: -1
				})
			)
		)
	);
	for (const rows of results) for (const r of rows as any[]) out.set(r.id, r.outline_simple);
	return out;
}

async function withOutlines(rows: any[], currentId: string | null, fetch?: FetchFn) {
	const outlines = await fetchOutlines(
		rows.map((r) => r.id),
		fetch
	);
	return rows
		.map((r) => toMapRegion({ ...r, outline_simple: outlines.get(r.id) }, currentId))
		.filter((r) => r.outline);
}

/** All regions of a layer in a country, without outlines (small, cached). */
function loadLayerIndex(layer: string, country: string, fetch?: FetchFn): Promise<any[]> {
	return cached(`index-${layer}-${country}`, async () => {
		const directus = getDirectusInstance(fetch);
		return (await directus.request(
			readItems('regions', {
				filter: { layer: { _eq: layer }, country: { _eq: country } },
				fields: BASE_FIELDS,
				limit: -1
			})
		)) as any[];
	});
}

interface RegionLike {
	id?: string;
	code?: string;
	layer?: string | null;
	country?: string | null;
	center?: any;
	parents?: Array<{ id: string; layer: string }> | null;
}

/**
 * Regions to draw for `region`: members for aggregate regions, otherwise the nearest
 * regions of the same layer (municipalities: from the own and neighbouring districts).
 */
export async function loadMapRegions(
	region: RegionLike | null,
	fetch?: FetchFn
): Promise<MapRegionSet | null> {
	if (!region?.id) return null;
	const country = region.country || 'DE';
	const key = `set-${region.id}`;

	return cached(key, async () => {
		const directus = getDirectusInstance(fetch);

		if (isAggregateRegion(region)) {
			const members = (await getAggregateMembers(region, fetch)) ?? [];
			const [regions, own] = await Promise.all([
				withOutlines(
					members.map((m) => ({ ...m })),
					null,
					fetch
				),
				directus.request(
					readItems('regions', {
						filter: { id: { _eq: region.id } },
						fields: ['outline_simple'],
						limit: 1
					})
				) as Promise<any[]>
			]);
			// members from getAggregateMembers lack slug/center – fill them from the index
			const index = await loadLayerIndex('district', country, fetch);
			const byId = new Map(index.map((r) => [r.id, r]));
			for (const r of regions) {
				const full = byId.get(r.id);
				if (full) {
					r.slug = full.slug ?? null;
					r.center = parseCenter(full.center);
				}
			}
			return {
				regions,
				layer: 'district',
				aggregateOutline: own?.[0]?.outline_simple ?? null,
				mode: 'members'
			} satisfies MapRegionSet;
		}

		if (region.layer === 'country') {
			const states = await loadLayerIndex('state', country, fetch);
			return {
				regions: await withOutlines(states, null, fetch),
				layer: 'state',
				aggregateOutline: null,
				mode: 'members'
			} satisfies MapRegionSet;
		}

		const layer = region.layer || 'district';
		const origin = parseCenter(region.center);

		if (layer === 'municipality') {
			const districtId = region.parents?.find((p) => p.layer === 'district')?.id;
			const districts = (await loadLayerIndex('district', country, fetch)).map((d) => ({
				...d,
				center: parseCenter(d.center)
			}));
			const own = districts.find((d) => d.id === districtId);
			const anchor = origin ?? own?.center;
			if (!anchor) return null;
			const nearDistricts = nearest(districts, anchor, 6);
			const prefixes = nearDistricts.map((d) => d.code).filter(Boolean);
			if (own && !prefixes.includes(own.code)) prefixes.push(own.code);

			const munis = (await directus.request(
				readItems('regions', {
					filter: {
						layer: { _eq: 'municipality' },
						country: { _eq: country },
						_or: prefixes.map((p) => ({ code: { _starts_with: p } }))
					},
					fields: BASE_FIELDS,
					limit: -1
				})
			)) as any[];
			const withCenter = munis.map((m) => ({ ...m, center: parseCenter(m.center) }));
			let picked = nearest(withCenter, anchor, NEIGHBOUR_COUNT.municipality);
			if (!picked.some((m) => m.id === region.id)) {
				const self = withCenter.find((m) => m.id === region.id);
				if (self) picked = [self, ...picked];
			}
			return {
				regions: await withOutlines(picked, region.id ?? null, fetch),
				layer,
				aggregateOutline: null,
				mode: 'neighbours'
			} satisfies MapRegionSet;
		}

		// district / state: nearest regions of the same layer in the country
		const index = (await loadLayerIndex(layer, country, fetch)).map((r) => ({
			...r,
			center: parseCenter(r.center)
		}));
		const anchor = origin ?? index.find((r) => r.id === region.id)?.center;
		if (!anchor) return null;
		const picked = nearest(index, anchor, NEIGHBOUR_COUNT[layer] ?? 28);
		return {
			regions: await withOutlines(picked, region.id ?? null, fetch),
			layer,
			aggregateOutline: null,
			mode: 'neighbours'
		} satisfies MapRegionSet;
	});
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

/**
 * Current values per region key for a carrier at a layer.
 * Returns an empty map (not an error) when the endpoint doesn't support the carrier yet.
 */
export async function loadCarrierValues(
	energy: string,
	layer: string,
	country = 'DE',
	fetch: FetchFn = globalThis.fetch
): Promise<Map<string, RegionValues>> {
	const carrier = getCarrier(energy);
	return cached(`values-${energy}-${layer}-${country}`, async () => {
		const out = new Map<string, RegionValues>();

		if (carrier.source.type === 'regionStats') {
			const url = `https://base.klimadashboard.org/get-region-stats-for-renewables?table=${carrier.source.table}&level=${layer}`;
			const res = await fetch(url);
			if (!res.ok) return out;
			const json = await res.json();
			const rows: any[] = Array.isArray(json) ? json : (json?.data ?? []);
			for (const r of rows) {
				if (!r?.region || r.region === 'country' || r.region === 'null') continue;
				out.set(String(r.region), {
					power_kw: r.total_power_kw ?? null,
					units: r.unit_count ?? null,
					capacity_kwh: null
				});
			}
			return out;
		}

		// Storage: per-region snapshot, one column set per category → sum them up
		if (layer !== 'district' && layer !== 'municipality') return out;
		const url = `https://base.klimadashboard.org/get-storage-growth?group=${layer}&country=${country}`;
		const res = await fetch(url);
		if (!res.ok) return out;
		const json = await res.json();
		const cats = carrier.source.categories;
		for (const r of json?.regions ?? []) {
			let power = 0;
			let cap = 0;
			let units = 0;
			for (const c of cats) {
				power += Number(r[`${c}_power_kw`]) || 0;
				cap += Number(r[`${c}_capacity_kwh`]) || 0;
				units += Number(r[`${c}_units`]) || 0;
			}
			out.set(String(r.region), { power_kw: power, units, capacity_kwh: cap });
		}
		return out;
	});
}

/**
 * Value of one region. A region missing from a non-empty result has no units (e.g. a city
 * without wind turbines) and counts as 0; an empty result means the carrier has no data yet.
 */
export function metricValue(
	v: RegionValues | undefined,
	metric: MapMetric,
	hasData = false
): number | null {
	if (!v) return hasData ? 0 : null;
	if (metric === 'power') return v.power_kw;
	if (metric === 'capacity') return v.capacity_kwh;
	return v.units;
}
