import { convertObjectToArray, type EmissionsYearRecord } from './utils';
import type { CompanyEmissionArray } from './types';

// Define the emissions per year object type
type EmissionsPerYear = Record<number, EmissionsYearRecord>;

// Parse a raw value, returning null for anything that is not a usable number
const parseValue = (value: string | null) => {
	if (value === null || value === '') return null;
	const parsed = parseInt(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export const transformDataSingleCompany = (
	emissionsData: CompanyEmissionArray,
	selectedCompany: string,
	selectedScopes: number[],
	selectedScope2Category: string
) => {
	const emissionsPerYear: EmissionsPerYear = {};

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
		emissionsPerYear[year][scope] = parseValue(value); // Merge scope data, null when missing
	});
	return convertObjectToArray(emissionsPerYear);
};

export const transformDataMultipleCompanies = (
	emissionsData: CompanyEmissionArray,
	selectedCompanies: string[],
	selectedScopes: number[],
	selectedScope2Category: string
) => {
	const emissionsPerYear: EmissionsPerYear = {};
	// Year/company combinations with at least one missing scope — their sum is incomplete
	const incomplete = new Set<string>();

	emissionsData.forEach(({ year, company, scope, value, category }) => {
		// Skip items that are not included in the companies array
		if (
			!selectedCompanies.includes(company) ||
			!selectedScopes.includes(scope) ||
			(scope === 2 && category !== selectedScope2Category)
		) {
			return;
		}

		// Initialize the emissions data object for the year if it does not exist
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year };
		}

		const parsed = parseValue(value);
		const key = `${year}|${company}`;

		if (parsed === null) {
			// A missing scope invalidates the whole sum for that year
			incomplete.add(key);
			emissionsPerYear[year][company] = null;
		} else if (!incomplete.has(key)) {
			emissionsPerYear[year][company] = (emissionsPerYear[year][company] ?? 0) + parsed;
		}
	});

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	return convertObjectToArray(emissionsPerYear);
};
