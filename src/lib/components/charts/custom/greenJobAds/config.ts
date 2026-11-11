// $lib/components/charts/custom/greenJobAds/config.ts
// Share of job ads with a green economy reference per Kreis (`economy_green_job_ads`, IW Jobmonitor).
// Data exist for districts only; every other region is shown through its districts:
// - country, state, aggregate (Metropolregion, …): ranking of its districts (districts whose
//   `parents` contain the region; country: all of them)
// - district: ranking of the districts of its state, the district highlighted
// - municipality: as its district
// The source has no numbers of job ads, so all averages are unweighted means of the districts.
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import { readItem, readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { isShownOnPage } from '$lib/utils/regionAggregation';
import { formatNumber } from '$lib/utils/formatters';

type Parent = { id: string; layer: string };

export interface District {
	id: string;
	code: string;
	name: string;
	layerLabel: string | null;
	share: number;
	parents: Parent[];
	/** rank among all districts of the country (1 = highest share) */
	rank: number;
}

export interface Reference {
	id: string;
	name: string;
	layer: string;
	/** unweighted mean of its districts */
	share: number;
	count: number;
}

export interface GreenJobAdsData {
	year: number;
	source: string;
	/** the page region (municipalities: their district) */
	regionId: string;
	regionName: string;
	/** districts of the ranking, highest share first */
	members: District[];
	/** states of the country, only for the country page */
	states: Reference[];
	/** the region itself (unless a district), its parents with data and the country, largest last */
	references: Reference[];
	/** the page region itself if it is a district */
	district: District | null;
	/** all districts with data in the country */
	total: number;
	/** set when the page region has no data of its own and is shown through its district */
	shownAs: string | null;
}

const mean = (xs: District[]) => xs.reduce((s, d) => s + d.share, 0) / (xs.length || 1);
const membersOf = (all: District[], id: string) => all.filter((d) => d.parents.some((p) => p.id === id));

export async function loadGreenJobAds(
	fetch: typeof globalThis.fetch,
	regionId: string | null
): Promise<GreenJobAdsData | null> {
	if (!regionId) return null;
	const directus = getDirectusInstance(fetch);

	const [rows, page] = await Promise.all([
		directus.request(
			readItems('economy_green_job_ads', {
				filter: { category: { _eq: 'total' } },
				fields: ['year', 'share', 'source', { region: ['id', 'code', 'name', 'layer_label', 'parents'] }],
				limit: -1
			})
		) as Promise<any[]>,
		directus.request(
			readItem('regions', regionId, { fields: ['id', 'name', 'layer', 'country', 'parents', 'visible'] })
		) as Promise<any>
	]);
	if (!rows.length || !page) return null;

	const year = Math.max(...rows.map((r) => r.year));
	const latest = rows.filter((r) => r.year === year && r.region);
	const all: District[] = latest
		.map((r) => ({
			id: r.region.id,
			code: r.region.code,
			name: r.region.name,
			layerLabel: r.region.layer_label,
			share: r.share,
			parents: r.region.parents ?? [],
			rank: 0
		}))
		.sort((a, b) => b.share - a.share);
	all.forEach((d, i) => (d.rank = i + 1));

	// municipalities: show their district
	let region = page;
	let shownAs: string | null = null;
	if (page.layer === 'municipality') {
		const districtId = (page.parents ?? []).find((p: Parent) => p.layer === 'district')?.id;
		const district = all.find((d) => d.id === districtId);
		if (!district) return null;
		region = { id: district.id, name: district.name, layer: 'district', parents: district.parents };
		shownAs = district.name;
	}

	const district = region.layer === 'district' ? (all.find((d) => d.id === region.id) ?? null) : null;
	const stateId = (region.parents ?? []).find((p: Parent) => p.layer === 'state')?.id;
	let members: District[];
	if (region.layer === 'country') members = all;
	else if (region.layer === 'district') members = stateId ? membersOf(all, stateId) : [];
	else members = membersOf(all, region.id);
	if (!members.length) return null;

	// names of the regions referenced: parents of the region (or all states on the country page)
	const parentIds: string[] =
		region.layer === 'country'
			? [...new Set(all.flatMap((d) => d.parents.filter((p) => p.layer === 'state').map((p) => p.id)))]
			: (region.parents ?? []).map((p: Parent) => p.id);
	const [named, country] = await Promise.all([
		parentIds.length
			? (directus.request(
					readItems('regions', {
						filter: { id: { _in: parentIds } },
						fields: ['id', 'name', 'layer', 'visible'],
						limit: -1
					})
				) as Promise<any[]>)
			: Promise.resolve([]),
		region.layer === 'country'
			? Promise.resolve(region)
			: (directus.request(
					readItems('regions', {
						filter: { layer: { _eq: 'country' }, country: { _eq: page.country } },
						fields: ['id', 'name', 'layer']
					})
				).then((r: any[]) => r[0]) as Promise<any>)
	]);

	const reference = (r: { id: string; name: string; layer: string }, ds: District[]): Reference => ({
		id: r.id,
		name: r.name,
		layer: r.layer,
		share: mean(ds),
		count: ds.length
	});

	const references: Reference[] = [];
	if (region.layer !== 'district' && region.layer !== 'country') references.push(reference(region, members));
	if (region.layer !== 'country') {
		for (const p of named) {
			if (!isShownOnPage(p, page.id)) continue;
			const ds = membersOf(all, p.id);
			if (ds.length) references.push(reference(p, ds));
		}
	}
	if (country) references.push(reference(country, all));

	const states =
		region.layer === 'country'
			? named
					.filter((s) => s.layer === 'state')
					.map((s) => reference(s, membersOf(all, s.id)))
					.filter((s) => s.count)
					.sort((a, b) => b.share - a.share)
			: [];

	return {
		year,
		source: latest[0].source,
		regionId: region.id,
		regionName: region.name,
		members,
		states,
		references: references.sort((a, b) => a.count - b.count),
		district,
		total: all.length,
		shownAs
	};
}

export function buildChartData(data: GreenJobAdsData): ChartData {
	const columns: TableColumn[] = [
		{ key: 'name', label: 'Region', align: 'left' },
		{ key: 'type', label: 'Art', align: 'left' },
		{ key: 'share', label: 'Anteil Stellenanzeigen Green Economy (%)', align: 'right', format: (v: number) => formatNumber(v, 1) },
		{ key: 'rank', label: `Rang in Deutschland (von ${data.total})`, align: 'right', format: (v: number | null) => (v == null ? '' : String(v)) }
	];
	const rows = [
		...data.references.map((r) => ({
			name: r.name,
			type: `Durchschnitt von ${r.count} Kreisen (ungewichtet)`,
			share: r.share,
			rank: null
		})),
		...data.members.map((d) => ({ name: d.name, type: d.layerLabel ?? 'Kreis', share: d.share, rank: d.rank }))
	];
	const own = data.district ?? data.references[0];
	const country = data.references.at(-1)!;
	const top = data.members[0];
	const bottom = data.members.at(-1)!;
	return {
		raw: rows,
		table: { columns, rows, filename: `green-economy-stellenanzeigen-${data.year}` },
		placeholders: {
			year: data.year,
			source: data.source,
			regionName: data.regionName,
			share: formatNumber(own.share, 1),
			rank: data.district?.rank ?? '',
			total: data.total,
			countryShare: formatNumber(country.share, 1),
			count: data.members.length,
			topRegion: top.name,
			topShare: formatNumber(top.share, 1),
			bottomRegion: bottom.name,
			bottomShare: formatNumber(bottom.share, 1),
			aboveCountry: data.members.filter((d) => d.share > country.share).length,
			// one flag per text variant (the CMS templates only know {{#if key}})
			isDistrict: !!data.district,
			isCountry: !data.district && data.references.length === 1,
			isRegion: !data.district && data.references.length > 1
		},
		meta: { source: data.source, updateDate: String(data.year) }
	};
}

export async function fetchChartData({ fetch, regionId }: ChartFetchParams): Promise<ChartData | null> {
	const data = await loadGreenJobAds(fetch, regionId);
	return data ? buildChartData(data) : null;
}
