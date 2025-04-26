import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';
import { flattenCompanies } from './utils';
import { parseCompanyEmission, parseCompanyMetaData, parseSectors, type Company } from './schema';

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
			fields: ['year', 'company', 'scope', 'value', 'category', 'source'],

			limit: -1
		})
	);
	return parseCompanyEmission(data);
};

export const getCompanyMetaData = async () => {
	const data = await directus.request(
		readItems('companies', {
			fields: [
				'id',
				'name',
				'logo.id',
				'sectors.companies_sectors_id.name',
				'sectors.companies_sectors_id.icon',
				'climate_neutrality_goal',
				'climate_neutrality_scopes',
				'member_sbt'
			],
			sort: ['sectors.companies_sectors_id.name', 'name'],
			limit: -1
		})
	);

	// Flatten data for easier usage in the chart components
	const flattenedData = flattenCompanies(data as Company[]);

	// Parse data against zod schema and return typed data
	return parseCompanyMetaData(flattenedData);
};

export const getAllSectors = async () => {
	const sectors = await directus.request(
		readItems('companies_sectors', {
			fields: ['name', 'icon'],
			sort: ['name']
		})
	);
	return parseSectors(sectors);
};
