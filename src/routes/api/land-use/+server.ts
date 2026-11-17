import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import { getAggregateMembers } from '$lib/utils/regionAggregation';
import {
	getIndex,
	sumSeries,
	correctionNotes,
	COUNTRY_DE,
	SOURCE,
	UUID,
	type Index
} from '$lib/server/landUse';

// Siedlungs- und Verkehrsfläche (Destatis Flächenerhebung) of one region per year, in ha.
// Response: { region, series: [{ period, settlement, transport, mining, suv, total }], notes, germany, source }
//
// `suv` follows the official definition: settlement + transport without Bergbaubetrieb and
// Tagebau/Grube/Steinbruch (`mining`, Regionalstatistik 33111-02-01-5 and 33111-02-02-5).
export const GET: RequestHandler = async ({ url, fetch }) => {
	const regionId = url.searchParams.get('region') || COUNTRY_DE;
	// Directus answers malformed uuids with a 500, so reject them here
	if (!UUID.test(regionId)) throw error(400, 'Invalid region');

	let data: Index;
	let region: {
		id: string;
		name: string;
		layer: string;
		country: string | null;
		population: number | null;
	};
	let germany: { population: number | null };
	try {
		const directus = getDirectusInstance(fetch);
		const fields = ['id', 'name', 'layer', 'country', 'population'];
		[data, region, germany] = await Promise.all([
			getIndex(fetch),
			directus.request(readItem('regions', regionId, { fields })) as Promise<typeof region>,
			directus.request(readItem('regions', COUNTRY_DE, { fields: ['population'] })) as Promise<
				typeof germany
			>
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
			notes: correctionNotes(ids, region.id),
			germany: { population: germany?.population ?? null },
			source: SOURCE
		},
		{ headers: { 'Cache-Control': 'public, max-age=3600' } }
	);
};
