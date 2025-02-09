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
			center: [10.454, 54.368],
			zoom: 6,
			maxZoom: 9,
			minZoom: 5
		});

		map.on('load', () => {
			const nav = new mapboxgl.NavigationControl({
				visualizePitch: true
			});
			map.addControl(nav, 'top-left');

			map.addSource('lng', {
				type: 'geojson',
				// Use a URL for the value for the `data` property.
				data: data
			});

			map.addLayer({
				id: 'markers-planned',
				filter: ['==', 'already_in_use', 'FALSE'],
				type: 'circle',
				source: 'lng',
				paint: {
					'circle-radius': 5,
					'circle-stroke-width': 2,
					'circle-color': '#9CB5B8',
					'circle-stroke-color': 'white'
				}
			});

			map.addLayer({
				id: 'markers-inuse',
				filter: ['==', 'already_in_use', 'TRUE'],
				type: 'circle',
				source: 'lng',
				paint: {
					'circle-radius': 8,
					'circle-stroke-width': 2,
					'circle-color': '#347C86',
					'circle-stroke-color': 'white'
				}
			});

			// add click handler
			map.on('click', ['markers-inuse', 'markers-planned'], (e) => {
				selectedElement = data?.features.find(
					(d) => d.properties.id == e.features[0].properties.id
				);
			});

			map.on('drag', (e) => {
				selectedElement = false;
			});
		});
	};
</script>

<div class="grid md:grid-cols-3 map-wrapper mb-16">
	<div id="map" bind:this={mapElement} class="col-span-2 h-full" />

	<div class="overflow-scroll h-full">
		<ul>
			{#each data.features.sort((a, b) => {
				return a.properties.already_in_use < b.properties.already_in_use;
			}) as item}
				<li
					class="border-y py-2 hover:bg-gray-100 {selectedElement && selectedElement !== item
						? 'opacity-60'
						: 'opacity-100'} cursor-pointer p-4"
					id="coal-item-{item.properties.id}"
					on:mousedown={() => (selectedElement = item)}
				>
					<h3 class="font-bold">
						<span
							class="w-3 h-3 mr-1 inline-block rounded-full {item.properties.already_in_use ==
							'TRUE'
								? 'bg-[#347C86]'
								: 'bg-[#9CB5B8]'}"
						/>
						{item.properties.place}
						<span class="font-normal">{item.properties.operator}</span>
					</h3>
					<p>{item.properties.type == 'floating' ? 'Schwimmterminal' : 'Landterminal'}</p>
					<p>
						{item.properties.already_in_use == 'TRUE' ? 'In Betrieb ' : '(Noch) nicht in Betrieb'}
					</p>
					<p>
						{#if item.properties.min_capacity !== item.properties.max_capacity}
							{item.properties.min_capacity} –
						{/if}
						{item.properties.max_capacity} Milliarden Kubikmeter/Jahr
					</p>
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	@reference "tailwindcss/theme";
	.map-wrapper {
		height: 70vh;
	}

	:global(.mapboxgl-ctrl-attrib) {
		@apply text-sm text-gray-700;
	}
</style>
