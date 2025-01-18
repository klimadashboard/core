import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { flattenCompanies } from './utils';

// NOTE: Use these filters to filter directly via the API call,
// instead of fetching all data and filtering client side:
// filter: {
// 	company: {
// 		_in: filterCompanies
// 	},
// 	scope: { _in: filterScopes.map((scope) => `scope${scope}`) }
// },

const directus = getDirectusInstance(fetch);

export const getCompanyEmissionData = async () => {
	const data = await directus.request(
		readItems('companies_emissions', {
			fields: ['year', 'company', 'scope', 'value', 'category'],

			limit: -1
		})
	);
	return data;
};

export const getCompanyMetaData = async () => {
	const data = await directus.request(
		readItems('companies', {
			fields: [
				'name',
				'logo.id',
				'sectors.companies_sectors_id.name',
				'sectors.companies_sectors_id.icon'
			],
			sort: ['sectors.companies_sectors_id.name', 'name'],
			limit: -1
		})
	);
	return flattenCompanies(data);
};

export const getAllSectors = async () => {
	const sectors = await directus.request(
		readItems('companies_sectors', {
			fields: ['name', 'icon'],
			sort: ['name']
		})
	);
	return sectors;
};
