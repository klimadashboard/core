<script>
	import dayjs from 'dayjs';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;

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
			heading: 'Heißeste Tage',
			text: '',
			values: [...data]
				.sort((a, b) => b.tlmax - a.tlmax)
				.splice(0, 10)
				.map((d) => {
					return {
						date: d.date,
						t: d.tlmax
					};
				})
		},
		{
			heading: 'Heißeste Nächte',
			text: '',
			values: [...data]
				.sort((a, b) => b.tlmin - a.tlmin)
				.splice(0, 10)
				.map((d) => {
					return {
						date: d.date,
						t: d.tlmin
					};
				})
		}
	];

	if (earliestHeatDay !== null) {
		items.push({
			heading: 'Frühester Hitzetag',
			text:
				'Der früheste Hitzetag (30°C oder mehr) in einem Jahr wurde am ' +
				dayjs(earliestHeatDay.date).format('D. MMMM YYYY') +
				' gemessen.',
			values: []
		});
	}
</script>

<div class="grid md:grid-cols-2 gap-4 mt-16">
	{#each items as item}
		<div class="rounded-sm border-current/10 border p-4 text-lg">
			<p><b>{item.heading}:</b> {item.text}</p>
			{#if item.values.length > 0}
				<table>
					<thead>
						<tr>
							<td>Datum</td>
							<td>Temperatur</td>
						</tr>
					</thead>
					<tbody>
						{#each item.values as day}
							<tr>
								<td>{dayjs(day.date).format('D. MMMM YYYY')}</td>
								<td>{formatNumber(day.t)}°C</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	{/each}
</div>

<style>
	@reference "tailwindcss/theme";
	table {
		@apply text-base mt-4 w-full;
	}

	thead {
		@apply font-bold;
	}

	tr {
		@apply border-t;
	}
</style>
