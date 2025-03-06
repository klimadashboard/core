<script>
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	import { browser } from '$app/environment';

	export let data;

	$: selectedElement = false;

	let mapElement;
	let map;

	onMount(() => {
		createMap();
	});

	$: if (selectedElement && browser) {
		map.flyTo({
			center:
				selectedElement.geometry.type == 'Point'
					? selectedElement.geometry.coordinates
					: selectedElement.geometry.coordinates[0][0],
			zoom: 9
		});
		document
			.getElementById('coal-item-' + selectedElement.properties.id)
			?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
	}

	const createMap = function () {
		map = new mapboxgl.Map({
			accessToken: PUBLIC_MAPBOX_TOKEN,
			container: mapElement,
			interactive: true,
			style: 'mapbox://styles/davidjablonski/cllkz3m0801c401plbd0y9r8x',
			center: [9.454, 48.368],
			zoom: 4,
			maxZoom: 9,
			minZoom: 5
		});

		map.on('load', () => {
			const nav = new mapboxgl.NavigationControl({
				visualizePitch: true
			});
			map.addControl(nav, 'top-left');
		});
	};
</script>

<div class="">
	<div id="map" bind:this={mapElement} class="" />
</div>

<style>
	@reference "tailwindcss/theme";
	#map {
		height: 70vh;
	}

	:global(.mapboxgl-ctrl-attrib) {
		@apply text-sm text-gray-700;
	}
</style>
