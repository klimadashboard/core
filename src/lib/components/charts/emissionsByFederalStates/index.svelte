<script>
	import Papa from 'papaparse';
	import Chart from './Chart.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	$: dataset = null;
	$: readMore = false;

	Papa.parse(
		'https://data.klimadashboard.org/' + PUBLIC_VERSION + '/emissions/emissions_by_sectors.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			complete: function (results) {
				if (results) {
					dataset = results.data.filter((d) => d.region !== 'Austria');
				}
			}
		}
	);
</script>

{#if dataset}
	<Chart data={dataset} />
{/if}
