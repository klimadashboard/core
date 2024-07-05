<script>
	import Papa from 'papaparse';
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import Filter from './Filter.svelte';
	import Loader from '$lib/components/Loader.svelte';

	let rawData;
	let regions;

	Papa.parse('https://data.klimadashboard.org/de/emissions/udrdl_emissions_by_bundesland.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				rawData = results.data;
				console.log(rawData);
				regions = [
					...new Set(
						rawData.map((d) => {
							return d.region;
						})
					)
				];
			}
		}
	});

	$: selectedRegion = 'Bayern';
	$: selectedGas = 'ghg';

	$: dataset = [];

	$: if (rawData) {
		dataset = rawData
			.filter((d) => d.region == selectedRegion)
			.map((e) => {
				return {
					label: e.year,
					value: e[selectedGas]
				};
			});
	}

	$: console.log(dataset);
</script>

{#if dataset.length > 0}
	<Filter {regions} bind:selectedRegion />
	<div class="h-80">
		<BarChart data={dataset} unit={'t ' + selectedGas} />
	</div>
{:else}
	<Loader />
{/if}
