// Flächenerhebung (Destatis / Regionalstatistik) per region and year, in ha, shared by the
// /api/land-use routes. The source CSVs in Directus are large (all German regions, 10–33 MB),
// so they are loaded and indexed here once per server instance and cached for 12 hours.
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { getAggregateMembers, isAggregateRegion } from '$lib/utils/regionAggregation';

const asset = (id: string) => `https://base.klimadashboard.org/assets/${id}`;

/** Each index loads its own files, so routes only pay for what they need */
const SOURCES = {
	// settlement, transport, total (Destatis) + mining = Bergbaubetrieb + Tagebau, Grube, Steinbruch
	core: [
		asset('a313aa9b-a7ab-4ed6-8f2f-e81658f1b077'),
		asset('9c9f61f1-af16-4f57-af54-16142dc01e80')
	],
	// settlement split into residential / industry / other_settlement (Regionalstatistik 33111-02-01-5, -02-02-5)
	uses: [asset('0c42af8e-b192-4282-8ee7-55794ba20c3d')]
} as const;

export const CATEGORIES = [
	'settlement',
	'transport',
	'mining',
	'total',
	'residential',
	'industry',
	'other_settlement'
] as const;
export type Category = (typeof CATEGORIES)[number];
export type Values = Partial<Record<Category, number>>;
export type Index = Map<string, Map<string, Values>>;

export const COUNTRY_DE = '3d5acf1a-8120-44d1-966b-62c21fa5d331';
export const SOURCE =
	'Statistisches Bundesamt (Destatis), Flächenerhebung nach Art der tatsächlichen Nutzung';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CACHE_TTL = 12 * 60 * 60 * 1000;

/**
 * Corrections for known errors in the source data, applied to the region and to the listed
 * parent regions (whose rows include it); aggregates (Metropolregion) inherit them via their
 * members. Regions affected get the note in the response.
 */
export const CORRECTIONS = [
	{
		// Grafenwöhr: the Bayerisches Landesamt für Statistik revised 2014–2021 (corrected reports
		// A5111C 2018–2021, "korrigierte Fassung vom 12.12.2023"); Destatis still has the old values.
		// The offset is −1,853 ha in 2017–2021, all in "Fläche besonderer funktionaler Prägung"
		// (other_settlement); 2016 was not republished and is assumed equal.
		region: '4131197d-2724-433a-96d2-4e386a4519ad', // Lkr. Neustadt a.d. Waldnaab
		parents: ['faacc2ea-6e8a-47c8-a3c4-71bc58d26b09', COUNTRY_DE], // Bayern, Deutschland
		categories: ['settlement', 'other_settlement'] as Category[],
		periods: ['2016', '2017', '2018', '2019', '2020', '2021'],
		delta: -1853,
		note: 'Werte bis 2021 bereinigt: Teile des Truppenübungsplatzes Grafenwöhr (Lkr. Neustadt a.d. Waldnaab) waren fälschlich als Siedlungsfläche erfasst. Korrektur nach dem Bayerischen Landesamt für Statistik, für 2016 geschätzt.'
	}
];

/** Notes of the corrections that touch these regions (and, if given, one of these years) */
export function correctionNotes(ids: string[], regionId: string, periods?: string[]): string[] {
	return CORRECTIONS.filter(
		(c) =>
			(ids.includes(c.region) || c.parents.includes(regionId)) &&
			(!periods || periods.some((p) => c.periods.includes(p)))
	).map((c) => c.note);
}

/** Adds a long-format CSV (columns found by header: region, period, category, value) to the index. */
function parseCsv(text: string, data: Index) {
	const lines = text.split('\n');
	const header = lines[0].trim().split(',');
	const [r, p, c, v] = ['region', 'period', 'category', 'value'].map((k) => header.indexOf(k));
	for (let i = 1; i < lines.length; i++) {
		const cols = lines[i].trim().split(',');
		const category = cols[c] as Category;
		if (!cols[r] || !cols[v] || !CATEGORIES.includes(category)) continue;
		let byPeriod = data.get(cols[r]);
		if (!byPeriod) data.set(cols[r], (byPeriod = new Map()));
		let values = byPeriod.get(cols[p]);
		if (!values) byPeriod.set(cols[p], (values = {}));
		values[category] = Number(cols[v]);
	}
}

const cache: Partial<Record<keyof typeof SOURCES, { data: Index; expires: number }>> = {};
const loading: Partial<Record<keyof typeof SOURCES, Promise<Index>>> = {};

