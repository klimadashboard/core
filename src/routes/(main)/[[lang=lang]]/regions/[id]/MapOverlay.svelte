<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import maplibregl from 'maplibre-gl';
	import { PUBLIC_VERSION } from '$env/static/public';
	import MapCarsDensity from './MapCarsDensity.svelte';

	export let regionId;
	export let regionName;
	export let initialLayerId = null;

	const dispatch = createEventDispatcher();

	let mapContainer;
	let map;
	let mapReady = false;
	let selectedLayer = initialLayerId || 'car-density';

	// Map layer registry - just metadata
	const mapLayers = [
		{
			id: 'car-density',
			title: 'PKW-Dichte',
			category: 'mobility',
			icon: '🚗',
			relatedChartId: '4895ac82-30f2-4afa-9fc5-76ef2c6eec55',
			component: MapCarsDensity
		},
		{
			id: 'solar-installations',
			title: 'Photovoltaik-Anlagen',
			category: 'energy',
			icon: '☀️',
			relatedChartId: '31a5ca7c-08cf-487c-b2ab-aa04f9d2cd6f',
			component: null // TODO
		},
		{
			id: 'wind-power',
			title: 'Windkraftanlagen',
			category: 'energy',
			icon: '💨',
			relatedChartId: '1e135ce2-06d2-4eae-b8f8-fdb4cbae910c',
			component: null // TODO
		},
		{
			id: 'ev-charging-stations',
			title: 'Ladestationen für E-Autos',
			category: 'mobility',
			icon: '🔌',
			relatedChartId: '68b0f853-b1b1-4120-aedd-87de58ea3209',
			component: null // TODO
		}
	];

	const categories = {
		energy: { label: 'Energie', color: 'bg-yellow-500' },
		mobility: { label: 'Mobilität', color: 'bg-blue-500' }
	};

	const COUNTRY_CODE = PUBLIC_VERSION.toUpperCase();
	const defaultView = {
		AT: { center: [13.333, 47.5], zoom: 6 },
		DE: { center: [10.45, 51.1657], zoom: 5 }
	};
	const { center, zoom } = defaultView[COUNTRY_CODE] || defaultView.DE;

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=C9NLXahOLRDRQl9OB6yH`,
				sources: {
					labels: {
						type: 'vector',
						url: 'https://tiles.klimadashboard.org/data/labels-' + PUBLIC_VERSION + '.json'
					}
				},
				layers: [
					{ id: 'background', type: 'background', paint: { 'background-color': 'transparent' } }
				]
			},
			center,
			zoom,
			minZoom: zoom - 1,
			maxZoom: 14
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');
		map.scrollZoom.disable();

		map.on('load', () => {
			// Add city labels layer
			map.addLayer({
				id: 'city-labels',
				source: 'labels',
				'source-layer': 'city-labels',
				type: 'symbol',
				layout: {
					'text-field': ['get', 'name'],
					'text-font': ['Noto Sans Regular'],
					'text-size': 12,
					'symbol-sort-key': ['get', 'population']
				},
				paint: { 'text-color': '#000', 'text-halo-color': '#fff', 'text-halo-width': 1 },
				minzoom: 4,
				maxzoom: 9
			});

			mapReady = true;
		});

		return () => {
			if (map) {
				map.remove();
			}
		};
	});

	function handleClose() {
		dispatch('close');
	}

	function handleLayerSelect(layerId) {
		selectedLayer = layerId;
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	$: selectedLayerData = mapLayers.find((l) => l.id === selectedLayer);
	$: LayerComponent = selectedLayerData?.component;
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
	transition:fade={{ duration: 200 }}
	on:click={handleClose}
	role="button"
	tabindex="-1"
	aria-label="Overlay schließen"
>
	<div
		class="absolute inset-4 md:inset-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex"
		transition:fly={{ y: 50, duration: 300 }}
		on:click={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="map-title"
	>
		<!-- Sidebar -->
		<aside class="w-80 border-r border-gray-200 dark:border-gray-800 overflow-y-auto flex-shrink-0">
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 id="map-title" class="text-2xl font-bold">Karten-Explorer</h2>
					<button
						on:click={handleClose}
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Schließen"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M18 6L6 18" />
							<path d="M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
					<p class="text-sm text-gray-700 dark:text-gray-300">
						<strong>{regionName}</strong>
					</p>
				</div>

				<!-- Layer Categories -->
				{#each Object.entries(categories) as [categoryId, categoryInfo]}
					<div class="mb-6">
						<h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
							{categoryInfo.label}
						</h3>
						<div class="space-y-1">
							{#each mapLayers.filter((l) => l.category === categoryId) as layer}
								<button
									class="w-full text-left p-3 rounded-lg transition-colors {selectedLayer ===
									layer.id
										? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500'
										: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}"
									on:click={() => handleLayerSelect(layer.id)}
								>
									<div class="flex items-center gap-3">
										<span class="text-2xl">{layer.icon}</span>
										<div class="flex-1">
											<div class="font-medium text-sm">{layer.title}</div>
											{#if !layer.component}
												<div class="text-xs text-gray-500 dark:text-gray-400">Bald verfügbar</div>
											{/if}
										</div>
										{#if selectedLayer === layer.id}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												class="text-blue-600"
											>
												<polyline points="20 6 9 17 4 12" />
											</svg>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/each}

				<!-- Related Chart Link -->
				{#if selectedLayerData?.relatedChartId}
					<div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Verwandte Daten:</p>
						<a
							href="/charts/{selectedLayerData.relatedChartId}?region={regionId}"
							class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
							on:click={handleClose}
						>
							<span>Zur Datenvisualisierung</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M5 12h14" />
								<path d="M12 5l7 7-7 7" />
							</svg>
						</a>
					</div>
				{/if}
			</div>
		</aside>

		<!-- Map Container -->
		<div class="flex-1 relative bg-gray-50 dark:bg-gray-950">
			<div bind:this={mapContainer} class="w-full h-full absolute inset-0"></div>

			<!-- Layer Component Overlay -->
			{#if mapReady && LayerComponent}
				<div class="absolute inset-0 pointer-events-none">
					<svelte:component this={LayerComponent} {map} {regionId} {regionName} />
				</div>
			{:else if mapReady && !LayerComponent}
				<!-- Placeholder for unimplemented layers -->
				<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div
						class="p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-xl pointer-events-auto"
					>
						<div class="text-6xl mb-4">{selectedLayerData?.icon}</div>
						<h3 class="text-xl font-semibold mb-2">{selectedLayerData?.title}</h3>
						<p class="text-gray-600 dark:text-gray-400">
							Diese Kartenebene wird in Kürze verfügbar sein.
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	aside::-webkit-scrollbar {
		width: 8px;
	}

	aside::-webkit-scrollbar-track {
		background: transparent;
	}

	aside::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	aside::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.3);
	}
</style>
