// @ts-nocheck
import { convertObjectToArray } from './utils';

export const transformDataSingleCompany = (
	emissionsData,
	selectedCompany,
	selectedScopes,
	selectedScope2Category
) => {
	const emissionsPerYear = {};

	// Iterate over each item in the rawData
	emissionsData.forEach(({ year, company, scope, value, category }) => {
		if (
			company !== selectedCompany ||
			!selectedScopes.includes(scope) ||
			(scope === 2 && category !== selectedScope2Category)
		) {
			return;
		}

		// If the specific company has emission data for this year, merge it
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year }; // Initialize if not present
		}
		if (!value) {
			emissionsPerYear[year][scope] = 'na';
		} else {
			emissionsPerYear[year][scope] = parseInt(value); // Merge scope data
		}
	});
	return convertObjectToArray(emissionsPerYear);
};

export const transformDataMultipleCompanies = (
	emissionsData,
	selectedCompanies,
	selectedScopes,
	selectedScope2Category
) => {
	const emissionsPerYear = {};

	emissionsData.forEach(({ year, company, scope, value, category }) => {
		// Skip items that are not included in the companies array
		if (
			!selectedCompanies.includes(company) ||
			!selectedScopes.includes(scope) ||
			// TODO: Add logic to filter by category! location and market based should not be mixed!
			(scope === 2 && category !== selectedScope2Category)
		) {
			return;
		}

		// Initialize the emissions data object for the year if it does not exist
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year };
		}

		if (!value) {
			emissionsPerYear[year][company] = 'na';
		} else if (!emissionsPerYear[year][company]) {
			emissionsPerYear[year][company] = parseInt(value); // TODO: check why directus returns string instead of integer!
		} else if (value && emissionsPerYear[year][company] !== 'na') {
			emissionsPerYear[year][company] += parseInt(value);
		}
	});

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	return convertObjectToArray(emissionsPerYear);
};
