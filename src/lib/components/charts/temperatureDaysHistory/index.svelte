<script>
	import { selectedStation } from '$lib/stores/weather';
	import { page } from '$app/stores';
	import Papa from 'papaparse';
	import { types } from '$lib/stores/weather';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import BarChart from '../chartBar.svelte';

	const wetterdienst = PUBLIC_VERSION == 'at' ? 'geosphere' : 'impact';

	$: selectedStationData = [];
	$: selectedStationName = 'station';

	$: earliestPossibleYear = 1961;
	$: latestPossibleYear = 2022;
	$: selectedReferenceYears = 1961;

	$: Papa.parse(`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations.csv`, {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				selectedStationName = results.data.find((d) => d.id == $selectedStation).name;
			}
		}
	});

	$: Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations/${$selectedStation}/yearly.csv`,
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					selectedStationData = results.data;
					earliestPossibleYear = results.data[0].year;
					latestPossibleYear = results.data[results.data.length - 1].year;
				}
			}
		}
	);

	$: console.log(selectedStationData);
</script>

<p>Temperaturtageverlauf für {selectedStationName}:</p>

{#if selectedStationData}
	{#each $types as type}
		<p>{@html type.icon} {type.label}</p>
		<p><small>{type.description}</small></p>
		<BarChart data={selectedStationData.map(d => { return { label: d.year, value: d[type.key+"s"] }; })} color={type.color} xAxixInterval={10} unit={''} />
	{/each}
{:else}
	<Loader />
{/if}
