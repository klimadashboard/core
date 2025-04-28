import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';

export const getDataForSelectedRegion = async (region) => {
	const directus = getDirectusInstance(fetch);
	const rawData = await directus.request(
		readItems('energy_heating_systems', {
			filter: {
				region: {
					_eq: region
				}
			}
		})
	);
	const data = rawData.map((d) => ({
		...d,
		percentage: (d.value / rawData.find((d) => d.category == 'total')?.value) * 100
	}));
	return data;
};
