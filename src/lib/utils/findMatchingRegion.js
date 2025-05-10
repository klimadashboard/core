// src/lib/utils/findMatchingRegion.js

export function findMatchingRegion(page, regions, returnRegion = false) {
	if (!page || !regions || regions.length === 0) return null;

	const pageId = page.id;
	const parentIds = page.parents ? page.parents.map((p) => p.id) : [];

	// List of IDs to check: page itself + its parents
	const idsToCheck = [pageId, ...parentIds];

	// Try to find a matching region
	const match = regions.find((region) => idsToCheck.includes(region.id));

	return match ? (returnRegion ? match : match.code) : null;
}
