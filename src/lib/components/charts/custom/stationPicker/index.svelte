<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import WeatherStationMap from './WeatherStationMap.svelte';
	import WeatherStationPicker from './WeatherStationPicker.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';

	export let selectedStation;
	export let chart;
	export let snowCoverageMinimum = 0;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_stations' : 'at_geosphere_stations';
	let geoJsonName =
		PUBLIC_VERSION == 'de'
			? 'https://data.klimadashboard.org/de/germany.json'
			: 'https://data.klimadashboard.org/at/austria.json';

	async function getData() {
		const directus = getDirectusInstance(fetch);
		const stations = await directus.request(
			readItems(tableName, {
				filter: {
					snow_coverage: {
						_gte: snowCoverageMinimum
					}
				},
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
	<div
		class={localStorage.getItem('kd_region_coordinates') && page.url.pathname.includes('regions')
			? 'hidden'
			: ''}
	>
		<WeatherStationPicker {data} bind:selectedStation />
		<WeatherStationMap {data} bind:selectedStation />
	</div>
{/await}
