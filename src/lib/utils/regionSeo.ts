/**
 * Build unique, indexable SEO text for a region page — without any data fetch.
 *
 * Region pages render chart snapshots with `textOnly: true`, which strips the
 * numeric placeholders. That makes the chart text near-identical across all
 * ~11k regions and is the main reason Google reports "crawled – currently not
 * indexed" (thin / duplicate content). These helpers compose per-region text
 * from fields that are already on the region record (name, type, Bundesland,
 * population, available data categories), so every page gets a distinct title,
 * meta description and intro paragraph at zero extra request cost.
 */

import { formatPopulation, formatArea } from '$lib/utils/formatters';

interface RegionParent {
	id?: string;
	name?: string;
	layer?: string;
	layer_label?: string;
}

export interface RegionLike {
	name?: string;
	layer_label?: string | null;
	population?: number | null;
	area?: number | null;
	parents?: RegionParent[] | null;
}

interface SectionLike {
	title?: string | null;
}

function joinList(items: string[], lang: string): string {
	if (items.length === 0) return '';
	if (items.length === 1) return items[0];
	const last = items[items.length - 1];
	const head = items.slice(0, -1).join(', ');
	return `${head} ${lang === 'en' ? 'and' : 'und'} ${last}`;
}

/** Name of the parent region with layer === 'state' (the Bundesland), if any. */
export function getStateName(region: RegionLike): string {
	return (region?.parents ?? []).find((p) => p?.layer === 'state')?.name ?? '';
}

/** Distinct, human-readable data categories from the region's config sections. */
export function getCategories(sections: SectionLike[] | null | undefined): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const s of sections ?? []) {
		const t = (s?.title ?? '').trim();
		if (t && !seen.has(t)) {
			seen.add(t);
			out.push(t);
		}
	}
	return out;
}

/** "Stadt in Bayern" / "city in Bavaria" — the locating phrase. */
function locationPhrase(region: RegionLike, lang: string): string {
	const typeLabel = (region?.layer_label ?? '').trim();
	const state = getStateName(region);
	const inWord = lang === 'en' ? 'in' : 'in';
	if (typeLabel && state) return `${typeLabel} ${inWord} ${state}`;
	if (state) return `${inWord} ${state}`;
	return typeLabel;
}

/**
 * Meta description (~150 chars). Distinct per region thanks to name, location,
 * population and the actual data categories available for that region.
 */
export function buildRegionDescription(
	region: RegionLike,
	sections: SectionLike[] | null | undefined,
	lang: string = 'de'
): string {
	const name = (region?.name ?? '').trim();
	const where = locationPhrase(region, lang);
	const pop = typeof region?.population === 'number' ? region.population : null;
	const cats = getCategories(sections).slice(0, 5);
	const catList = joinList(cats, lang);

	if (lang === 'en') {
		const popPart = pop ? ` with ${formatPopulation(pop)} inhabitants` : '';
		const dataPart = catList
			? ` Current climate data on ${catList}.`
			: ' Current climate and energy data.';
		return `${name}${where ? ', ' + where : ''}${popPart}.${dataPart}`.trim();
	}

	const popPart = pop ? ` mit ${formatPopulation(pop)} Einwohner:innen` : '';
	const dataPart = catList
		? ` Aktuelle Klimadaten zu ${catList}.`
		: ' Aktuelle Klima- und Energiedaten.';
	return `${name}${where ? ', ' + where : ''}${popPart}.${dataPart}`.trim();
}

/** Slightly longer intro paragraph for visible, indexable body text (SSR). */
export function buildRegionIntro(
	region: RegionLike,
	sections: SectionLike[] | null | undefined,
	lang: string = 'de'
): string {
	const name = (region?.name ?? '').trim();
	const where = locationPhrase(region, lang);
	const pop = typeof region?.population === 'number' ? region.population : null;
	const area = typeof region?.area === 'number' ? region.area : null;
	const cats = getCategories(sections);
	const catList = joinList(cats, lang);

	if (lang === 'en') {
		const facts: string[] = [];
		if (pop) facts.push(`${formatPopulation(pop)} inhabitants`);
		if (area) facts.push(`an area of ${formatArea(area)}`);
		const factPart = facts.length ? ` has ${joinList(facts, lang)}` : '';
		const dataPart = catList
			? ` On the Klimadashboard you find current data on ${catList} for ${name}.`
			: '';
		return `${name}${where ? `, ${where},` : ''}${factPart}.${dataPart}`.trim();
	}

	const facts: string[] = [];
	if (pop) facts.push(`${formatPopulation(pop)} Einwohner:innen`);
	if (area) facts.push(`eine Fläche von ${formatArea(area)}`);
	const factPart = facts.length ? ` hat ${joinList(facts, lang)}` : '';
	const dataPart = catList
		? ` Auf dem Klimadashboard findest du aktuelle Daten zu ${catList} für ${name}.`
		: '';
	return `${name}${where ? `, ${where},` : ''}${factPart}.${dataPart}`.trim();
}

/** Page <title>, e.g. "München – Klimadaten (Stadt in Bayern)". */
export function buildRegionTitle(region: RegionLike, lang: string = 'de'): string {
	const name = (region?.name ?? '').trim();
	const where = locationPhrase(region, lang);
	if (lang === 'en') {
		return where ? `${name} – Climate Data (${where})` : `${name} – Climate Data`;
	}
	return where ? `${name} – Klimadaten (${where})` : `${name} – Klimadaten`;
}
