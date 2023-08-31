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
					'circle-radius': 5,
					'circle-stroke-width': 2,
					'circle-color': '#B7722E',
					'circle-stroke-color': 'white'
				}
			});

			// add fill for polygons
			map.addLayer({
				id: 'coal-mines',
				source: 'coal',
				filter: ['==', ['geometry-type'], 'Polygon'],
				type: 'fill',
				layout: {},
				paint: {
					'fill-color': '#71665B', // blue color fill
					'fill-opacity': 0.5
				}
			});

			// add lines for polygons
			map.addLayer({
				id: 'coal-mines-b',
				source: 'coal',
				filter: ['==', ['geometry-type'], 'Polygon'],
				type: 'line',
				layout: {},
				paint: {
					'line-color': '#71665B',
					'line-width': 2
				}
			});

			// add click handler
			map.on('click', ['coal-plants', 'coal-mines'], (e) => {
				selectedElement = data?.features.find(
					(d) => d.properties.id == e.features[0].properties.id
				);
			});
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
					{#if item.geometry.type == 'Polygon'}
						<h3 class="font-bold">
							<span class="w-3 h-3 mr-1 inline-block rounded-full bg-[#71665B]" />
							Tagebau
						</h3>
					{:else}
						<h3 class="font-bold">
							<span class="w-3 h-3 mr-1 inline-block rounded-full bg-[#B7722E]" />
							{item.properties.Blockname}
							<span class="font-normal">{item.properties.Brennstoff}</span>
						</h3>
						<p>{item.properties['Nettonennleistung [MWel]']}MWel</p>
						<p>{item.properties.Betreiber}</p>
						{#if item.properties['CO2 [t] im Jahr 2016']}
							<p>{item.properties['CO2 [t] im Jahr 2016']}CO2-Emissionen im Jahr 2016</p>
						{/if}
						<p>Stilllegung {item.properties.Stilllegung}</p>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.map-wrapper {
		height: 70vh;
	}

	:global(.mapboxgl-ctrl-attrib) {
		@apply text-sm text-gray-700;
	}
</style>
