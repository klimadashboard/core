<script>
	import { types } from '$lib/stores/weather';
	import Papa from 'papaparse';
	import WeatherDayCard from './WeatherDayCard.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let selectedStation = 427;
	const wetterdienst = PUBLIC_VERSION == 'at' ? 'zamg' : 'impact';

	$: selectedStationData = [];

	$: Papa.parse(
		// 'https://data.klimadashboard.org/at/zamg/stations/' + selectedStation + '/yearly-today.csv',
		// 'https://data.klimadashboard.org/at/zamg/stations/' + selectedStation + '/yearly.csv',
		// `../data/${PUBLIC_VERSION}/${wetterdienst}/stations/${selectedStation}/yearly.csv`,
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations/${selectedStation}/yearly.csv`,
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					('loading...');
					selectedStationData = results.data;
				}
			}
		}
	);

	$: selectedStationName = 'station';

	// $: Papa.parse('https://data.klimadashboard.org/de/zamg/stations.csv', {
	// $: Papa.parse(`../data/${PUBLIC_VERSION}/${wetterdienst}/stations.csv`, {
	$: Papa.parse(`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations.csv`, {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				// console.log('dwd data', results.data, selectedStation);
				selectedStationName = results.data.find((d) => d.id == selectedStation).name;
			}
		}
	});
</script>

{#if selectedStationData.length > 0 && selectedStationName !== 'station'}
	<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
		{#each $types as type}
			<WeatherDayCard
				key={type.key + 's'}
				title={type.label}
				description={type.description}
				color={type.color}
				icon={type.icon}
				{selectedStation}
				{selectedStationName}
				{selectedStationData}
			/>
		{/each}
	</div>
{/if}
