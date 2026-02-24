// src/lib/utils/findMatchingRegion.js

export function findMatchingRegion(page, regions, returnRegion = false) {
	if (!page || !regions || regions.length === 0) return null;

	const pageId = page.id;
	const parentIds = page.parents ? page.parents.map((p) => p.id) : [];

	// Create a Set for quick lookup
	const idsToCheck = [pageId, ...parentIds];
	const idOrder = new Map(idsToCheck.map((id, index) => [id, index]));

	let bestMatch = null;
	let bestOrder = Infinity;

	for (const region of regions) {
		const order = idOrder.get(region.id);
		if (order !== undefined && order < bestOrder) {
			bestMatch = region;
			bestOrder = order;
			if (order === 0) break; // Exact page ID match found, no need to continue
		}
	}

	return bestMatch ? (returnRegion ? bestMatch : bestMatch.code) : null;
}
