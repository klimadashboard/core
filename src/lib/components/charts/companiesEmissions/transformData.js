// @ts-nocheck

export const transformDataSingleCompany = (data, company) => {
	// Object to hold emissions data per year with merged scopes
	const emissionsPerYear = {};

	// Iterate over each item in the rawData
	data.forEach((item) => {
		const { Year_Scope, ...emissions } = item;
		const { year, scope } = parseYearScope(Year_Scope);

		// only include selected scopes
		if (!selectedScopes.includes(scope)) {
			return;
		}

		// If the specific company has emission data for this entry, merge it
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year }; // Initialize if not present
		}
		emissionsPerYear[year][scope] = emissions[company] !== 'na' ? parseInt(emissions[company]) : 0; // Merge scope data
	});

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	return convertObjectToArray(emissionsPerYear);
};

export const transformDataMultiCompanies = (data, companies, selectedScopes) => {
	const emissionsPerYear = {};
	data.forEach((item) => {
		const { Year_Scope, ...emissions } = item;
		const { year } = parseYearScope(Year_Scope);

		// Initialize the emissions data object for the year if it does not exist
		if (!emissionsPerYear[year]) {
			emissionsPerYear[year] = { year, unit: 'CO2', label: year };
		}

		companies.forEach((company) => {
			if (emissions[company]) {
				// Aggregate emission data for the company and selected scopes
				selectedScopes.forEach((scope) => {
					if (!emissionsPerYear[year][company]) {
						emissionsPerYear[year][company] = 0;
					}
					if (Year_Scope.includes(scope)) {
						emissionsPerYear[year][company] += parseInt(emissions[company]);
					}
				});
			}
		});
	});

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	return convertObjectToArray(emissionsPerYear);
};

// Function to parse the year and scope from the "Year_Scope" string
const parseYearScope = (yearScope) => {
	const [year, scope] = yearScope.split('_');
	return { year: parseInt(year), scope: scope };
};

const convertObjectToArray = (emissionsPerYear) => {
	Object.values(emissionsPerYear)
		.sort((a, b) => a.year - b.year)
		.map((item, index) => {
			console.log('🚀 ~ item:', item);
			return {
				...item,
				x: index // Set x to current index, starting at 0
			};
		});
};
