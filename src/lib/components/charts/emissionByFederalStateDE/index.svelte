<script>
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import Papa from 'papaparse';
	import Filter from './Filter.svelte';

	let rawData;
	let regions;
	let gastypes;

	Papa.parse('https://data.klimadashboard.org/de/emissions/udrdl_emissions_by_bundesland.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				rawData = results.data;
				regions = [
					...new Set(
						rawData.map((d) => {
							return d.region;
						})
					)
				];
				gastypes = [
					...new Set(
						rawData.map((d) => {
							return d.gastype;
						})
					)
				];
			}
		}
	});

	$: selectedRegion = 'Deutschland';
	$: selectedGas = 'GHG';

	$: dataset = [];

	// Create complete dataset
	function createCompleteDataset(rawData, selectedRegion, selectedGas) {
		let filteredData = rawData.filter((d) => d.region === selectedRegion && d.gastype === selectedGas && d.sector === 'total');
		
		if (filteredData.length === 0) {
			return [];
		}
		// Determine year range
		let years = filteredData.map(d => d.year);
		let minYear = Math.min(...years);
		let maxYear = Math.max(...years);

		// Generating all years within the range
		let allYears = [];
		for (let year = minYear; year <= maxYear; year++) {
			allYears.push(year);
		}
		let data = filteredData.reduce((acc, e) => {
			acc[e.year] = e.value;
			return acc;
		}, {});

		// Mapping all years to the dataset
		return allYears.map((year) => ({
			label: year.toString(),
			value: data[year] !== undefined ? data[year] : 'NA' 
		}));
	}

	// Updating dataset
	$: if (rawData) {
		dataset = createCompleteDataset(rawData, selectedRegion, selectedGas);
	}
	console.log("ich bin ein test");
</script>

{#if dataset.length > 0}
	<Filter {regions} bind:selectedRegion {gastypes} bind:selectedGas />
	<div class="h-80">
		<BarChart 
		data={dataset} 
		unit={'t ' + selectedGas} />
	</div>
{:else}
	<Loader />
{/if}