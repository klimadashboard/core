import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { safeParseMobilityRenewableShareData, safeParseCountriesData } from './schema';

const directus = getDirectusInstance(fetch);

export const getMobilityRenewableShare = async () => {
	const data = await directus.request(
		readItems('mobility', {
			fields: ['period', 'region', 'value'],
			filter: {
				category: {
					_eq: 'share_renewable'
				}
			},
			limit: -1
		})
	);
	const result = safeParseMobilityRenewableShareData(data);
	if (!result.success) {
		console.error('Validation error in getMobilityRenewableShare:', result.error);
	}
	return result.success ? result.data : [];
};

export const getCountries = async () => {
	const data = await directus.request(
		readItems('countries', {
			fields: ['id', 'name_de'],
			limit: -1
		})
	);
	const result = safeParseCountriesData(data);
	if (!result.success) {
		console.error('Validation error in getCountries:', result.error);
	}
	return result.success ? result.data : [];
};
