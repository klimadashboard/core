import { z } from 'zod';

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

// Company Meta Data zod schema
export const CompanyMetaDataSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	logoId: z.string(),
	sectors: z.array(z.string()),
	sectorIconIds: z.array(z.string()),
	climate_neutrality_goal: z.string().nullable(),
	climate_neutrality_scopes: z.array(z.string()).nullable(),
	member_sbt: z.boolean()
});

// infer type from zod schema
export type CompanyMetaData = z.infer<typeof CompanyMetaDataSchema>;

// Company Meta Data zod array schema
export const CompanyMetaDataArraySchema = z.array(CompanyMetaDataSchema);
export type CompanyMetaDataArray = z.infer<typeof CompanyMetaDataArraySchema>;

// parse company meta data against zod schema - ensuring data from db is valid
export const parseCompanyMetaData = (data: unknown) => {
	return CompanyMetaDataArraySchema.parse(data);
};

// SECTOR SCHEMA
export const SectorSchema = z.object({
	name: z.string(),
	icon: z.string()
});
export type Sector = z.infer<typeof SectorSchema>;

export const SectorArraySchema = z.array(SectorSchema);
export type SectorArray = z.infer<typeof SectorArraySchema>;

export const parseSectors = (data: unknown) => {
	return SectorArraySchema.parse(data);
};

// COMPANY EMISSION SCHEMA
export const CompanyEmissionSchema = z.object({
	year: z.number(),
	company: z.string(),
	scope: z.number(),
	value: z.string().nullable(),
	category: z.string().nullable()
});
export type CompanyEmission = z.infer<typeof CompanyEmissionSchema>;

export const CompanyEmissionArraySchema = z.array(CompanyEmissionSchema);
export type CompanyEmissionArray = z.infer<typeof CompanyEmissionArraySchema>;

export const parseCompanyEmission = (data: unknown) => {
	return CompanyEmissionArraySchema.parse(data);
};
