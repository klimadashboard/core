export const flattenCompanies = (companies) => {
	return companies.map((company) => {
		return {
			name: company.name,
			logoId: company.logo.id,
			sectors: [...company.sectors.map((sector) => sector.companies_sectors_id.name)],
			sectorIconIds: [...company.sectors.map((sector) => sector.companies_sectors_id.icon)]
		};
	});
};

export const convertObjectToArray = (emissionsPerYear) => {
	return Object.values(emissionsPerYear)
		.sort((a, b) => a.year - b.year)
		.map((item, index) => {
			return {
				...item,
				x: index
			};
		});
};
