// @ts-nocheck

export const transformDataSingleCompany = (data, company, selectedScopes) => {
	// Object to hold emissions data per year with merged scopes
	const emissionsPerYear = {};

	// Iterate over each item in the rawData
	data.forEach((item) => {
		const { Year_Scope, ...emissions } = item;
		const { year, scope } = parseYearScope(Year_Scope);

		// only include selected scopes
		if (!selectedScopes.includes(scope.replace('scope', ''))) {
			return;
		}

		// If the specific company has emission data for this year, merge it
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year }; // Initialize if not present
		}
		emissionsPerYear[year][scope] = emissions[company]; // Merge scope
	});

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	return convertObjectToArray(emissionsPerYear);
};

export const transformDataSingleCompanyV2 = (emissionsData, company, selectedScopes) => {
	const selectedCompanyData = emissionsData.filter((item) => item.company === company);

	// Object to hold emissions data per year with merged scopes
	const emissionsPerYear = {};

	// Iterate over each item in the rawData
	selectedCompanyData.forEach((item) => {
		const { year, scope, value } = item;

		// only include selected scopes
		if (!selectedScopes.includes(scope.replace('scope', ''))) {
			return;
		}

		// If the specific company has emission data for this year, merge it
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year }; // Initialize if not present
		}
		emissionsPerYear[year][scope] = value; // Merge scope data
	});
	return convertObjectToArray(emissionsPerYear);
};

export const transformDataMultipleCompaniesV2 = (
	emissionsData,
	selectedCompanies,
	selectedScopes
) => {
	const emissionsPerYear = {};

	emissionsData.forEach(({ year, scope, value, company }) => {
		const scopeNumber = scope.replace('scope', '');
		// Skip items that are not included in the companies array
		if (!selectedCompanies.includes(company) || !selectedScopes.includes(scopeNumber)) {
			return;
		}

		// Initialize the emissions data object for the year if it does not exist
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year };
		}

		// TODO: Make sure that 'na' values are handled correctly
		// IDEA: Insert 'na' for all values null or undefined
		if (!emissionsPerYear[year][company]) {
			emissionsPerYear[year][company] = value;
		} else {
			emissionsPerYear[year][company] += value;
		}
	});

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	console.log('🚀 ~ transformDataMultipleCompaniesV2 ~ emissionsPerYear:', emissionsPerYear);
	return convertObjectToArray(emissionsPerYear);
};

export const transformDataMultipleCompanies = (data, companies, selectedScopes) => {
	const emissionsPerYear = {};
	data.forEach((item) => {
		const { Year_Scope, ...emissions } = item;
		const { year, scope } = parseYearScope(Year_Scope);

		// Initialize the emissions data object for the year if it does not exist
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year };
		}

		companies.forEach((company) => {
			if (emissions[company] !== undefined && emissions[company] !== null) {
				// Aggregate emission data for the company and selected scopes

				selectedScopes.forEach((selectedScope) => {
					if (scope === `scope${selectedScope}`) {
						if (!emissionsPerYear[year][company]) {
							emissionsPerYear[year][company] = emissions[company];
						} else {
							emissionsPerYear[year][company] += emissions[company];
						}
					}
				});
			}
		});
	});

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	console.log('🚀 ~ transformDataMultipleCompanies ~ emissionsPerYear:', emissionsPerYear);
	return convertObjectToArray(emissionsPerYear);
};

// Function to parse the year and scope from the "Year_Scope" string
const parseYearScope = (yearScope) => {
	const [year, scope] = yearScope.split('_');
	return { year: parseInt(year), scope: scope };
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
