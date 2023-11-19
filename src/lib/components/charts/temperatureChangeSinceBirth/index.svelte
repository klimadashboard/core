<script>
	import Papa from 'papaparse';
	import Chart from './Chart.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	let data;
	let yearInterval = 30;

	Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/${
			PUBLIC_VERSION == 'at' ? 'geosphere' : 'impact'
		}/historic_mean_temperatures_${PUBLIC_VERSION}.csv`,
		{
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
							const boundYears = [...results.data]
								.filter(
									(item) =>
										item[`mean_temperature_${PUBLIC_VERSION == 'at' ? 'austria' : 'germany'}`]
								)
								.slice(lowerBound, upperBound)
								.map((row) => {
									return row[`mean_temperature_${PUBLIC_VERSION == 'at' ? 'austria' : 'germany'}`];
								});
							const average =
								boundYears.length > 1 ? boundYears.reduce((a, b) => a + b) / boundYears.length : 0;
							return {
								year: entry.year,
								temperature:
									entry[`mean_temperature_${PUBLIC_VERSION == 'at' ? 'austria' : 'germany'}`],
								average: Math.round(average * 100) / 100
							};
						})
						.splice(yearInterval);
				}
			}
		}
	);
</script>

{#if data}
	<Chart {data} />
{/if}
