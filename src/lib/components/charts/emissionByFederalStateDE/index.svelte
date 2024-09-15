<script>
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import Papa from 'papaparse';
	import Filter from './Filter.svelte';

	let rawData;
	let regions;
	let gastypes;
	let availableRegions;

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
				availableRegions = [...new Set(rawData.filter(d => d.sector === 'total').map(d => d.region))];
				
				// Set initial selectedRegion to the first available region
				selectedRegion = availableRegions[0] || 'Deutschland';
			}
		}
	});

	let selectedRegion;
	let selectedGas = 'GHG';

	let dataset = [];

	function createCompleteDataset(rawData, selectedRegion, selectedGas) {
		if (!rawData || !selectedRegion || !selectedGas) return [];
		
		let filteredData = rawData.filter((d) => d.region === selectedRegion && d.gastype === selectedGas && d.sector === 'total');
		
		if (filteredData.length === 0) {
			return [];
		}

		// Rest of the function remains the same
		let years = filteredData.map(d => d.year);
		let minYear = Math.min(...years);
		let maxYear = Math.max(...years);

		let allYears = [];
		for (let year = minYear; year <= maxYear; year++) {
			allYears.push(year);
		}
		let data = filteredData.reduce((acc, e) => {
			acc[e.year] = e.value;
			return acc;
		}, {});

		let result = allYears.map((year) => ({
			label: year.toString(),
			value: data[year] !== undefined ? data[year] : null,
			estimate: "#000000",
			stroke: "#000000"
		}));

		if (selectedRegion === 'Bayern') {
			for (let year = 2021; year <= 2045; year++) {
				if (!result.find(d => d.label === year.toString())) {
					result.push({ label: year.toString(), value: null });
				}
			}
			result = result.map(d => {
				if (d.label === '2030') {
					return { label: '2030', value: 3000, estimate: "#000000", stroke: "#000000"};
				} else if (d.label === '2040') {
					return { label: '2040', value: 0, estimate: "#000000", stroke: "#000000"};
				} else if(d.label === '2045') {
					return { label: '2045', value: 0, estimate: "#000000", stroke: "#000000"};
				}
				return d;
			});
		}

		result.sort((a, b) => parseInt(a.label) - parseInt(b.label));

		return result.filter(d => d.value !== null);
	}

	$: if (rawData && selectedRegion && selectedGas) {
		dataset = createCompleteDataset(rawData, selectedRegion, selectedGas);
	}

	$: datasetAvailable = dataset && dataset.length > 0;
</script>

{#if rawData}
	<Filter {regions} bind:selectedRegion {gastypes} bind:selectedGas {availableRegions} />
	{#if datasetAvailable}
		<div class="h-80">
			<BarChart 
				data={dataset} 
				xAxixInterval="5"
				unit={'t ' + selectedGas} 
			/>
		</div>
	{:else}
		<div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4" role="alert">
			<p class="font-bold">Keine Daten verfügbar 😢</p>
<p>Leider liegen uns für die ausgewählte Kombination von {selectedRegion} und {selectedGas} keine Daten vor.</p>
		</div>
	{/if}
{:else}
	<Loader />
{/if}