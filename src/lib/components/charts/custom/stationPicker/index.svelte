<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import WeatherStationMap from './WeatherStationMap.svelte';
	import WeatherStationPicker from './WeatherStationPicker.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { onMount } from 'svelte';
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
		const url = new URL(window.location.href);
		const weatherStation = url.searchParams.get('weatherStation');
		if (weatherStation) {
			const station = stations.find((s) => s.id == weatherStation);
			if (station) {
				selectedStation = station;
			}
		}

		return {
			stations: stations,
			geo: geo
		};
	}

	const promise = getData();

	const handleStationSelect = function (event) {
		const url = new URL(window.location.href);
		url.searchParams.set('weatherStation', event.detail.id);
		window.history.replaceState({}, '', url); // no reactivity triggered
		selectedStation = event.detail;
	};

	onMount(() => {
		const stored = localStorage.getItem('kd_region_coordinates');
		if (stored && page.url.pathname.includes('regions')) {
			const [lng, lat] = stored.split(',').map(Number); // convert to numbers

			promise.then(({ stations }) => {
				function haversineDistance(lat1, lon1, lat2, lon2) {
					const R = 6371; // Earth radius in km
					const toRad = (x) => (x * Math.PI) / 180;
					const dLat = toRad(lat2 - lat1);
					const dLon = toRad(lon2 - lon1);
					const a =
						Math.sin(dLat / 2) ** 2 +
						Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
					const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
					return R * c;
				}

				let closest = null;
				let minDistance = Infinity;

				for (const station of stations) {
					const distance = haversineDistance(lat, lng, station.latitude, station.longitude);
					if (distance < minDistance) {
						minDistance = distance;
						closest = station;
					}
				}

				if (closest && minDistance <= 5) {
					selectedStation = closest;
					const url = new URL(window.location.href);
					url.searchParams.set('weatherStation', closest.id);
					window.history.replaceState({}, '', url);
				}
			});
		}
	});
</script>

{#await promise then data}
	<div class="relative">
		<WeatherStationPicker {data} {selectedStation} on:select={handleStationSelect} />
		<WeatherStationMap {data} {selectedStation} on:select={handleStationSelect} />
	</div>
{/await}
