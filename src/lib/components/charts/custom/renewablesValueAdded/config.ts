// $lib/components/charts/custom/renewablesValueAdded/config.ts
// Regional value added by wind and solar power per Kreis (BI, IÖW & IW Consult 2026), from a CSV in
// Directus files (long table: region, country, period, category, value, unit, source, update).
// Categories: <wind|pv_rooftop|pv_groundmounted|total>_<minimum|potential>, periods 2023 and 2033.
// Data exist for districts only; every other region is shown through its districts:
// - country, state, aggregate (Metropolregion, …): ranking of its districts (country: all of them)
// - district: ranking of the districts of its state, the district highlighted
// - municipality: as its district
// Values are absolute (Mio. Euro), so regions are the sums of their districts.
import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import Papa from 'papaparse';
import { readItem, readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { isShownOnPage } from '$lib/utils/regionAggregation';
import { formatNumber } from '$lib/utils/formatters';

const DIRECTUS = 'https://base.klimadashboard.org';
const DEFAULT_CSV = '2bc42ed5-0d0d-4ef0-8ac3-364de105d526';

export const TECHS = ['wind', 'pv_rooftop', 'pv_groundmounted'] as const;
export type Tech = (typeof TECHS)[number];
export type Scenario = 'minimum' | 'potential';

export const TECH_LABELS: Record<Tech, string> = {
	wind: 'Windkraft',
	pv_rooftop: 'Photovoltaik Dach',
	pv_groundmounted: 'Photovoltaik Freifläche'
};
export const SCENARIO_LABELS: Record<Scenario, string> = { minimum: 'Mindestwert', potential: 'Potenzial' };

type Parent = { id: string; layer: string };
/** values per technology plus total, in Mio. Euro */
export type Values = Record<Tech | 'total', number>;
/** key: `${period}_${scenario}` */
export type Series = Record<string, Values>;

export interface District {
	id: string;
	name: string;
	layerLabel: string | null;
	parents: Parent[];
	values: Series;
}

export interface Reference {
	id: string;
	name: string;
	layer: string;
	values: Series;
	count: number;
}

export interface ValueAddedData {
	periods: number[];
	source: string;
	unit: string;
	regionId: string;
	regionName: string;
	/** districts of the ranking */
	members: District[];
	/** states of the country, only for the country page */
	states: Reference[];
	/** the region itself (unless a district), its parents with data and the country, largest last */
	references: Reference[];
	/** the page region itself if it is a district */
	district: District | null;
	/** all districts with data in the country (for ranks) */
	all: District[];
	/** number of districts with data in the country */
	total: number;
	/** set when the page region has no data of its own and is shown through its district */
	shownAs: string | null;
}

export const key = (period: number, scenario: Scenario) => `${period}_${scenario}`;
const empty = (): Values => ({ wind: 0, pv_rooftop: 0, pv_groundmounted: 0, total: 0 });

function sum(ds: District[]): Series {
	const out: Series = {};
	for (const d of ds)
		for (const [k, v] of Object.entries(d.values)) {
			const acc = (out[k] ??= empty());
			for (const f of Object.keys(acc) as (keyof Values)[]) acc[f] += v[f];
		}
	return out;
}
const membersOf = (all: District[], id: string) => all.filter((d) => d.parents.some((p) => p.id === id));

/** rank of every district in the country (1 = highest total) for one period and scenario */
export function ranks(all: District[], period: number, scenario: Scenario): Map<string, number> {
	const k = key(period, scenario);
	return new Map(
		[...all].sort((a, b) => (b.values[k]?.total ?? 0) - (a.values[k]?.total ?? 0)).map((d, i) => [d.id, i + 1])
	);
}

interface CsvRow {
	region: string;
	period: number;
	category: string;
	value: number;
	unit: string;
	source: string;
}

export async function loadValueAdded(
	fetch: typeof globalThis.fetch,
	regionId: string | null,
	fileId: string = DEFAULT_CSV
): Promise<ValueAddedData | null> {
	if (!regionId) return null;
	const directus = getDirectusInstance(fetch);

	// Assets are cached for 30 days; versioning the URL with `modified_on` shows a replaced file right away.
	const file = await fetch(`${DIRECTUS}/files/${fileId}?fields=modified_on`)
		.then((r) => (r.ok ? r.json() : null))
		.catch(() => null);
	const version = encodeURIComponent(file?.data?.modified_on ?? '');
	const [res, page] = await Promise.all([
		fetch(`${DIRECTUS}/assets/${fileId}${version ? `?v=${version}` : ''}`),
		directus.request(
			readItem('regions', regionId, { fields: ['id', 'name', 'layer', 'country', 'parents', 'visible'] })
		) as Promise<any>
	]);
	if (!res.ok) throw new Error(`CSV ${res.status}`);
	const parsed: CsvRow[] = Papa.parse((await res.text()).replace(/^﻿/, ''), {
		header: true,
		dynamicTyping: true,
		skipEmptyLines: true
	}).data;
	const csv = parsed.filter((r) => r.region && r.value != null);
	if (!csv.length || !page) return null;

	// values per district
	const byRegion = new Map<string, Series>();
	for (const r of csv) {
		const m = String(r.category).match(/^(wind|pv_rooftop|pv_groundmounted|total)_(minimum|potential)$/);
		if (!m) continue;
		const series = byRegion.get(r.region) ?? {};
		byRegion.set(r.region, series);
		(series[key(r.period, m[2] as Scenario)] ??= empty())[m[1] as keyof Values] = r.value;
	}
	const periods = [...new Set(csv.map((r) => r.period))].sort();

	// all districts of the country (an `_in` filter with 400 ids makes the URL too long)
	const regions = (await directus.request(
		readItems('regions', {
			filter: { layer: { _eq: 'district' }, country: { _eq: page.country } },
			fields: ['id', 'name', 'layer_label', 'parents'],
			limit: -1
		})
	)) as any[];
	const all: District[] = regions.filter((r) => byRegion.has(r.id)).map((r) => ({
		id: r.id,
		name: r.name,
		layerLabel: r.layer_label,
		parents: r.parents ?? [],
		values: byRegion.get(r.id)!
	}));

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
			: (directus
					.request(
						readItems('regions', {
							filter: { layer: { _eq: 'country' }, country: { _eq: page.country } },
							fields: ['id', 'name', 'layer']
						})
					)
					.then((r: any[]) => r[0]) as Promise<any>)
	]);

	const reference = (r: { id: string; name: string; layer: string }, ds: District[]): Reference => ({
		id: r.id,
		name: r.name,
		layer: r.layer,
		values: sum(ds),
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
			: [];

	return {
		periods,
		source: csv[0].source,
		unit: csv[0].unit,
		regionId: region.id,
		regionName: region.name,
		members,
		states,
		references: references.sort((a, b) => a.count - b.count),
		district,
		all,
		total: all.length,
		shownAs
	};
}

const fmt = (v: number) => formatNumber(v, 1);

export function buildChartData(data: ValueAddedData): ChartData {
	const columns: TableColumn[] = [
		{ key: 'name', label: 'Region', align: 'left' },
		{ key: 'type', label: 'Art', align: 'left' },
		{ key: 'period', label: 'Jahr', align: 'right' },
		{ key: 'scenario', label: 'Szenario', align: 'left' },
		...TECHS.map((t) => ({ key: t, label: `${TECH_LABELS[t]} (${data.unit})`, align: 'right' as const, format: fmt })),
		{ key: 'total', label: `Summe (${data.unit})`, align: 'right', format: fmt }
	];
	const rowsOf = (name: string, type: string, values: Series) =>
		data.periods.flatMap((p) =>
			(['minimum', 'potential'] as Scenario[]).map((s) => ({
				name,
				type,
				period: p,
				scenario: SCENARIO_LABELS[s],
				...(values[key(p, s)] ?? empty())
			}))
		);
	const rows = [
		...data.references.flatMap((r) => rowsOf(r.name, `Summe von ${r.count} Kreisen`, r.values)),
		...[...data.members]
			.sort((a, b) => a.name.localeCompare(b.name, 'de'))
			.flatMap((d) => rowsOf(d.name, d.layerLabel ?? 'Kreis', d.values))
	];

	const now = data.periods[0];
	const future = data.periods.at(-1)!;
	const own = (data.district ?? data.references[0]).values;
	const rank = data.district ? ranks(data.all, now, 'minimum').get(data.district.id) : undefined;
	const nowMin = own[key(now, 'minimum')];
	const nowPot = own[key(now, 'potential')];
	const futMin = own[key(future, 'minimum')];
	const futPot = own[key(future, 'potential')];
	const byNow = [...data.members].sort(
		(a, b) => (b.values[key(now, 'minimum')]?.total ?? 0) - (a.values[key(now, 'minimum')]?.total ?? 0)
	);
	const top = byNow[0];
	// "Ansbach" is a Landkreis and a kreisfreie Stadt: name the kind where the name is ambiguous
	const topName =
		top.layerLabel && data.all.some((d) => d.name === top.name && d.id !== top.id)
			? `${top.name} (${top.layerLabel})`
			: top.name;
	const largestTech = TECHS.reduce((a, b) => (nowMin[b] > nowMin[a] ? b : a));

	return {
		raw: rows,
		table: { columns, rows, filename: `regionale-wertschoepfung-erneuerbare-${now}-${future}` },
		placeholders: {
			year: now,
			futureYear: future,
			source: data.source,
			unit: data.unit,
			regionName: data.regionName,
			min: fmt(nowMin.total),
			pot: fmt(nowPot.total),
			futureMin: fmt(futMin.total),
			futurePot: fmt(futPot.total),
			growth: formatNumber((futMin.total / nowMin.total - 1) * 100, 0),
			largestTech: TECH_LABELS[largestTech],
			largestTechShare: formatNumber((nowMin[largestTech] / nowMin.total) * 100, 0),
			rank: rank ?? '',
			total: data.total,
			count: data.members.length,
			topRegion: topName,
			topValue: fmt(top.values[key(now, 'minimum')].total),
			// one flag per text variant (the CMS templates only know {{#if key}})
			isDistrict: !!data.district,
			isCountry: !data.district && data.references.length === 1,
			isRegion: !data.district && data.references.length > 1
		},
		meta: { source: data.source, updateDate: '2026' }
	};
}

export async function fetchChartData({ fetch, regionId, chartConfig }: ChartFetchParams): Promise<ChartData | null> {
	const data = await loadValueAdded(fetch, regionId, chartConfig?.csv ?? DEFAULT_CSV);
	return data ? buildChartData(data) : null;
}
