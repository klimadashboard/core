// Placeholder utilities
import dayjs from 'dayjs';
import getDirectusInstance from './directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import formatNumber from '$lib/stores/formatNumber';

const getRenewableData = async function () {
	const directus = getDirectusInstance(fetch);

	try {
		// Fetch data with error handling
		const country = PUBLIC_VERSION.toUpperCase();

		const renewableData = await directus
			.request(
				readItems('energy_renewable_share', {
					filter: { country: { _eq: country } },
					sort: ['-period'],
					limit: 1000
				})
			)
			.catch(() => []); // Return empty array if request fails

		// Get the current time
		const now = dayjs();

		// Filter data by category
		const data15min = renewableData
			.filter((item) => item.category === '15min' && dayjs(item.period).isBefore(now))
			.sort((a, b) => dayjs(b.period).isBefore(dayjs(a.period)))[0] || {
			value: 'N/A',
			period: now
		};

		const dataDaily = renewableData.find((item) => item.category === 'day') || {
			value: 'N/A',
			period: now
		};
		const dataMonthly = renewableData.find((item) => item.category === 'month') || {
			value: 'N/A',
			period: now
		};
		const dataYearly = renewableData.find((item) => item.category === 'year') || {
			value: 'N/A',
			period: now
		};
		const goalData = renewableData.find((item) => item.category === 'goal') || {
			value: 'N/A',
			period: 'N/A'
		};

		$: console.log(data15min);

		return {
			renewablePercentageNow: data15min.value,
			renewablePercentageNowDate: dayjs(data15min.period).fromNow(),
			renewableShareLast30Days: formatNumber(dataMonthly.value),
			renewableShareLast365Days: formatNumber(dataYearly.value),
			renewableShareGoalYear: dayjs(goalData.period).format('YYYY'),
			renewableShareGoalValue: formatNumber(goalData.value)
		};
	} catch (error) {
		console.error('Error fetching renewable data:', error);
		return {
			renewablePercentageNow: 'N/A',
			renewablePercentageNowDate: 'N/A',
			renewableShareLast30Days: 'N/A',
			renewableShareLast365Days: 'N/A',
			renewableShareGoalYear: 'N/A',
			renewableShareGoalValue: 'N/A'
		};
	}
};

const getCO2PriceData = async () => {
	const directus = getDirectusInstance(fetch);

	try {
		const data = await directus
			.request(readItems('carbon_prices', { sort: ['-date'] }))
			.catch(() => []);

		const co2PriceNowEUEntry = data.find((d) => d.region === 'EU');
		const co2PriceNowNationalEntry = data.find((d) => d.region === PUBLIC_VERSION);

		return {
			co2PriceNowEU: co2PriceNowEUEntry?.value || 'N/A',
			co2PriceNowEUDate: co2PriceNowEUEntry
				? dayjs(co2PriceNowEUEntry.date).format('DD.M.YYYY')
				: 'N/A',
			co2PriceNowNational: co2PriceNowNationalEntry?.value || 'N/A'
		};
	} catch (error) {
		console.error('Error fetching CO2 price data:', error);
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
	renewablePercentageGoalValue: async () => (await getRenewableData()).renewableShareGoalValue, // Simulate fetching nonRenewableValue
	renewablePercentageGoalYear: async () => (await getRenewableData()).renewableShareGoalYear, // Simulate fetching nonRenewableValue,
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
