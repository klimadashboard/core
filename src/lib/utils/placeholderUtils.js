// Placeholder utilities
import dayjs from 'dayjs';
import getDirectusInstance from './directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import formatNumber from '$lib/stores/formatNumber';

// Get renewableData
const getRenewableData = async function () {
	const directus = getDirectusInstance(fetch);

	// Fetch data
	const renewableShareDaily = await directus.request(
		readItems('renewable_share_daily', {
			filter: { country: { _eq: PUBLIC_VERSION.toUpperCase() } },
			sort: ['-date'],
			limit: 365
		})
	);

	const renewableShareNow = await directus.request(
		readItems('renewable_share_15min', {
			filter: { country: { _eq: PUBLIC_VERSION.toUpperCase() } }
		})
	);

	// Helper function to calculate average
	const calculateAverage = (filteredData) => {
		if (filteredData.length === 0) return 0; // Avoid division by zero
		const total = filteredData.reduce((sum, item) => sum + item.share, 0);
		return formatNumber(total / filteredData.length);
	};

	// Get the current time
	const now = dayjs();

	// Find the item with the date closest to the current time
	const closestRenewableShareNow = renewableShareNow.reduce((closest, item) => {
		const itemDate = dayjs(item.date);
		const closestDate = dayjs(closest.date);

		// Compare the absolute difference between dates
		return Math.abs(itemDate.diff(now)) < Math.abs(closestDate.diff(now)) ? item : closest;
	});

	// Filter data for the last 30 days
	const last30DaysData = renewableShareDaily.filter((item) => {
		const itemDate = dayjs(item.date);
		return itemDate.isAfter(now.subtract(30, 'days'));
	});

	// Filter data for the last 365 days
	const last365DaysData = renewableShareDaily.filter((item) => {
		const itemDate = dayjs(item.date);
		return itemDate.isAfter(now.subtract(365, 'days'));
	});

	return {
		renewableShareNow: closestRenewableShareNow,
		renewableShareLast30Days: calculateAverage(last30DaysData),
		renewableShareLast365Days: calculateAverage(last365DaysData)
	};
};

// Placeholder handlers: Define a function for each placeholder
const placeholderHandlers = {
	renewablePercentageNow: async () => (await getRenewableData()).renewableShareNow.share, // Simulate fetching percentageShare
	renewablePercentageNowDate: async () => (await getRenewableData()).renewableShareNow.date, // Simulate fetching or computing expectedGrowth
	renewablePercentage30days: async () => (await getRenewableData()).renewableShareLast30Days, // Simulate fetching renewableValue
	renewablePercentageLastYear: async () => (await getRenewableData()).renewableShareLast365Days, // Simulate fetching nonRenewableValue
	renewablePercentageGoalValue: async () => 'XYZ', // Simulate fetching nonRenewableValue
	renewablePercentageGoalYear: async () => '2010' // Simulate fetching nonRenewableValue
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
