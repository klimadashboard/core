<script>
	import { types } from '$lib/stores/weather';
	import Papa from 'papaparse';
	import WeatherDayCard from './WeatherDayCard.svelte';
	import Loader from '$lib/components/Loader.svelte';

	export let selectedStation = 105;

	$: selectedStationData = [];

	$: Papa.parse(
		'https://data.klimadashboard.org/at/geosphere/stations/' +
			selectedStation +
			'/yearly-today.csv',
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

	$: Papa.parse('https://data.klimadashboard.org/at/geosphere/stations.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				selectedStationName = results.data.find((d) => d.id == selectedStation).name;
			}
		}
	});
</script>

{#if selectedStationData.length > 0 && selectedStationName !== 'station'}
	<div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
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
