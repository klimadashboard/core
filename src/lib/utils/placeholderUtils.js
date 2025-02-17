// Placeholder utilities
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import getDirectusInstance from './directus';
import { readItems } from '@directus/sdk';
import { PUBLIC_VERSION } from '$env/static/public';
import formatNumber from '$lib/stores/formatNumber';

dayjs.extend(relativeTime);

const getSiteData = async () => {
	const directus = getDirectusInstance(fetch);

	const data = await directus
		.request(
			readItems('sites', {
				filter: { id: { _eq: PUBLIC_VERSION } },
				fields: ['translations.title', 'translations.region']
			})
		)
		.catch(() => []);

	return {
		title: data[0].translations[0].title,
		region: data[0].translations[0].region
	};
};

const getRenewableData = async function () {
	const directus = getDirectusInstance(fetch);

	try {
		const country = PUBLIC_VERSION.toUpperCase();

		const renewableData = await directus
			.request(
				readItems('energy_renewable_share', {
					filter: { country: { _eq: country } },
					sort: ['-period'],
					limit: 1000
				})
			)
			.catch(() => []);

		const now = dayjs();

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

		return {
			renewablePercentageNow: Math.round(data15min.value),
			renewablePercentageNowDate: dayjs(data15min.period).fromNow(),
			renewableShareLast30Days: Math.round(dataMonthly.value),
			renewableShareLast365Days: Math.round(dataYearly.value),
			renewableShareGoalYear: dayjs(goalData.period).format('YYYY'),
			renewableShareGoalValue: Math.round(goalData.value)
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
				? dayjs(co2PriceNowEUEntry.date).format('D.M.YYYY')
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

const getGasUsageData = async () => {
	const directus = getDirectusInstance(fetch);

	try {
		const data = await directus
			.request(
				readItems('energy', {
					filter: {
						_and: [
							{
								category: { _eq: 'gas|usage' }
							},
							{ region: { _eq: PUBLIC_VERSION } }
						]
					},
					sort: ['-period'],
					limit: 1000
				})
			)
			.catch(() => []);

		const latestEntry = data[0] || { value: 'N/A', period: 'N/A' };
		const lastYearDate = dayjs(latestEntry.period).subtract(1, 'year').format('YYYY-MM-DD');
		const lastYearEntry = data.find((item) => item.period === lastYearDate) || {
			value: 'N/A',
			period: lastYearDate
		};

		return {
			gasUsageCurrent: latestEntry.value,
			gasUsageCurrentDate: dayjs(latestEntry.period).format('D.M.YYYY'),
			gasUsageLastYear: formatNumber(lastYearEntry.value),
			gasUsageLastYearDate: dayjs(lastYearEntry.period).format('D.M.YYYY')
		};
	} catch (error) {
		console.error('Error fetching gas usage data:', error);
		return {
			gasUsageCurrent: 'N/A',
			gasUsageCurrentDate: 'N/A',
			gasUsageLastYear: 'N/A',
			gasUsageLastYearDate: 'N/A'
		};
	}
};

const placeholderHandlers = {
	renewablePercentageNow: async () => (await getRenewableData()).renewablePercentageNow,
	renewablePercentageNowDate: async () => (await getRenewableData()).renewablePercentageNowDate,
	renewablePercentage30days: async () => (await getRenewableData()).renewableShareLast30Days,
	renewablePercentageLastYear: async () => (await getRenewableData()).renewableShareLast365Days,
	renewablePercentageGoalValue: async () => (await getRenewableData()).renewableShareGoalValue,
	renewablePercentageGoalYear: async () => (await getRenewableData()).renewableShareGoalYear,
	co2PriceNowEU: async () => (await getCO2PriceData()).co2PriceNowEU,
	co2PriceNowEUDate: async () => (await getCO2PriceData()).co2PriceNowEUDate,
	co2PriceNowNational: async () => (await getCO2PriceData()).co2PriceNowNational,
	gasUsageCurrent: async () => (await getGasUsageData()).gasUsageCurrent,
	gasUsageCurrentDate: async () => (await getGasUsageData()).gasUsageCurrentDate,
	gasUsageLastYear: async () => (await getGasUsageData()).gasUsageLastYear,
	gasUsageLastYearDate: async () => (await getGasUsageData()).gasUsageLastYearDate,
	currentCountry: async () => (await getSiteData()).region
};

const parseTemplate = async (template) => {
	if (!template || typeof template !== 'string') return template;

	const placeholders = Array.from(template.matchAll(/{{(.*?)}}/g), ([, key]) => key.trim());
	const resolvedValues = await Promise.all(
		placeholders.map(async (key) => {
			if (key.startsWith('glossary:')) {
				const term = key.split(':')[1];
				return '<button data-key="' + term + '" aria-label="Info" class="glossary-label"></button>';
			}
			const handler = placeholderHandlers[key];
			return handler ? await handler() : `{{${key}}}`;
		})
	);

	return template.replace(/{{(.*?)}}/g, () => resolvedValues.shift());
};

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

	return data;
};

export { parseTemplate, resolvePlaceholders, placeholderHandlers };
