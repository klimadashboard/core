import type { Company } from './schema';

export const flattenCompanies = (companies: Company[]) => {
	return companies.map((company) => {
		return {
			...company,
			name: company.name,
			logoId: company.logo.id,
			sectorIconIds: [...company.sectors.map((sector) => sector.companies_sectors_id.icon)],
			sectors: [...company.sectors.map((sector) => sector.companies_sectors_id.name)]
		};
	});
};

// Define a common type for emissions data records
export interface EmissionsYearRecord {
	year: number;
	unit: string;
	label: number;
	[key: string | number]: any; // Allow dynamic properties for scope/company values
}

export const convertObjectToArray = (
	emissionsPerYear: Record<number, EmissionsYearRecord>
): Array<EmissionsYearRecord & { x: number }> => {
	return Object.values(emissionsPerYear)
		.sort((a, b) => a.year - b.year)
		.map((item, index) => ({
			...item,
			x: index
		}));
};
