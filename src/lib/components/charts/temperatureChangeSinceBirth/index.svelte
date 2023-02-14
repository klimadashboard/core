<script>
	import Papa from 'papaparse';
	import Chart from './Chart.svelte';

	let data;
	let yearInterval = 30;

	Papa.parse('https://data.klimadashboard.org/at/zamg/historic_mean_temperatures_at.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				data = results.data
					.map((entry, index) => {
						const lowerBound = Math.max(0, index - yearInterval);
						const upperBound = lowerBound + yearInterval;
						// console.log(lowerBound);
						const boundYears = [...results.data]
							.filter((item) => item['mean_temperature_austria'])
							.slice(lowerBound, upperBound)
							.map((row) => {
								return row['mean_temperature_austria'];
							});
						const average =
							boundYears.length > 1 ? boundYears.reduce((a, b) => a + b) / boundYears.length : 0;
						// console.log(average);
						return {
							year: entry.year,
							temperature: entry['mean_temperature_austria'],
							average: Math.round(average * 100) / 100
						};
					})
					.splice(yearInterval);
			}
		}
	});
</script>

{#if data}
	<Chart {data} />
{/if}
