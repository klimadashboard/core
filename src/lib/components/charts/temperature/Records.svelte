<script>
	import dayjs from 'dayjs';

	export let data;
	export let selectedStation;

	let hottestDay = [...data].sort((a, b) => b.tlmax - a.tlmax)[0];
	// Find the earliest heat day across all years
	let earliestHeatDay = data
		// Filter only heat days (where tlmax exceeds the threshold)
		.filter((entry) => entry.tlmax >= 30)
		// Find the earliest date within the year (ignoring the year itself)
		.reduce((earliestOverall, entry) => {
			const entryDate = dayjs(entry.date);

			// Extract only the month and day to compare
			const entryMonthDay = entryDate.format('MM-DD');

			if (!earliestOverall) {
				return entry;
			}

			const earliestDate = dayjs(earliestOverall.date);
			const earliestMonthDay = earliestDate.format('MM-DD');

			// Compare based on month and day
			if (entryMonthDay < earliestMonthDay) {
				return entry;
			}

			return earliestOverall;
		}, null);

	let items = [
		{
			heading: 'Heißester Tag',
			text:
				'Mit ' +
				hottestDay.tlmax +
				'°C war der ' +
				dayjs(hottestDay.date).format('D. MMMM YYYY') +
				' der heißeste jemals gemessene Tag in ' +
				selectedStation.name +
				'.'
		}
	];

	if (earliestHeatDay !== null) {
		items.push({
			heading: 'Frühester Hitzetag',
			text:
				'Der früheste Hitzetag (30°C oder mehr) in einem Jahr wurde am ' +
				dayjs(earliestHeatDay.date).format('D. MMMM YYYY') +
				' gemessen.'
		});
	}
</script>

<div class="grid md:grid-cols-2 gap-4 mt-16">
	{#each items as item}
		<div class="rounded border p-4 text-lg">
			<p><b>{item.heading}:</b> {item.text}</p>
		</div>
	{/each}
</div>
