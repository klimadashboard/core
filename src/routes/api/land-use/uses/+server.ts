import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import getDirectusInstance from '$lib/utils/directus';
import { readItem } from '@directus/sdk';
import { withLayerLabel } from '$lib/utils/getRegion';
import {
	getIndex,
	getChildRegions,
	correctionNotes,
	COUNTRY_DE,
	SOURCE,
	UUID,
	REGION_FIELDS,
	type Index,
	type LandUseRegion
} from '$lib/server/landUse';

// Increase of the Siedlungs- und Verkehrsfläche in one year, per part of a region and per use:
// Deutschland → Bundesländer, Bundesland → Kreise, Metropolregion → Kreise, Kreis → Gemeinden.
// Uses: residential (Wohnbaufläche), industry (Industrie- und Gewerbefläche) and other
// (all other settlement uses without mining, plus transport). Values are net per part, in ha.
// Response: { region, year, previousYear, days, germany, children: [{ id, name, residential,
//             industry, other, suv }], notes, source }
export const GET: RequestHandler = async ({ url, fetch }) => {
	const regionId = url.searchParams.get('region') || COUNTRY_DE;
	if (!UUID.test(regionId)) throw error(400, 'Invalid region');
	const askedYear = url.searchParams.get('year');

	let core: Index, uses: Index, region: LandUseRegion, germany: { population: number | null };
	try {
		const directus = getDirectusInstance(fetch);
		[core, uses, region, germany] = await Promise.all([
			getIndex(fetch, 'core'),
			getIndex(fetch, 'uses'),
			directus.request(
				readItem('regions', regionId, { fields: REGION_FIELDS })
			) as Promise<LandUseRegion>,
			directus.request(readItem('regions', COUNTRY_DE, { fields: ['population'] })) as Promise<
				typeof germany
			>
		]);
	} catch {
		throw error(503, 'Data backend unavailable — please try again shortly');
	}
	if (!region) throw error(404, 'Region not found');

	const children = await getChildRegions(region, fetch);

	// Latest year with data for this and the previous year in both sources (or the requested one)
	const years = [...(uses.get(children[0].id)?.keys() ?? [])].sort();
	const year = askedYear && years.includes(askedYear) ? askedYear : years.at(-1);
	if (!year || !years.includes(String(+year - 1)))
		throw error(404, 'No land use data for this region');
	const prev = String(+year - 1);

	// Same name twice (Bamberg city + Bamberg district) → add the layer label
	const nameCount = new Map<string, number>();
	for (const c of children) nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + 1);

	const parts = [];
	for (const c of children) {
		const [u1, u0, c1, c0] = [
			uses.get(c.id)?.get(year),
			uses.get(c.id)?.get(prev),
			core.get(c.id)?.get(year),
			core.get(c.id)?.get(prev)
		];
		if (!u1 || !u0 || !c1 || !c0) continue;
		const d = (a: number | undefined, b: number | undefined) => (a ?? 0) - (b ?? 0);
		parts.push({
			id: c.id,
			name: (nameCount.get(c.name) ?? 0) > 1 ? withLayerLabel(c.name, c.layer_label) : c.name,
			layer: c.layer,
			residential: d(u1.residential, u0.residential),
			industry: d(u1.industry, u0.industry),
			other: d(u1.other_settlement, u0.other_settlement) + d(c1.transport, c0.transport),
			suv: d(c1.settlement, c0.settlement) + d(c1.transport, c0.transport) - d(c1.mining, c0.mining)
		});
	}
	if (!parts.length) throw error(404, 'No land use data for this region');

	return json(
		{
			region: {
				id: region.id,
				name: region.name,
				layer: region.layer,
				population: region.population
			},
			year,
			previousYear: prev,
			// Years that can be shown (their previous year has data too), for a year selector
			years: years.filter((y) => years.includes(String(+y - 1))),
			days: (Date.UTC(+year, 11, 31) - Date.UTC(+prev, 11, 31)) / 86_400_000,
			germany: { population: germany?.population ?? null },
			children: parts,
			// Corrections only matter when one of the two years was corrected
			notes: correctionNotes(
				parts.map((p) => p.id),
				region.id,
				[year, prev]
			),
			source: SOURCE
		},
		{ headers: { 'Cache-Control': 'public, max-age=3600' } }
	);
};
