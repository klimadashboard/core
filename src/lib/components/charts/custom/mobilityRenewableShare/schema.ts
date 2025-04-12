import { z } from 'zod';

// Define the schema for a single mobility renewable share data item
export const MobilityRenewableShareItemSchema = z.object({
	period: z.string().describe('The time period for the data point'),
	region: z.string().describe('The geographic region for the data point'),
	value: z.number().describe('The renewable share value as a number')
});

// Define the schema for the array of mobility renewable share data
export const MobilityRenewableShareSchema = z.array(MobilityRenewableShareItemSchema);

// Define the schema for a single country data item
export const CountryItemSchema = z.object({
	id: z.string().describe('The unique identifier for the country'),
	name_de: z.string().describe('The German name of the country')
});

// Define the schema for the array of countries data
export const CountriesSchema = z.array(CountryItemSchema);

// Type definitions derived from the schemas
export type MobilityRenewableShareItem = z.infer<typeof MobilityRenewableShareItemSchema>;
export type MobilityRenewableShare = z.infer<typeof MobilityRenewableShareSchema>;
export type CountryItem = z.infer<typeof CountryItemSchema>;
export type Countries = z.infer<typeof CountriesSchema>;

/**
 * Validates the data returned from getMobilityRenewableShare
 * @param data The data to validate
 * @returns The validated data with proper typing
 * @throws If validation fails
 */
export function validateMobilityRenewableShareData(data: unknown): MobilityRenewableShare {
	return MobilityRenewableShareSchema.parse(data);
}

/**
 * Safely validates the data returned from getMobilityRenewableShare
 * @param data The data to validate
 * @returns Result object with success status and either validated data or error
 */
export function safeParseMobilityRenewableShareData(data: unknown) {
	return MobilityRenewableShareSchema.safeParse(data);
}

/**
 * Validates the data returned from getCountries
 * @param data The data to validate
 * @returns The validated data with proper typing
 * @throws If validation fails
 */
export function validateCountriesData(data: unknown): Countries {
	return CountriesSchema.parse(data);
}

/**
 * Safely validates the data returned from getCountries
 * @param data The data to validate
 * @returns Result object with success status and either validated data or error
 */
export function safeParseCountriesData(data: unknown) {
	return CountriesSchema.safeParse(data);
}
