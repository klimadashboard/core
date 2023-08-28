<script>
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';

	export let data;

	let mapElement;
	let map;

	onMount(() => {
		createMap();
	});

	const createMap = function () {
		map = new mapboxgl.Map({
			accessToken: PUBLIC_MAPBOX_TOKEN,
			container: mapElement,
			interactive: true,
			style: 'mapbox://styles/davidjablonski/cllkz3m0801c401plbd0y9r8x',
			center: [10.454, 51.368],
			zoom: 5
		});

		map.on('load', () => {
			const nav = new mapboxgl.NavigationControl({
				visualizePitch: true
			});
			map.addControl(nav, 'top-left');

			map.addSource('coal', {
				type: 'geojson',
				// Use a URL for the value for the `data` property.
				data: '../data_temp/coal.json'
			});

			map.addLayer({
				id: 'coal-plants',
				filter: ['==', ['geometry-type'], 'Point'],
				type: 'circle',
				source: 'coal',
				paint: {
					'circle-radius': 4,
					'circle-stroke-width': 2,
					'circle-color': 'red',
					'circle-stroke-color': 'white'
				}
			});

			// add fill for polygons
			map.addLayer({
				id: 'coal-sources',
				source: 'coal',
				filter: ['==', ['geometry-type'], 'Polygon'],
				type: 'fill',
				layout: {},
				paint: {
					'fill-color': '#0080ff', // blue color fill
					'fill-opacity': 0.5
				}
			});

			// add lines for polygons
			map.addLayer({
				id: 'coal-sources-b',
				source: 'coal',
				filter: ['==', ['geometry-type'], 'Polygon'],
				type: 'line',
				layout: {},
				paint: {
					'line-color': '#000',
					'line-width': 2
				}
			});

			// add click handler
			map.on('click', 'coal-plants', (e) => {
				// Copy coordinates array.
				const coordinates = e.features[0].geometry.coordinates.slice();
				const description = e.features[0].properties.description;

				// Ensure that if the map is zoomed out such that multiple
				// copies of the feature are visible, the popup appears
				// over the copy being pointed to.
				while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
					coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
				}

				new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
			});
		});
	};
</script>

<div class="relative">
	<div id="map" bind:this={mapElement} class="w-full bg-gray-100" />

	<div class="bg-white absolute right-4 top-4 bottom-4 p-4 overflow-scroll">
		{#each data.features as item}
			<h3>{item.properties.Blockname}</h3>
		{/each}
	</div>
</div>

<style>
	#map {
		height: 70vh;
	}
</style>
