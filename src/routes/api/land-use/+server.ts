import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import { getAggregateMembers } from '$lib/utils/regionAggregation';

// Siedlungs- und Verkehrsfläche (Destatis Flächenerhebung) per region and year, in ha.
// The source CSVs in Directus are ~16 MB and ~10 MB (all German regions), too large for the
// browser, so they are loaded and indexed here once and the endpoint returns one region's series.
// Response: { region, series: [{ period, settlement, transport, mining, suv, total }], breaks, germany, source }
//
// `suv` follows the official definition: settlement + transport without Bergbaubetrieb and
// Tagebau/Grube/Steinbruch (`mining`, Regionalstatistik 33111-02-01-5 and 33111-02-02-5).
const CSV_URLS = [
	'a313aa9b-a7ab-4ed6-8f2f-e81658f1b077', // settlement, transport, total
	'9c9f61f1-af16-4f57-af54-16142dc01e80' // mining
].map((id) => `https://base.klimadashboard.org/assets/${id}`);
const COUNTRY_DE = '3d5acf1a-8120-44d1-966b-62c21fa5d331';
const SOURCE = 'Statistisches Bundesamt (Destatis), Flächenerhebung nach Art der tatsächlichen Nutzung';
const CACHE_TTL = 12 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Known breaks in the series that are not real changes in land use. A break applies to its
 * region, to aggregates containing it (Metropolregion) and to the listed parent regions.
 */
const DATA_BREAKS = [
	{
		period: '2022',
		region: '4131197d-2724-433a-96d2-4e386a4519ad', // Lkr. Neustadt a.d. Waldnaab
		parents: ['faacc2ea-6e8a-47c8-a3c4-71bc58d26b09', COUNTRY_DE], // Bayern, Deutschland
		note:
			'Korrektur im Liegenschaftskataster: Teile des Truppenübungsplatzes Grafenwöhr (Lkr. Neustadt a.d. Waldnaab) waren seit 2014–2016 fälschlich als Siedlungsfläche erfasst und wurden 2022 berichtigt. Der Rückgang von rund 1.700 ha ist kein echter Rückbau.'
	}
];

const CATEGORIES = ['settlement', 'transport', 'mining', 'total'] as const;
type Values = Partial<Record<(typeof CATEGORIES)[number], number>>;
type Index = Map<string, Map<string, Values>>;

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

let index: { data: Index; expires: number } | null = null;
let loading: Promise<Index> | null = null;

/** Adds a long-format CSV (columns found by header: region, period, category, value) to the index. */
function parseCsv(text: string, data: Index) {
	const lines = text.split('\n');
	const header = lines[0].trim().split(',');
	const [r, p, c, v] = ['region', 'period', 'category', 'value'].map((k) => header.indexOf(k));
	for (let i = 1; i < lines.length; i++) {
		const cols = lines[i].trim().split(',');
		const category = cols[c] as (typeof CATEGORIES)[number];
		if (!cols[r] || !cols[v] || !CATEGORIES.includes(category)) continue;
		let byPeriod = data.get(cols[r]);
		if (!byPeriod) data.set(cols[r], (byPeriod = new Map()));
		let values = byPeriod.get(cols[p]);
		if (!values) byPeriod.set(cols[p], (values = {}));
		values[category] = Number(cols[v]);
	}
}

async function getIndex(fetch: typeof globalThis.fetch): Promise<Index> {
	if (index && Date.now() < index.expires) return index.data;
	// Concurrent requests share one download
	loading ??= (async () => {
		try {
			const texts = await Promise.all(
				CSV_URLS.map(async (url) => {
					const res = await fetch(url);
					if (!res.ok) throw new Error(`CSV ${res.status}`);
					return res.text();
				})
			);
			const data: Index = new Map();
			for (const text of texts) parseCsv(text, data);
			index = { data, expires: Date.now() + CACHE_TTL };
			return data;
		} finally {
			loading = null;
		}
	})();
	return loading;
}

/** Sums the regions' values per year; keeps only years every region has complete data for. */
function sumSeries(data: Index, regionIds: string[]): LandUseYear[] {
	const sums = new Map<string, LandUseYear & { count: number }>();
	for (const id of regionIds) {
		for (const [period, v] of data.get(id) ?? []) {
			if (v.settlement == null || v.transport == null || v.mining == null || v.total == null) continue;
			let s = sums.get(period);
			if (!s)
				sums.set(period, (s = { period, settlement: 0, transport: 0, mining: 0, suv: 0, total: 0, count: 0 }));
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

export const GET: RequestHandler = async ({ url, fetch }) => {
	const regionId = url.searchParams.get('region') || COUNTRY_DE;
	// Directus answers malformed uuids with a 500, so reject them here
	if (!UUID.test(regionId)) throw error(400, 'Invalid region');

	let data: Index;
	let region: { id: string; name: string; layer: string; country: string | null; population: number | null };
	let germany: { population: number | null };
	try {
		const directus = getDirectusInstance(fetch);
		const fields = ['id', 'name', 'layer', 'country', 'population'];
		[data, region, germany] = await Promise.all([
			getIndex(fetch),
			directus.request(readItem('regions', regionId, { fields })) as Promise<typeof region>,
			directus.request(readItem('regions', COUNTRY_DE, { fields: ['population'] })) as Promise<typeof germany>
		]);
	} catch {
		throw error(503, 'Data backend unavailable — please try again shortly');
	}
	if (!region) throw error(404, 'Region not found');

	// Regions with rows of their own use them; aggregate regions (Metropolregion) sum their members
	let ids = [region.id];
	if (!data.has(region.id)) {
		const members = await getAggregateMembers(region, fetch);
		if (!members?.length) throw error(404, 'No land use data for this region');
		ids = members.map((m) => m.id);
	}

	return json(
		{
			region: { id: region.id, name: region.name, population: region.population },
			series: sumSeries(data, ids),
			breaks: DATA_BREAKS.filter((b) => ids.includes(b.region) || b.parents.includes(region.id)).map(
				({ period, note }) => ({ period, note })
			),
			germany: { population: germany?.population ?? null },
			source: SOURCE
		},
		{ headers: { 'Cache-Control': 'public, max-age=3600' } }
	);
};
