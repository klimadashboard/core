<script>
	import Chart from './Chart.svelte';
	import Papa from 'papaparse';

	let dataGoals;

	Papa.parse(
		'https://data.klimadashboard.org/at/energy/renewables/erneuerbare_2030_scenarios.csv',
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					dataGoals = results.data;
				}
			}
		}
	);

	let dataPV;
	Papa.parse('https://data.klimadashboard.org/at/energy/renewables/pv_produktion.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				dataPV = results.data;
			}
		}
	});

	let dataWind;
	Papa.parse('https://data.klimadashboard.org/at/energy/renewables/windkraft_produktion.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				dataWind = results.data;
			}
		}
	});
</script>

{#if dataPV && dataWind && dataGoals}
	<Chart {dataPV} {dataWind} {dataGoals} />
{/if}
