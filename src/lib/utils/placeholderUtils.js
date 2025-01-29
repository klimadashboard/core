// Placeholder utilities
import dayjs from 'dayjs';
import getDirectusInstance from './directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import formatNumber from '$lib/stores/formatNumber';

// Get renewableData
const getRenewableData = async function () {
	const directus = getDirectusInstance(fetch);

	try {
		// Fetch data with error handling
		const renewableShareDaily = await directus.request(
			readItems('renewable_share_daily', {
				filter: { country: { _eq: PUBLIC_VERSION.toUpperCase() } },
				sort: ['-date'],
				limit: 365
			})
		).catch(() => []); // Return empty array if request fails

		const renewableShareNow = await directus.request(
			readItems('renewable_share_15min', {
				filter: { country: { _eq: PUBLIC_VERSION.toUpperCase() } }
			})
		).catch(() => []); // Return empty array if request fails

		// Helper function to calculate average
		const calculateAverage = (filteredData) => {
			if (!filteredData.length) return 'N/A'; // Avoid division by zero
			const total = filteredData.reduce((sum, item) => sum + item.share, 0);
			return formatNumber(total / filteredData.length);
		};

		// Get the current time
		const now = dayjs();

		// Find the closest item or return fallback
		const closestRenewableShareNow = renewableShareNow.length
			? renewableShareNow.reduce((closest, item) => {
				const itemDate = dayjs(item.date);
				const closestDate = dayjs(closest.date);
				return Math.abs(itemDate.diff(now)) < Math.abs(closestDate.diff(now)) ? item : closest;
			  })
			: { share: 'N/A', date: now };

		// Filter data for the last 30 and 365 days
		const last30DaysData = renewableShareDaily.filter((item) =>
			dayjs(item.date).isAfter(now.subtract(30, 'days'))
		);
		const last365DaysData = renewableShareDaily.filter((item) =>
			dayjs(item.date).isAfter(now.subtract(365, 'days'))
		);

		return {
			renewablePercentageNow: closestRenewableShareNow.share || 'N/A',
			renewablePercentageNowDate: dayjs(closestRenewableShareNow.date).format("DD.M.YYYY"),
			renewableShareLast30Days: calculateAverage(last30DaysData),
			renewableShareLast365Days: calculateAverage(last365DaysData)
		};
	} catch (error) {
		console.error("Error fetching renewable data:", error);
		return {
			renewablePercentageNow: 'N/A',
			renewablePercentageNowDate: 'N/A',
			renewableShareLast30Days: 'N/A',
			renewableShareLast365Days: 'N/A'
		};
	}
};

const getCO2PriceData = async () => {
	const directus = getDirectusInstance(fetch);

	try {
		const data = await directus.request(readItems('carbon_prices', { sort: ['-date'] })).catch(() => []);

		const co2PriceNowEUEntry = data.find((d) => d.region === "EU");
		const co2PriceNowNationalEntry = data.find((d) => d.region === PUBLIC_VERSION);

		return {
			co2PriceNowEU: co2PriceNowEUEntry?.value || 'N/A',
			co2PriceNowEUDate: co2PriceNowEUEntry ? dayjs(co2PriceNowEUEntry.date).format("DD.M.YYYY") : 'N/A',
			co2PriceNowNational: co2PriceNowNationalEntry?.value || 'N/A'
		};
	} catch (error) {
		console.error("Error fetching CO2 price data:", error);
		return {
			co2PriceNowEU: 'N/A',
			co2PriceNowEUDate: 'N/A',
			co2PriceNowNational: 'N/A'
		};
	}
};

// Placeholder handlers: Define a function for each placeholder
const placeholderHandlers = {
	renewablePercentageNow: async () => (await getRenewableData()).renewablePercentageNow, // Simulate fetching percentageShare
	renewablePercentageNowDate: async () => (await getRenewableData()).renewablePercentageNowDate, // Simulate fetching or computing expectedGrowth
	renewablePercentage30days: async () => (await getRenewableData()).renewableShareLast30Days, // Simulate fetching renewableValue
	renewablePercentageLastYear: async () => (await getRenewableData()).renewableShareLast365Days, // Simulate fetching nonRenewableValue
	renewablePercentageGoalValue: async () => 'XYZ', // Simulate fetching nonRenewableValue
	renewablePercentageGoalYear: async () => '2010', // Simulate fetching nonRenewableValue,
	co2PriceNowEU: async () => (await getCO2PriceData()).co2PriceNowEU,
	co2PriceNowEUDate: async () => (await getCO2PriceData()).co2PriceNowEUDate,
	co2PriceNowNational: async () => (await getCO2PriceData()).co2PriceNowNational,
	currentCountry: async () => PUBLIC_VERSION
};

// Parse a single string and resolve placeholders on demand
const parseTemplate = async (template) => {
	if (!template || typeof template !== 'string') return template;

	const placeholders = Array.from(template.matchAll(/{{(.*?)}}/g), ([, key]) => key.trim());
	const resolvedValues = await Promise.all(
		placeholders.map(async (key) => {
			const handler = placeholderHandlers[key];
			return handler ? await handler() : `{{${key}}}`; // Return the placeholder if no handler exists
		})
	);

	return template.replace(/{{(.*?)}}/g, () => resolvedValues.shift());
};

// Recursively resolve placeholders in an object, array, or string
const resolvePlaceholders = async (data) => {
	if (typeof data === 'string') {
		return await parseTemplate(data);
	}

	if (Array.isArray(data)) {
		return await Promise.all(data.map(resolvePlaceholders));
	}

	if (typeof data === 'object' && data !== null) {
		const entries = await Promise.all(
			Object.entries(data).map(async ([key, value]) => [key, await resolvePlaceholders(value)])
		);
		return Object.fromEntries(entries);
	}

	return data; // Return non-object, non-string values as-is
};

// Export the utilities and placeholder handlers
export { parseTemplate, resolvePlaceholders, placeholderHandlers };
