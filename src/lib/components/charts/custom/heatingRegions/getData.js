// getData.js
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';

// NOTE: The `region` field in Directus is assumed to store the municipality `code`.
// If it stores IDs instead, swap `.code` for `.id` below.

function getChildMunicipalities(regions, districtId) {
	return regions.filter(
		(r) =>
			r.layer === 'municipality' &&
			Array.isArray(r.parents) &&
			r.parents.some((p) => p.id === districtId && p.layer === 'district')
	);
}

export const getDataForSelectedRegion = async (regionObj, allRegions) => {
	const directus = getDirectusInstance(fetch);

	// If a district: collect all municipalities and query them in one go
	if (regionObj?.layer === 'district') {
		const children = getChildMunicipalities(allRegions, regionObj.id);
		const muniCodes = children.map((c) => c.code);

		if (muniCodes.length === 0) return [];

		const rawData = await directus.request(
			readItems('energy_heating_systems', {
				filter: { region: { _in: muniCodes } },
				limit: -1 // fetch all rows
			})
		);

		// Sum values per category across municipalities
		const sums = new Map();
		for (const row of rawData) {
			const key = row.category;
			sums.set(key, (sums.get(key) ?? 0) + (Number(row.value) || 0));
		}

		const total = sums.get('total') ?? 0;
		const data = Array.from(sums.entries()).map(([category, value]) => ({
			category,
			value,
			percentage: total ? (value / total) * 100 : null
		}));

		return data.sort((a, b) => (a.category === 'total' ? -1 : b.category === 'total' ? 1 : 0));
	}

	// Default: municipality (existing behavior)
	const rawData = await directus.request(
		readItems('energy_heating_systems', {
			filter: { region: { _eq: regionObj?.code ?? regionObj } } // supports passing object or code
		})
	);

	const total = rawData.find((d) => d.category === 'total')?.value ?? 0;
	const data = rawData.map((d) => ({
		...d,
		percentage: total ? (d.value / total) * 100 : null
	}));

	return data;
};
