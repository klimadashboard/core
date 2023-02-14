<script>
	import Papa from 'papaparse';
	import Chart from './Chart.svelte';

	$: dataset = null;
	$: readMore = false;

	Papa.parse(
		'https://data.klimadashboard.org/at/emissions/Emission_All_sectors_Bundeslaender_Austria_1990-2019.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			complete: function (results) {
				if (results) {
					dataset = results.data;
				}
			}
		}
	);
</script>

{#if dataset}
	<Chart data={dataset} />
{/if}
