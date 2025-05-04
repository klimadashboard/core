// COMPANY META DATA SCHEMA
export interface Company {
	id: string;
	name: string;
	climate_neutrality_goal: string | null;
	climate_neutrality_scopes: string[] | null;
	member_sbt: boolean;
	logo: {
		id: string;
	};
	sectors: {
		companies_sectors_id: {
			name: string;
			icon: string;
		};
	}[];
}

// Company Meta Data structure for chart usage
export interface CompanyMetaData {
	id?: string;
	name: string;
	logoId: string;
	sectors: string[];
	sectorIconIds: string[];
	climate_neutrality_goal: string | null;
	climate_neutrality_scopes: string[] | null;
	member_sbt: boolean;
}

export type CompanyMetaDataArray = CompanyMetaData[];

// SECTOR SCHEMA
export interface Sector {
	name: string;
	icon: string;
}

export type SectorArray = Sector[];

// COMPANY EMISSION SCHEMA
export interface CompanyEmission {
	year: number;
	company: string;
	scope: number;
	value: string | null;
	category: string | null;
}

export type CompanyEmissionArray = CompanyEmission[];
