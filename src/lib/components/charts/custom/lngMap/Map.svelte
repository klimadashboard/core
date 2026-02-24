<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { browser } from '$app/environment';

	export let data;

	let selectedElement = null;
	let mapElement;
	let map;
	let mapLoaded = false;

	onMount(() => {
		createMap();
		return () => {
			if (map) map.remove();
		};
	});

	// Update map highlight when selection changes
	$: if (selectedElement && browser && mapLoaded) {
		map.flyTo({
			center: selectedElement.geometry.coordinates,
			zoom: 9
		});
		document
			.getElementById('lng-item-' + selectedElement.properties.id)
			?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
		updateMapHighlight();
	}

	$: if (!selectedElement && mapLoaded) {
		updateMapHighlight();
	}

	function updateMapHighlight() {
		if (!map || !mapLoaded) return;

		const selectedId = selectedElement?.properties?.id ?? null;

		// Update circle radius and stroke for selection effect
		map.setPaintProperty('markers-planned', 'circle-radius', [
			'case',
			['==', ['get', 'id'], selectedId],
			10,
			5
		]);
		map.setPaintProperty('markers-planned', 'circle-stroke-width', [
			'case',
			['==', ['get', 'id'], selectedId],
			4,
			2
		]);
		map.setPaintProperty('markers-inuse', 'circle-radius', [
			'case',
			['==', ['get', 'id'], selectedId],
			14,
			8
		]);
		map.setPaintProperty('markers-inuse', 'circle-stroke-width', [
			'case',
			['==', ['get', 'id'], selectedId],
			4,
			2
		]);
	}

	const createMap = function () {
		map = new maplibregl.Map({
			container: mapElement,
			interactive: true,
			style: {
				version: 8,
				sources: {
					'carto-basemap': {
						type: 'raster',
						tiles: [
							'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
							'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
							'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
							'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
						],
						tileSize: 256,
						maxzoom: 20
					}
				},
				layers: [
					{
						id: 'carto-basemap',
						type: 'raster',
						source: 'carto-basemap',
						paint: { 'raster-opacity': 1 }
					}
				]
			},
			center: [10.454, 54.368],
			zoom: 6,
			maxZoom: 9,
			minZoom: 5
		});

		map.on('load', () => {
			const nav = new maplibregl.NavigationControl({
				visualizePitch: true
			});
			map.addControl(nav, 'top-left');

			map.addSource('lng', {
				type: 'geojson',
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

			map.on('click', ['markers-inuse', 'markers-planned'], (e) => {
				selectedElement = data?.features.find(
					(d) => d.properties.id == e.features[0].properties.id
				);
			});

			map.on('drag', () => {
				selectedElement = null;
			});

			mapLoaded = true;
		});
	};

	function selectItem(item) {
		selectedElement = selectedElement === item ? null : item;
	}
</script>

<div class="grid md:grid-cols-3 map-wrapper mb-16">
	<div id="map-lng" bind:this={mapElement} class="col-span-2 h-full rounded-l-lg" />

	<div class="overflow-y-auto h-full bg-gray-50 dark:bg-gray-900 rounded-r-lg">
		<ul class="divide-y divide-gray-200 dark:divide-gray-700">
			{#each data.features.sort((a, b) => {
				return a.properties.already_in_use < b.properties.already_in_use ? 1 : -1;
			}) as item (item.properties.id)}
				{@const isSelected = selectedElement === item}
				{@const isInUse = item.properties.already_in_use === 'TRUE'}
				<li
					id="lng-item-{item.properties.id}"
					class="transition-all duration-200 {isSelected
						? 'bg-teal-100 dark:bg-teal-900/40 ring-2 ring-inset ring-teal-500'
						: 'hover:bg-gray-100 dark:hover:bg-gray-800'} {!isSelected && selectedElement
						? 'opacity-50'
						: 'opacity-100'}"
				>
					<button
						class="w-full text-left p-4 cursor-pointer"
						on:click={() => selectItem(item)}
					>
						<div class="flex items-start gap-3">
							<span
								class="mt-1 flex-shrink-0 w-4 h-4 rounded-full ring-2 ring-white shadow-sm {isInUse
									? 'bg-[#347C86]'
									: 'bg-[#9CB5B8]'} {isSelected ? 'scale-125' : ''} transition-transform"
							></span>
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-gray-900 dark:text-gray-100">
									{item.properties.place}
								</h3>
								<p class="text-sm text-gray-600 dark:text-gray-400">
									{item.properties.operator}
								</p>
								<div class="mt-2 flex flex-wrap gap-2">
									<span
										class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {isInUse
											? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
											: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
									>
										{isInUse ? 'In Betrieb' : 'Geplant'}
									</span>
									<span
										class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
									>
										{item.properties.type === 'floating' ? 'Schwimmterminal' : 'Landterminal'}
									</span>
								</div>
								<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
									{#if item.properties.min_capacity !== item.properties.max_capacity}
										{item.properties.min_capacity}–{item.properties.max_capacity}
									{:else}
										{item.properties.max_capacity}
									{/if}
									Mrd. m³/Jahr
								</p>
							</div>
						</div>
					</button>
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

	:global(.maplibregl-ctrl-attrib) {
		@apply text-sm text-gray-700;
	}
</style>
