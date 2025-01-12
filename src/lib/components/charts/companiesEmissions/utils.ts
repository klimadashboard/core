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
