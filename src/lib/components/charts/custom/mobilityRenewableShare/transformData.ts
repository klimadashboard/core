import type {
	GetCountriesQuery,
	GetMobilityRenewableShareQuery
} from './__generated__/getData.generated';

const DEFAULT_COLOR = '#bababa';

// Define colors for different regions
export const regionColors = {
	// DE: '#7CBAB3',
	// AT: '#575C75',
	// FR: '#71665B',
	// ES: '#B28834',
	// IT: '#8CAED9',
	// PT: '#E0A906',
	// GB: '#CF6317',
	highlighted: '#1e88af'
};

// Type for chart data structure
export type LineChartData = {
	chartData: Array<Record<string, any>>;
	keys: string[];
	labels: string[];
	colors: string[];
};

/**
 * Transforms API data into the format expected by the ChartLine component
 * @param apiData Data from the Mobility API
 * @param countries Countries data with region IDs and German names
 * @param currentCountry The current country code based on the domain (DE or AT)
 * @returns Formatted data for the chart component
 */
export function transformDataForChart(
	apiData: GetMobilityRenewableShareQuery['mobility'],
	countries: GetCountriesQuery['countries'],
	currentCountry: string = 'DE'
): LineChartData {
	if (!apiData?.length) {
		return { chartData: [], keys: [], labels: [], colors: [] };
	}

	// Get unique periods and regions
	const periods = [...new Set(apiData.map((item) => item.period))].sort();

	// Extract and filter regions to ensure they are valid strings
	let regions = [...new Set(apiData.map((item) => item.region))]
		.filter((region): region is string => region !== null && region !== undefined)
		.sort((a, b) => a.localeCompare(b));

	// Move the current country to the end so it's drawn last (on top)
	if (regions.includes(currentCountry)) {
		regions = regions.filter((region) => region !== currentCountry);
		regions.push(currentCountry);
	}

	// Create a lookup map for quick access to values
	const dataMap: Record<string, Record<string, number>> = {};

	// Populate the data map with values from the API
	apiData.forEach((item) => {
		const period = item.period ?? '';
		const region = item.region ?? '';

		// Initialize period entry if it doesn't exist
		dataMap[period] = dataMap[period] ?? {};

		// Store the value, defaulting to NaN if null/undefined
		dataMap[period][region] = item.value ?? NaN;
	});

	// Create chart data with the format expected by chartLine
	const chartData = periods.map((period, index) => {
		const dataPoint: Record<string, any> = {
			x: index,
			label: period
		};

		// Add each region's value as a property
		regions.forEach((region) => {
			dataPoint[region] = dataMap[period ?? '']?.[region] ?? NaN;
		});

		return dataPoint;
	});

	// Create colors array matching the regions order
	const colors = regions.map((region) =>
		// Use highlighted color for the current country, otherwise default
		region === currentCountry
			? regionColors.highlighted
			: (regionColors[region as keyof typeof regionColors] ?? DEFAULT_COLOR)
	);

	// Create labels using country names when available
	const labels = regions.map((region) => {
		const country = countries.find((country) => country.id === region);
		return country?.name_de ?? region;
	});

	return {
		chartData,
		keys: regions,
		labels,
		colors
	};
}
