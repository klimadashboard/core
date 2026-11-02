import { page } from '$app/state';
import { browser } from '$app/environment';

export interface Region {
	id: string;
	code: string;
	codeShort?: string;
	name: string;
	layer: 'country' | 'state' | 'district' | 'municipality' | 'metropolitan_region' | 'group';
	layer_label?: string;
	country?: string;
	center: [string, string];
	area_km2?: number;
	population?: number;
	parents?: Array<{ id: string; layer: string; name?: string; layer_label?: string }>;
}

// ---------------------------------------------------------------------------
// Region cache + in-flight deduplication.
//
// A region page renders many chart components and each one calls getRegion()
// for the same region, so without this every render fanned out one Directus
// request per component. Regions change very rarely, so a short TTL is plenty.
// ---------------------------------------------------------------------------
const REGION_TTL = 10 * 60 * 1000; // 10 minutes
const regionCache = new Map<string, { data: Region | null; expires: number }>();
const regionInflight = new Map<string, Promise<Region | null>>();

/**
 * Get region ID from URL query parameter
 * Works both on server and client by using page store
 */
export function getRegionIdFromUrl(): string | null {
	// Use page store which works on both server and client
	const urlRegionId = page?.url?.searchParams?.get('region');
	if (urlRegionId) return urlRegionId;

	// Fallback for client-side only
	if (browser) {
		const urlParams = new URLSearchParams(window.location.search);
		const regionParam = urlParams.get('region');
		if (regionParam) return regionParam;
	}

	return null;
}

/**
 * Get region ID from multiple sources in order of priority:
 * 1. Explicitly passed regionId prop
 * 2. URL query parameter (?region=ID)
 * 3. Page data (page.data.page)
 */
export function getRegionId(propsRegionId?: string | null): string | null {
	// 1. Use explicitly passed prop if available
	if (propsRegionId) return propsRegionId;

	// 2. Check URL query parameter (works on server and client via page store)
	const urlRegionId = getRegionIdFromUrl();
	if (urlRegionId) return urlRegionId;

	// 3. Fall back to page data
	const pageRegion = page?.data?.page;
	if (pageRegion?.id) return pageRegion.id;

	return null;
}

/**
 * Get region data from page context if available
 */
export function getRegionFromPage(): Region | null {
	const pageRegion = page?.data?.page;

	if (pageRegion && pageRegion.code) {
		return {
			id: pageRegion.id,
			code: pageRegion.code,
			codeShort: pageRegion.codeShort,
			name: pageRegion.name,
			layer: pageRegion.layer,
			layer_label: pageRegion.layer_label,
			country: pageRegion.country,
			center: pageRegion.center,
			area_km2: pageRegion.area_km2,
			population: pageRegion.population,
			parents: pageRegion.parents
		};
	}

	return null;
}

/**
 * Fetch region data from Directus by ID.
 *
 * Results are cached and concurrent calls for the same region share one
 * request, so a page full of chart components causes a single Directus call.
 * A failed fetch is not cached, so the next render retries.
 */
export async function fetchRegion(regionId: string): Promise<Region | null> {
	const cached = regionCache.get(regionId);
	if (cached && Date.now() < cached.expires) return cached.data;

	const existing = regionInflight.get(regionId);
	if (existing) return existing;

	const request = fetchRegionUncached(regionId)
		.then((region) => {
			// Only cache successes — a 503 from base must not stick around.
			if (region) regionCache.set(regionId, { data: region, expires: Date.now() + REGION_TTL });
			return region;
		})
		.catch((error) => {
			console.error('[getRegion] Error fetching region:', error);
			return null;
		})
		.finally(() => regionInflight.delete(regionId));

	regionInflight.set(regionId, request);
	return request;
}

async function fetchRegionUncached(regionId: string): Promise<Region | null> {
	try {
		// Fetch from Directus regions table by ID
		const url = `https://base.klimadashboard.org/items/regions/${regionId}`;

		const response = await fetch(url);

		if (!response.ok) {
			console.error('[getRegion] Failed to fetch region:', response.status, response.statusText);
			return null;
		}

		const result = await response.json();

		const data = result.data;

		if (!data || !data.code) {
			console.error('[getRegion] Invalid region data received:', data);
			return null;
		}

		// Enrich parent regions with name and layer_label
		// (parents is a JSON field storing only {id, layer})
		let enrichedParents = data.parents;
		if (Array.isArray(data.parents) && data.parents.length > 0) {
			try {
				const parentIds = data.parents.map((p: any) => p.id).filter(Boolean);
				const parentsUrl = `https://base.klimadashboard.org/items/regions?filter[id][_in]=${parentIds.join(',')}&fields=id,name,layer,layer_label`;
				const parentsResponse = await fetch(parentsUrl);
				if (parentsResponse.ok) {
					const parentsResult = await parentsResponse.json();
					const parentDetails = parentsResult.data || [];
					enrichedParents = data.parents.map((p: any) => {
						const details = parentDetails.find((d: any) => d.id === p.id);
						return {
							...p,
							name: details?.name || p.name,
							layer_label: details?.layer_label || p.layer_label
						};
					});
				}
			} catch (e) {
				// Non-critical: continue with original parents
				console.error('[getRegion] Failed to enrich parent regions:', e);
			}
		}

		const region: Region = {
			id: data.id,
			code: data.code,
			codeShort: data.code_short,
			name: data.name,
			layer: data.layer,
			layer_label: data.layer_label,
			country: data.country,
			center: data.center,
			area_km2: data.area_km2,
			population: data.population,
			parents: enrichedParents
		};

		return region;
	} catch (error) {
		console.error('[getRegion] Error fetching region:', error);
		return null;
	}
}

/**
 * Get region data - tries page data first, then fetches from API if needed
 */
export async function getRegion(regionId?: string | null): Promise<Region | null> {
	const effectiveRegionId = getRegionId(regionId);

	if (!effectiveRegionId) return null;

	// Check if region is already in page data and matches
	const pageRegion = getRegionFromPage();
	if (pageRegion && pageRegion.id === effectiveRegionId) return pageRegion;

	// Fetch from API
	return fetchRegion(effectiveRegionId);
}

/**
 * "Salzburg (Bundesland)" for disambiguation, but not "Metropolregion X (Metropolregion)":
 * the label is skipped when the name already contains it.
 */
export function withLayerLabel(name: string, layerLabel?: string | null): string {
	if (!layerLabel || name.toLowerCase().includes(layerLabel.toLowerCase())) return name;
	return `${name} (${layerLabel})`;
}
