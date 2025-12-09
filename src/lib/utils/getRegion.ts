import { page } from '$app/state';
import { browser } from '$app/environment';

export interface Region {
	id: string;
	code: string;
	codeShort?: string;
	name: string;
	layer: 'country' | 'state' | 'district' | 'municipality';
	center: [string, string];
	area_km2?: number;
	population?: number;
	parents?: Array<{ id: string; layer: string }>;
}

/**
 * Get region ID from URL query parameter
 * Works both on server and client by using page store
 */
export function getRegionIdFromUrl(): string | null {
	console.log('[getRegion] Checking URL for region param...');

	// Use page store which works on both server and client
	const urlRegionId = page?.url?.searchParams?.get('region');
	if (urlRegionId) {
		console.log('[getRegion] Found region in page.url.searchParams:', urlRegionId);
		return urlRegionId;
	}

	// Fallback for client-side only
	if (browser) {
		const urlParams = new URLSearchParams(window.location.search);
		const regionParam = urlParams.get('region');
		if (regionParam) {
			console.log('[getRegion] Found region in window.location:', regionParam);
			return regionParam;
		}
	}

	console.log('[getRegion] No region found in URL');
	return null;
}

/**
 * Get region ID from multiple sources in order of priority:
 * 1. Explicitly passed regionId prop
 * 2. URL query parameter (?region=ID)
 * 3. Page data (page.data.page)
 */
export function getRegionId(propsRegionId?: string | null): string | null {
	console.log('[getRegion] getRegionId called with prop:', propsRegionId);

	// 1. Use explicitly passed prop if available
	if (propsRegionId) {
		console.log('[getRegion] Using prop regionId:', propsRegionId);
		return propsRegionId;
	}

	// 2. Check URL query parameter (works on server and client via page store)
	const urlRegionId = getRegionIdFromUrl();
	if (urlRegionId) {
		return urlRegionId;
	}

	// 3. Fall back to page data
	const pageRegion = page?.data?.page;
	if (pageRegion?.id) {
		console.log('[getRegion] Using page.data.page.id:', pageRegion.id);
		return pageRegion.id;
	}

	console.log('[getRegion] No region ID found from any source');
	return null;
}

/**
 * Get region data from page context if available
 */
export function getRegionFromPage(): Region | null {
	console.log('[getRegion] Checking page.data.page...');
	const pageRegion = page?.data?.page;

	if (pageRegion && pageRegion.code) {
		console.log('[getRegion] Found region in page data:', pageRegion.name);
		return {
			id: pageRegion.id,
			code: pageRegion.code,
			codeShort: pageRegion.codeShort,
			name: pageRegion.name,
			layer: pageRegion.layer,
			center: pageRegion.center,
			area_km2: pageRegion.area_km2,
			population: pageRegion.population,
			parents: pageRegion.parents
		};
	}

	console.log('[getRegion] No region in page data');
	return null;
}

/**
 * Fetch region data from Directus by ID
 */
export async function fetchRegion(regionId: string): Promise<Region | null> {
	console.log('[getRegion] fetchRegion called with ID:', regionId);

	try {
		// Fetch from Directus regions table by ID
		const url = `https://base.klimadashboard.org/items/regions/${regionId}`;
		console.log('[getRegion] Fetching from:', url);

		const response = await fetch(url);

		if (!response.ok) {
			console.error('[getRegion] Failed to fetch region:', response.status, response.statusText);
			return null;
		}

		const result = await response.json();
		console.log('[getRegion] Directus response:', result);

		const data = result.data;

		if (!data || !data.code) {
			console.error('[getRegion] Invalid region data received:', data);
			return null;
		}

		const region: Region = {
			id: data.id,
			code: data.code,
			codeShort: data.code_short,
			name: data.name,
			layer: data.layer,
			center: data.center,
			area_km2: data.area_km2,
			population: data.population,
			parents: data.parents
		};

		console.log('[getRegion] Returning region:', region.name, region.codeShort);
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
	console.log('[getRegion] getRegion called with:', regionId);

	const effectiveRegionId = getRegionId(regionId);
	console.log('[getRegion] Effective region ID:', effectiveRegionId);

	if (!effectiveRegionId) {
		console.log('[getRegion] No effective region ID, returning null');
		return null;
	}

	// Check if region is already in page data and matches
	const pageRegion = getRegionFromPage();
	if (pageRegion && pageRegion.id === effectiveRegionId) {
		console.log('[getRegion] Using region from page data');
		return pageRegion;
	}

	// Fetch from API
	console.log('[getRegion] Fetching region from API...');
	return fetchRegion(effectiveRegionId);
}
