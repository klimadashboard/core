<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { browser } from '$app/environment';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;

	let selectedElement = null;
	let coalMapElement;
	let coalMap;
	let mapLoaded = false;

	onMount(() => {
		createMap();
		return () => {
			if (coalMap) coalMap.remove();
		};
	});

	// Update map highlight when selection changes
	$: if (selectedElement && browser && mapLoaded) {
		coalMap.flyTo({
			center:
				selectedElement.geometry.type == 'Point'
					? selectedElement.geometry.coordinates
					: selectedElement.geometry.coordinates[0][0],
			zoom: 10
		});
		document
			.getElementById('coal-item-' + selectedElement.properties.id)
			?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
		updateMapHighlight();
	}

	$: if (!selectedElement && mapLoaded) {
		updateMapHighlight();
	}

	function updateMapHighlight() {
		if (!coalMap || !mapLoaded) return;

		const selectedId = selectedElement?.properties?.id ?? null;

		// Update circle styling for points (coal plants)
		coalMap.setPaintProperty('coal-plants', 'circle-radius', [
			'case',
			['==', ['get', 'id'], selectedId],
			10,
			5
		]);
		coalMap.setPaintProperty('coal-plants', 'circle-stroke-width', [
			'case',
			['==', ['get', 'id'], selectedId],
			4,
			2
		]);

		// Update polygon styling for mines
		coalMap.setPaintProperty('coal-mines', 'fill-opacity', [
			'case',
			['==', ['get', 'id'], selectedId],
			0.8,
			0.5
		]);
		coalMap.setPaintProperty('coal-mines-b', 'line-width', [
			'case',
			['==', ['get', 'id'], selectedId],
			4,
			2
		]);
	}

	const createMap = function () {
		coalMap = new maplibregl.Map({
			container: coalMapElement,
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
			center: [10.454, 51.368],
			zoom: 5
		});

		coalMap.on('load', () => {
			const nav = new maplibregl.NavigationControl({
				visualizePitch: true
			});
			coalMap.addControl(nav, 'top-left');

			coalMap.addSource('coal', {
				type: 'geojson',
				data: data
			});

			coalMap.addLayer({
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

			coalMap.addLayer({
				id: 'coal-mines',
				source: 'coal',
				filter: ['==', ['geometry-type'], 'Polygon'],
				type: 'fill',
				layout: {},
				paint: {
					'fill-color': '#71665B',
					'fill-opacity': 0.5
				}
			});

			coalMap.addLayer({
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

			coalMap.on('click', ['coal-plants', 'coal-mines'], (e) => {
				selectedElement = data?.features.find(
					(d) => d.properties.id == e.features[0].properties.id
				);
			});

			coalMap.on('drag', () => {
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
	<div id="map-coal" bind:this={coalMapElement} class="col-span-2 h-full rounded-l-lg" />

	<div class="overflow-y-auto h-full bg-gray-50 dark:bg-gray-900 rounded-r-lg">
		<ul class="divide-y divide-gray-200 dark:divide-gray-700">
			{#each data.features.sort( (a, b) => b.geometry.type.localeCompare(a.geometry.type) ) as item (item.properties.id)}
				{@const isSelected = selectedElement === item}
				{@const isMine = item.geometry.type === 'Polygon'}
				<li
					id="coal-item-{item.properties.id}"
					class="transition-all duration-200 {isSelected
						? isMine
							? 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-inset ring-amber-600'
							: 'bg-orange-100 dark:bg-orange-900/40 ring-2 ring-inset ring-orange-500'
						: 'hover:bg-gray-100 dark:hover:bg-gray-800'} {!isSelected && selectedElement
						? 'opacity-50'
						: 'opacity-100'}"
				>
					<button class="w-full text-left p-4 cursor-pointer" on:click={() => selectItem(item)}>
						{#if isMine}
							<div class="flex items-start gap-3">
								<span
									class="mt-1 flex-shrink-0 w-4 h-4 rounded bg-[#71665B] ring-2 ring-white shadow-sm {isSelected
										? 'scale-125'
										: ''} transition-transform"
								></span>
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-gray-900 dark:text-gray-100">
										{item.properties.label}
									</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										{item.properties.region}
									</p>
									<div class="mt-2 flex flex-wrap gap-2">
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
										>
											Tagebau
										</span>
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
										>
											{item.properties.size}
										</span>
									</div>
									<p class="">
										{item.properties.output} Fördermenge
									</p>
									{#if item.properties.plannedClosing}
										<p class="">
											Stilllegung geplant: {item.properties.plannedClosing}
										</p>
									{/if}
									{#if item.properties.villagesAffected || item.properties.peopleAffected}
										<div class="">
											{#if item.properties.villagesAffected}
												<p>{item.properties.villagesAffected} Ortschaften abgebaggert</p>
											{/if}
											{#if item.properties.peopleAffected}
												<p>{item.properties.peopleAffected} Menschen umgesiedelt</p>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<div class="flex items-start gap-3">
								<span
									class="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#B7722E] ring-2 ring-white shadow-sm {isSelected
										? 'scale-125'
										: ''} transition-transform"
								></span>
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-gray-900 dark:text-gray-100">
										{item.properties.Blockname}
									</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										{item.properties.Betreiber}
									</p>
									<div class="mt-2 flex flex-wrap gap-2">
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
										>
											Kraftwerk
										</span>
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
										>
											{item.properties.Brennstoff}
										</span>
									</div>
									<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
										{item.properties['Nettonennleistung [MWel]']} MWel
									</p>
									{#if item.properties['CO2 [t] im Jahr 2016']}
										<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
											{formatNumber(item.properties['CO2 [t] im Jahr 2016'])} t CO<sub>2</sub> (2016)
										</p>
									{/if}
									{#if item.properties.Stilllegung}
										<p class="mt-1 text-sm text-green-600 dark:text-green-400">
											Stilllegung: {item.properties.Stilllegung}
										</p>
									{/if}
								</div>
							</div>
						{/if}
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
