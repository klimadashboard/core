<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import WeatherStationMap from './WeatherStationMap.svelte';

	export let selectedStation;

	async function getData() {
		const directus = getDirectusInstance(fetch);
		const stations = await directus.request(readItems('at_geosphere_stations'));
		const response = await fetch('https://data.klimadashboard.org/at/austria.json');
		const geo = await response.json();

		return {
			stations: stations,
			geo: geo
		};
	}

	const promise = getData();
</script>

{#await promise then data}
	<div>
		<select bind:value={selectedStation}>
			{#each data.stations.sort((a, b) => a.name > b.name) as station}
				<option value={station}>{station.name} ({station.height}m)</option>
			{/each}
		</select>
	</div>

	<WeatherStationMap {data} {selectedStation} />
{/await}
