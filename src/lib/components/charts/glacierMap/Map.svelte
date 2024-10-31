<script>
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	import { browser } from '$app/environment';
	import 'mapbox-gl/dist/mapbox-gl.css';

	export let data;

	let selectedElement = false;
	let mapElement;
	let map;

	onMount(() => {
		if (browser) {
			createMap();
		}
	});

	$: if (selectedElement && browser) {
		map.flyTo({
			center:
				selectedElement.geometry.type == 'Point'
					? selectedElement.geometry.coordinates
					: selectedElement.geometry.coordinates[0][0],
			zoom: 10
		});
		document
			.getElementById('coal-item-' + selectedElement.properties.id)
			?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
	}

	const createMap = () => {
		mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

		map = new mapboxgl.Map({
			container: mapElement,
			style: 'mapbox://styles/klimadashboard/cm053xfeq00cj01r6a0ygh9oe',
			center: [13.2, 47.5],
			zoom: 6
		});
	};
</script>

<div class="grid md:grid-cols-3 map-wrapper mb-16">
	<div id="map" bind:this={mapElement} class="col-span-2 h-full" />

	<div class="overflow-scroll h-full">
		<ul>
			{#each data.features as item}
				<li
					class="border-y py-2 hover:bg-gray-100 {selectedElement && selectedElement !== item
						? 'opacity-60'
						: 'opacity-100'} cursor-pointer p-4"
					id="coal-item-{item.properties.id}"
					on:mousedown={() => (selectedElement = item)}
				>
					[platzhalter für gletscherdaten]
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.map-wrapper {
		height: 70vh;
	}

	#map {
		height: 100%;
		width: 100%;
	}

	:global(.mapboxgl-ctrl-attrib) {
		@apply text-sm text-gray-700;
	}
</style>
