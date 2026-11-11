import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import { getAggregateMembers } from '$lib/utils/regionAggregation';

// Siedlungs- und Verkehrsfläche (Destatis Flächenerhebung) per region and year, in ha.
// The source CSV in Directus is ~16 MB (all German regions), too large for the browser,
// so it is loaded and indexed here once and the endpoint returns one region's series.
// Response: { region, series: [{ period, settlement, transport, suv, total }], germany }
const CSV_FILE_ID = 'a313aa9b-a7ab-4ed6-8f2f-e81658f1b077';
const CSV_URL = `https://base.klimadashboard.org/assets/${CSV_FILE_ID}`;
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

type Values = { settlement?: number; transport?: number; total?: number };
type Index = Map<string, Map<string, Values>>;

export interface LandUseYear {
	period: string;
	settlement: number;
	transport: number;
	/** Siedlungs- und Verkehrsfläche = settlement + transport */
	suv: number;
	/** Total area of the region */
	total: number;
}

let index: { data: Index; expires: number } | null = null;
let loading: Promise<Index> | null = null;

function parseCsv(text: string): Index {
	const data: Index = new Map();
	const lines = text.split('\n');
	for (let i = 1; i < lines.length; i++) {
		const [region, period, category, value] = lines[i].trim().split(',');
		if (!region || !value) continue;
		if (category !== 'settlement' && category !== 'transport' && category !== 'total') continue;
		let byPeriod = data.get(region);
		if (!byPeriod) data.set(region, (byPeriod = new Map()));
		let values = byPeriod.get(period);
		if (!values) byPeriod.set(period, (values = {}));
		values[category] = Number(value);
	}
	return data;
}

async function getIndex(fetch: typeof globalThis.fetch): Promise<Index> {
	if (index && Date.now() < index.expires) return index.data;
	// Concurrent requests share one download
	loading ??= (async () => {
		try {
			const res = await fetch(CSV_URL);
			if (!res.ok) throw new Error(`CSV ${res.status}`);
			const data = parseCsv(await res.text());
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
			if (v.settlement == null || v.transport == null || v.total == null) continue;
			let s = sums.get(period);
			if (!s) sums.set(period, (s = { period, settlement: 0, transport: 0, suv: 0, total: 0, count: 0 }));
			s.settlement += v.settlement;
			s.transport += v.transport;
			s.suv += v.settlement + v.transport;
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

	const breaks = DATA_BREAKS.filter(
		(b) => ids.includes(b.region) || b.parents.includes(region.id)
	).map(({ period, note }) => ({ period, note }));

	return json(
		{
			region: { id: region.id, name: region.name, population: region.population },
			series: sumSeries(data, ids),
			breaks,
			memberCount: ids.length,
			germany: { population: germany?.population ?? null, series: sumSeries(data, [COUNTRY_DE]) },
			source: SOURCE
		},
		{ headers: { 'Cache-Control': 'public, max-age=3600' } }
	);
};
