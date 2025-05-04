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
	if (!apiData || apiData.length === 0) {
		return { chartData: [], keys: [], labels: [], colors: [] };
	}

	// Get unique periods and regions
	const periods = [...new Set(apiData.map((item) => item.period))].sort();
	// Sort regions to ensure consistent ordering
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
	apiData.forEach((item) => {
		if (!dataMap[item.period ?? '']) dataMap[item.period ?? ''] = {};
		dataMap[item.period ?? ''][item.region ?? ''] = item.value ?? NaN;
	});

	// Create chart data with the format expected by chartLine
	const chartData = periods.map((period, index) => {
		const dataPoint: Record<string, any> = {
			x: index,
			label: period
		};

		// Add each region as a property
		regions.forEach((region) => {
			dataPoint[region] = dataMap[period ?? '']?.[region] ?? NaN;
		});

		return dataPoint;
	});

	// Create colors array matching the regions order
	const colors = regions.map((region) => {
		// Use highlighted color for the current country
		if (region === currentCountry) {
			return regionColors.highlighted;
		}
		// Otherwise use the region's default color or gray if not defined
		return regionColors[region as keyof typeof regionColors] ?? DEFAULT_COLOR;
	});

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
