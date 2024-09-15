<script>
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import { createCompleteDataset, getValue1990, predictEmissionsToTarget } from '$lib/components/charts/emissionByFederalStateDE/climateGoal';
	import Loader from '$lib/components/Loader.svelte';
	
	import Papa from 'papaparse';
	import Filter from './Filter.svelte';
	
	let rawData;
  let regions;
  let gastypes;
  let availableRegions;
  let dataset = [];
  let predictedData = [];
  let selectedRegion;
	let selectedGas = 'GHG';
	
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


	$: if (rawData && selectedRegion && selectedGas) {
		dataset = createCompleteDataset(rawData, selectedRegion, selectedGas);
	}

	$: datasetAvailable = dataset && dataset.length > 0;
	$: if (rawData && selectedRegion && selectedGas) {
		dataset = createCompleteDataset(rawData, selectedRegion, selectedGas);
		
		if (dataset.length > 0) {
			const latestDataPoint = dataset[dataset.length - 1];
			const value1990 = getValue1990(rawData, selectedRegion, selectedGas);
			
			if (value1990 !== null) {
				const predictions = predictEmissionsToTarget(
					selectedRegion, 
					parseInt(latestDataPoint.label), // Latest year
					latestDataPoint.value, // Latest value
					value1990, // 1990 value
					selectedGas
				);
				console.log(predictions);
				if (predictions) {
					// Remove any existing predictions from the dataset
					dataset = dataset.filter(d => parseInt(d.label) <= new Date().getFullYear());
					// Add the new predictions
					predictedData = predictions.filter(d => d.year > new Date().getFullYear());
				} else {
					console.error('Failed to generate predictions');
					predictedData = [];
				}
			} else {
				console.error('1990 value not found');
				predictedData = [];
			}
		} else {
			console.error('Dataset is empty');
			predictedData = [];
		}
	}

  $: combinedData = [
    ...dataset.map(d => ({
      ...d,
      color: 'black',
      stroke: 'black',
      strokeWidth: 1
    })),
    ...predictedData
  ];
  $: datasetAvailable = combinedData.length > 0;
</script>

{#if rawData}
	<Filter {regions} bind:selectedRegion {gastypes} bind:selectedGas {availableRegions} />
	{#if datasetAvailable}
		<div class="h-80">
			<BarChart 
				data={combinedData} 
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