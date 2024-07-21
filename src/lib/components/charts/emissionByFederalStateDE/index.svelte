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
		console.log(selectedRegion)
		
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
    let result = allYears.map((year) => ({
        label: year.toString(),
        value: data[year] !== undefined ? data[year] : 'NA',
				estimate: "#000000",
				stroke: "#000000"
    }));

    // Append the specified elements if the selected region is Bayern
    if (selectedRegion === 'Bayern') {
        for (let year = 2021; year <= 2045; year++) {
            if (!result.find(d => d.label === year.toString())) {
                result.push({ label: year.toString(), value: 'NA' });
            }
        }
        // Update specific values for 2030 and 2040
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

    // Sort the result by label (year) to ensure chronological order
    result.sort((a, b) => parseInt(a.label) - parseInt(b.label));

    return result;
	}

	// Updating dataset
	$: if (rawData) {
		console.log(rawData);
		dataset = createCompleteDataset(rawData, selectedRegion, selectedGas);
	}
</script>

{#if dataset.length > 0}
	<Filter {regions} bind:selectedRegion {gastypes} bind:selectedGas />
	<div class="h-80">
		<BarChart 
			data={dataset} 
			xAxixInterval="5"
			unit={'t ' + selectedGas} 
		/>
	</div>
{:else}
	<Loader />
{/if}