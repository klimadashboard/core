// @ts-nocheck

export const transformDataSingleCompany = (
	emissionsData,
	selectedCompany,
	selectedScopes,
	selectedCategory
) => {
	const emissionsPerYear = {};

	// Iterate over each item in the rawData
	emissionsData.forEach(({ year, company, scope, value, category }) => {
		if (
			company !== selectedCompany ||
			!selectedScopes.includes(scope.replace('scope', '')) ||
			category !== selectedCategory
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
			emissionsPerYear[year][scope] = value; // Merge scope data
		}
	});
	return convertObjectToArray(emissionsPerYear);
};

export const transformDataMultipleCompanies = (
	emissionsData,
	selectedCompanies,
	selectedScopes,
	selectedCategory
) => {
	const emissionsPerYear = {};

	emissionsData.forEach(({ year, company, scope, value, category }) => {
		const scopeNumber = scope.replace('scope', '');
		// Skip items that are not included in the companies array
		if (
			!selectedCompanies.includes(company) ||
			!selectedScopes.includes(scopeNumber) ||
			category !== selectedCategory
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
			emissionsPerYear[year][company] = value;
		} else {
			emissionsPerYear[year][company] += value;
		}
	});

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	console.log('🚀 ~ transformDataMultipleCompanies ~ emissionsPerYear:', emissionsPerYear);
	return convertObjectToArray(emissionsPerYear);
};

const convertObjectToArray = (emissionsPerYear) => {
	return Object.values(emissionsPerYear)
		.sort((a, b) => a.year - b.year)
		.map((item, index) => {
			return {
				...item,
				x: index
			};
		});
};
