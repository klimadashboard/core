/**
 * Data for the regional choropleth map of the renewables and storage charts.
 *
 * Geometry comes from our own vector tiles (tiles.klimadashboard.org, `AGS` property), the
 * values from the stats endpoints in klimadashboard-base. Adding a carrier (biomass, hydro, …)
 * only needs an entry in `CARRIERS` – plus the server endpoint accepting its table.
 */
import {
	fetchAllTurbines,
	getColors,
	type TurbineData
} from '$lib/components/charts/custom/renewablesExplorer/config';
import { categoryConfigs } from '$lib/components/charts/custom/storageExplorer/config';

export type MapMetric = 'power' | 'units' | 'capacity';

export interface CarrierConfig {
	label: string;
	/** First one is the default */
	metrics: MapMetric[];
	/** Same colours as the chart: [pale, strong] */
	colors: [string, string];
	source: { type: 'regionStats'; table: string } | { type: 'storage'; categories: string[] };
	/** Unit locations as points on a basemap (MaStR, units in operation) */
	points?: { label: string; labelSingular: string };
}

const stats = (energy: 'solar' | 'wind' | 'biomass' | 'hydro', label: string): CarrierConfig => {
	const c = getColors(energy);
	return {
		label,
		metrics: ['power', 'units'],
		colors: [c.light, c.dark],
		source: { type: 'regionStats', table: `energy_${energy}_units` }
	};
};

export const CARRIERS: Record<string, CarrierConfig> = {
	solar: stats('solar', 'Photovoltaik'),
	wind: {
		...stats('wind', 'Windkraft'),
		points: { label: 'Windkraftanlagen', labelSingular: 'Windkraftanlage' }
	},
	biomass: stats('biomass', 'Biomasse'),
	hydro: stats('hydro', 'Wasserkraft'),
	storage: {
		label: 'Batteriespeicher',
		metrics: ['capacity', 'power', 'units'],
		// Heimspeicher colour of the storage charts (by far the largest category)
		colors: ['#DCFCE7', categoryConfigs[0].color],
		// Battery types only, like the storage charts (no pumped hydro etc.)
		source: { type: 'storage', categories: categoryConfigs.map((c) => c.key) }
	}
};

export const getCarrier = (energy: string) => CARRIERS[energy] ?? CARRIERS.solar;

export interface RegionValues {
	power: number;
	units: number;
	capacity: number | null;
	area: number | null;
}

const BASE = 'https://base.klimadashboard.org';
const TTL = 30 * 60 * 1000;
const cache = new Map<string, { expires: number; data: Promise<any> }>();

function cachedJson(url: string, fetch: typeof globalThis.fetch): Promise<any> {
	const hit = cache.get(url);
	if (hit && Date.now() < hit.expires) return hit.data;
	const data = fetch(url)
		.then((r) => (r.ok ? r.json() : null))
		.catch(() => null);
	cache.set(url, { expires: Date.now() + TTL, data });
	return data;
}

const rowsOf = (json: any): any[] => (Array.isArray(json) ? json : (json?.data ?? []));

/**
 * Values per region code (AGS) for all regions of a layer. Empty map when the endpoint has no
 * data for the carrier yet (e.g. biomass before the server whitelists its table).
 */
export async function loadCarrierValues(
	energy: string,
	layer: string,
	country: string,
	fetch: typeof globalThis.fetch = globalThis.fetch
): Promise<Map<string, RegionValues>> {
	const { source } = getCarrier(energy);
	const statsUrl = (table: string) =>
		`${BASE}/get-region-stats-for-renewables?table=${table}&level=${layer}`;
	const out = new Map<string, RegionValues>();

	if (source.type === 'regionStats') {
		for (const r of rowsOf(await cachedJson(statsUrl(source.table), fetch))) {
			if (!r?.region || r.region === 'country') continue;
			out.set(String(r.region), {
				power: r.total_power_kw ?? 0,
				units: r.unit_count ?? 0,
				capacity: null,
				area: r.area_km2 ?? null
			});
		}
		return out;
	}

	// The storage endpoint has no areas – take them from the solar stats of the same layer
	const [storage, solar] = await Promise.all([
		cachedJson(`${BASE}/get-storage-growth?group=${layer}&country=${country}`, fetch),
		cachedJson(statsUrl('energy_solar_units'), fetch)
	]);
	const areas = new Map(rowsOf(solar).map((r: any) => [String(r.region), r.area_km2 ?? null]));
	const sum = (r: any, field: string) =>
		source.categories.reduce((a, c) => a + (Number(r[`${c}_${field}`]) || 0), 0);
	for (const r of storage?.regions ?? []) {
		out.set(String(r.region), {
			power: sum(r, 'power_kw'),
			units: sum(r, 'units'),
			capacity: sum(r, 'capacity_kwh'),
			area: areas.get(String(r.region)) ?? null
		});
	}
	return out;
}

const locationCache = new Map<string, Promise<TurbineData[]>>();

/** Locations of all units in operation for a carrier (all of Germany, cached per page load) */
export function loadUnitLocations(energy: string): Promise<TurbineData[]> {
	if (!locationCache.has(energy)) {
		const request = fetchAllTurbines(energy as any);
		request.then((d) => d.length || locationCache.delete(energy)).catch(() => locationCache.delete(energy));
		locationCache.set(energy, request);
	}
	return locationCache.get(energy)!;
}
