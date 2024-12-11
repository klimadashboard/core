<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import WeatherStationMap from './WeatherStationMap.svelte';
	import WeatherStationPicker from './WeatherStationPicker.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let selectedStation;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_stations' : 'at_geosphere_stations';
	let geoJsonName =
		PUBLIC_VERSION == 'de'
			? 'https://data.klimadashboard.org/de/germany.json'
			: 'https://data.klimadashboard.org/at/austria.json';

	async function getData() {
		const directus = getDirectusInstance(fetch);
		const stations = await directus.request(
			readItems(tableName, {
				limit: 300
			})
		);
		const response = await fetch(geoJsonName);
		const geo = await response.json();

		return {
			stations: stations,
			geo: geo
		};
	}

	const promise = getData();
</script>

{#await promise then data}
	<WeatherStationPicker {data} bind:selectedStation />

	<WeatherStationMap {data} bind:selectedStation />
{/await}