export async function getIndex(
	fetch: typeof globalThis.fetch,
	which: keyof typeof SOURCES = 'core'
): Promise<Index> {
	const hit = cache[which];
	if (hit && Date.now() < hit.expires) return hit.data;
	// Concurrent requests share one download
	loading[which] ??= (async () => {
		try {
			const texts = await Promise.all(
				SOURCES[which].map(async (url) => {
					const res = await fetch(url);
					if (!res.ok) throw new Error(`CSV ${res.status}`);
					return res.text();
				})
			);
			const data: Index = new Map();
			for (const text of texts) parseCsv(text, data);
			for (const c of CORRECTIONS) {
				for (const id of [c.region, ...c.parents]) {
					for (const period of c.periods) {
						const v = data.get(id)?.get(period);
						for (const cat of c.categories) if (v?.[cat] != null) v[cat]! += c.delta;
					}
				}
			}
			cache[which] = { data, expires: Date.now() + CACHE_TTL };
			return data;
		} finally {
			delete loading[which];
		}
	})();
	return loading[which]!;
}

export interface LandUseYear {
	period: string;
	settlement: number;
	transport: number;
	/** Bergbaubetrieb + Tagebau, Grube, Steinbruch (part of settlement) */
	mining: number;
	/** Siedlungs- und Verkehrsfläche = settlement + transport − mining */
	suv: number;
	/** Total area of the region */
	total: number;
}

/** Sums the regions' values per year; keeps only years every region has complete data for. */
export function sumSeries(data: Index, regionIds: string[]): LandUseYear[] {
	const sums = new Map<string, LandUseYear & { count: number }>();
	for (const id of regionIds) {
		for (const [period, v] of data.get(id) ?? []) {
			if (v.settlement == null || v.transport == null || v.mining == null || v.total == null)
				continue;
			let s = sums.get(period);
			if (!s)
				sums.set(
					period,
					(s = { period, settlement: 0, transport: 0, mining: 0, suv: 0, total: 0, count: 0 })
				);
			s.settlement += v.settlement;
			s.transport += v.transport;
			s.mining += v.mining;
			s.suv += v.settlement + v.transport - v.mining;
			s.total += v.total;
			s.count++;
		}
	}
	return [...sums.values()]
		.filter((s) => s.count === regionIds.length)
		.sort((a, b) => a.period.localeCompare(b.period))
		.map(({ count, ...s }) => s);
}

export interface LandUseRegion {
	id: string;
	name: string;
	code: string;
	layer: string;
	layer_label: string | null;
	country: string | null;
	population: number | null;
	parents: Array<{ id: string; layer: string }> | null;
}
export const REGION_FIELDS = [
	'id',
	'name',
	'code',
	'layer',
	'layer_label',
	'country',
	'population',
	'parents'
];

const childCache = new Map<string, { data: LandUseRegion[]; expires: number }>();

/**
 * The regions a region is made of, one level down: Deutschland → Bundesländer,
 * Bundesland → Kreise, Metropolregion → its member Kreise, Kreis → Gemeinden.
 * Directus can't filter on the `parents` JSON, so candidates are loaded by code prefix
 * (AGS: 09 → 09574 → 095745325131) and checked against `parents`, as in regionContext.
 * A Gemeinde has no children and is returned as its own only part.
 */
export async function getChildRegions(
	region: LandUseRegion,
	fetch: typeof globalThis.fetch
): Promise<LandUseRegion[]> {
	const hit = childCache.get(region.id);
	if (hit && Date.now() < hit.expires) return hit.data;

	const directus = getDirectusInstance(fetch);
	const request = (filter: Record<string, unknown>) =>
		directus.request(readItems('regions', { fields: REGION_FIELDS, filter, limit: -1 })) as Promise<
			LandUseRegion[]
		>;
	const below = (layer: string) =>
		request({
			layer: { _eq: layer },
			country: { _eq: region.country },
			code: { _starts_with: region.code }
		}).then((all) => all.filter((r) => r.parents?.some((p) => p.id === region.id)));

	let children: LandUseRegion[];
	if (isAggregateRegion(region))
		children = ((await getAggregateMembers(region, fetch)) ?? []) as LandUseRegion[];
	else if (region.layer === 'country')
		children = await request({ layer: { _eq: 'state' }, country: { _eq: region.country ?? 'DE' } });
	else if (region.layer === 'state') children = await below('district');
	else if (region.layer === 'district') children = await below('municipality');
	else children = [];
	if (!children.length) children = [region];

	childCache.set(region.id, { data: children, expires: Date.now() + CACHE_TTL });
	return children;
}
