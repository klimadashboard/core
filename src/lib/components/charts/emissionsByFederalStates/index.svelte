<script>
	import Papa from 'papaparse';
	import Chart from './Chart.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	$: dataset = null;
	$: readMore = false;
	let maxYear;

	Papa.parse(
		'https://data.klimadashboard.org/' + PUBLIC_VERSION + '/emissions/emissions_by_sectors.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			complete: function (results) {
				if (results) {
					dataset = results.data.filter(
						(d) => d.region !== 'Austria' && d.classification == 'Gesamt' && d.total_co2e_t
					);
					maxYear = [...dataset].sort((a, b) => b.year - a.year)[0].year;
				}
			}
		}
	);
</script>

{#if dataset && maxYear}
	<Chart data={dataset} {maxYear} />
{/if}
