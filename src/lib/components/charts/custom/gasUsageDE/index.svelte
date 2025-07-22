<script>
	import ChartLine from '$lib/components/charts/chartLine.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import dayjs from 'dayjs';
	import dayOfYear from 'dayjs/plugin/dayOfYear';

	dayjs.extend(dayOfYear);

	const getGasUsageData = async () => {
		const directus = getDirectusInstance(fetch);
		const rawData = await directus.request(
			readItems('energy', {
				filter: {
					_and: [{ region: { _eq: PUBLIC_VERSION } }, { category: { _eq: 'gas|usage' } }]
				},
				limit: -1,
				sort: ['period']
			})
		);

		// Determine all years present in data
		const years = Array.from(new Set(rawData.map((d) => dayjs(d.period).year()))).sort();

		const grouped = {};

		for (const d of rawData) {
			const date = dayjs(d.period);
			const year = date.year();
			const day = date.dayOfYear();
			const label = date.format('D. MMM');

			if (!grouped[day]) {
				grouped[day] = { x: day, label };
				for (const y of years) {
					grouped[day][y] = null;
				}
			}
			grouped[day][year] = d.value;
		}

		const rawDataSorted = Object.values(grouped)
			.filter((d) => years.some((y) => d[y] != null)) // keep rows with at least one value
			.sort((a, b) => a.x - b.x);

		// Remap x values to sequential 0-based index
		const data = rawDataSorted.map((d, i) => ({
			...d,
			x: i
		}));

		const lastYear = years[years.length - 1];

		const availableLastYearValues = data.filter((d) => d[lastYear] !== null);

		const preselectedIndex = availableLastYearValues[availableLastYearValues.length - 1].x;

		return { data, years, preselectedIndex, lastYear };
	};

	const promise = getGasUsageData();
</script>

<div class="h-80">
	{#await promise}
		<p>Lade Daten…</p>
	{:then result}
		<ChartLine
			data={result.data}
			labels={result.years.map(String)}
			keys={result.years.map(String)}
			colors={['#BBE5CC', '#7CBAB3', '#347C86'].slice(0, result.years.length)}
			unit="GWh/Tag"
			showTotal={false}
			showPulse={result.lastYear.toString()}
			preselectedIndex={result.preselectedIndex}
		/>
	{:catch error}
		<p class="text-red-500">Fehler beim Laden der Daten: {error.message}</p>
	{/await}
</div>
