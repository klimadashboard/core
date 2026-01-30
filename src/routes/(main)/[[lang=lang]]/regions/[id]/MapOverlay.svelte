<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import maplibregl from 'maplibre-gl';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/stores';
	import { t } from '$lib/utils/t';
	import MapCarsDensity from './maps/MapCarsDensity.svelte';
	import MapSolar from './maps/MapSolar.svelte';
	import MapWind from './maps/MapWind.svelte';
	import MapCarTypes from './maps/MapCarTypes.svelte';

	export let regionId;
	export let regionName;
	export let regionCode = null;
	export let regionCodeShort = null;
	export let regionLayer = null; // 'municipality', 'district', 'state', etc.
	export let initialLayerId = null;
	export let embed = false;

	const dispatch = createEventDispatcher();

	// Embed modal state
	let showEmbedModal = false;
	let embedCopied = false;

	// Translations helper
	$: translations = $page.data?.translations;

	let mapContainer;
	let map;
	let mapReady = false;
	let selectedLayer = initialLayerId || 'car-density';
	let isDarkMode = false;

	// Map layer registry - just metadata
	const mapLayers = [
		{
			id: 'car-density',
			titleKey: 'ui.map.carDensity',
			titleFallback: 'PKW-Dichte',
			category: 'mobility',
			icon: '🚗',
			relatedChartId: '4895ac82-30f2-4afa-9fc5-76ef2c6eec55',
			component: MapCarsDensity
		},
		{
			id: 'car-types',
			titleKey: 'ui.map.carTypes',
			titleFallback: 'PKW-Antriebsarten',
			category: 'mobility',
			icon: '⚡',
			relatedChartId: null,
			component: MapCarTypes
		},
		{
			id: 'solar-installations',
			titleKey: 'ui.map.solarInstallations',
			titleFallback: 'Photovoltaik-Anlagen',
			category: 'energy',
			icon: '☀️',
			relatedChartId: '31a5ca7c-08cf-487c-b2ab-aa04f9d2cd6f',
			component: MapSolar
		},
		{
			id: 'wind-power',
			titleKey: 'ui.map.windPower',
			titleFallback: 'Windkraftanlagen',
			category: 'energy',
			icon: '💨',
			relatedChartId: '1e135ce2-06d2-4eae-b8f8-fdb4cbae910c',
			component: MapWind
		}
	];

	const categories = {
		energy: { labelKey: 'domain.sector.energy', labelFallback: 'Energie', color: 'bg-yellow-500' },
		mobility: {
			labelKey: 'domain.sector.mobility',
			labelFallback: 'Mobilität',
			color: 'bg-blue-500'
		}
	};

	// Helper to get translated layer title
	function getLayerTitle(layer) {
		return t(translations, layer.titleKey) !== layer.titleKey
			? t(translations, layer.titleKey)
			: layer.titleFallback;
	}

	// Helper to get translated category label
	function getCategoryLabel(categoryId) {
		const cat = categories[categoryId];
		return t(translations, cat.labelKey) !== cat.labelKey
			? t(translations, cat.labelKey)
			: cat.labelFallback;
	}

	const COUNTRY_CODE = PUBLIC_VERSION.toUpperCase();
	const defaultView = {
		AT: { center: [13.333, 47.5], zoom: 6 },
		DE: { center: [10.45, 51.1657], zoom: 5 }
	};
	const { center, zoom } = defaultView[COUNTRY_CODE] || defaultView.DE;

	// Dark mode detection
	function detectDarkMode() {
		if (typeof document !== 'undefined') {
			return document.body.classList.contains('dark');
		}
		return false;
	}

	// Get basemap style URL based on dark mode
	function getBasemapStyle(dark) {
		return dark
			? 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
			: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
	}

	onMount(() => {
		isDarkMode = detectDarkMode();

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

		map.on('load', () => {
			// Add CARTO basemap
			const basemapTiles = isDarkMode
				? [
						'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
						'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
						'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
						'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
					]
				: [
						'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
						'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
						'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
						'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
					];

			map.addSource('carto-basemap', {
				type: 'raster',
				tiles: basemapTiles,
				tileSize: 256,
				maxzoom: 20
			});

			map.addLayer({
				id: 'carto-basemap',
				type: 'raster',
				source: 'carto-basemap',
				paint: { 'raster-opacity': 1 }
			});

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
				paint: {
					'text-color': isDarkMode ? '#fff' : '#000',
					'text-halo-color': isDarkMode ? '#000' : '#fff',
					'text-halo-width': 1
				},
				minzoom: 4,
				maxzoom: 9
			});

			mapReady = true;
		});

		// Watch for dark mode changes
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.attributeName === 'class') {
					const newDarkMode = detectDarkMode();
					if (newDarkMode !== isDarkMode && map) {
						isDarkMode = newDarkMode;
						updateBasemap();
					}
				}
			}
		});
		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

		return () => {
			observer.disconnect();
			if (map) {
				map.remove();
			}
		};
	});

	function updateBasemap() {
		if (!map) return;

		const basemapTiles = isDarkMode
			? [
					'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
					'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
					'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
					'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
				]
			: [
					'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
				];

		// Update the source tiles - keep the source, just update tiles
		const source = map.getSource('carto-basemap');
		if (source && source.type === 'raster') {
			// Remove and re-add the layer with new tiles
			if (map.getLayer('carto-basemap')) {
				map.removeLayer('carto-basemap');
			}
			map.removeSource('carto-basemap');

			map.addSource('carto-basemap', {
				type: 'raster',
				tiles: basemapTiles,
				tileSize: 256,
				maxzoom: 20
			});

			// Get the first layer id to insert before (should be city-labels or first data layer)
			const firstLayerId = map.getStyle().layers[0]?.id;

			// Re-add the layer at the very bottom (before all other layers)
			map.addLayer(
				{
					id: 'carto-basemap',
					type: 'raster',
					source: 'carto-basemap',
					paint: { 'raster-opacity': 1 }
				},
				firstLayerId
			);
		}

		// Update label colors
		if (map.getLayer('city-labels')) {
			map.setPaintProperty('city-labels', 'text-color', isDarkMode ? '#fff' : '#000');
			map.setPaintProperty('city-labels', 'text-halo-color', isDarkMode ? '#000' : '#fff');
		}
	}

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

	function handleRelatedChartClick(chartId) {
		dispatch('close');
		dispatch('scrollToChart', { chartId });
	}

	$: selectedLayerData = mapLayers.find((l) => l.id === selectedLayer);
	$: LayerComponent = selectedLayerData?.component;

	// Generate embed code for the current map view
	$: embedUrl = `https://klimadashboard.${PUBLIC_VERSION}/embed/maps/${selectedLayer}?region=${regionId}&regionName=${encodeURIComponent(regionName)}`;
	$: embedCode = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" style="border-radius: 8px;"></iframe>`;

	function openEmbedModal() {
		showEmbedModal = true;
	}

	function closeEmbedModal() {
		showEmbedModal = false;
	}

	async function copyEmbedCode() {
		try {
			await navigator.clipboard.writeText(embedCode);
			embedCopied = true;
			setTimeout(() => (embedCopied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
	transition:fade={{ duration: 200 }}
	on:click={handleClose}
	role="button"
	tabindex="-1"
	aria-label={t(translations, 'action.close') !== 'action.close'
		? t(translations, 'action.close')
		: 'Schließen'}
>
	<div
		class="absolute inset-x-0 bottom-0 top-16 lg:left-4 lg:right-4 lg:bottom-4 bg-white dark:bg-gray-900 rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
		transition:fly={{ y: '100%', duration: 400, easing: cubicOut }}
		on:click={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="map-title"
	>
		<!-- Sidebar -->
		<aside
			class="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 overflow-y-auto flex-shrink-0 max-h-[40vh] lg:max-h-full"
		>
			<div class="p-4 lg:p-6">
				<div class="flex items-center justify-between mb-4 lg:mb-6">
					<h2 id="map-title" class="text-xl lg:text-2xl font-bold">
						{t(translations, 'ui.map.explorer') !== 'ui.map.explorer'
							? t(translations, 'ui.map.explorer')
							: 'Karten-Explorer'}
					</h2>
					<button
						on:click={handleClose}
						class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						aria-label={t(translations, 'action.close') !== 'action.close'
							? t(translations, 'action.close')
							: 'Schließen'}
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
					<div class="mb-4 lg:mb-6">
						<h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
							{getCategoryLabel(categoryId)}
						</h3>
						<div class="space-y-1">
							{#each mapLayers.filter((l) => l.category === categoryId) as layer}
								<div class="relative">
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
												<div class="font-medium text-sm">{getLayerTitle(layer)}</div>
												{#if !layer.component}
													<div class="text-xs text-gray-500 dark:text-gray-400">
														{t(translations, 'ui.map.comingSoon') !== 'ui.map.comingSoon'
															? t(translations, 'ui.map.comingSoon')
															: 'Bald verfügbar'}
													</div>
												{/if}
											</div>
											<div class="flex items-center gap-2">
												{#if selectedLayer === layer.id}
													<!-- Embed button -->
													<button
														on:click|stopPropagation={openEmbedModal}
														class="p-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors"
														title={t(translations, 'action.embed') !== 'action.embed'
															? t(translations, 'action.embed')
															: 'Einbetten'}
													>
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
															<polyline points="7 8 3 12 7 16" />
															<polyline points="17 8 21 12 17 16" />
															<line x1="14" y1="4" x2="10" y2="20" />
														</svg>
													</button>
													{#if layer.relatedChartId}
														<button
															on:click|stopPropagation={() =>
																handleRelatedChartClick(layer.relatedChartId)}
															class="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
															title={t(translations, 'ui.map.goToChart') !== 'ui.map.goToChart'
																? t(translations, 'ui.map.goToChart')
																: 'Zur Datenvisualisierung'}
														>
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
																<path d="M3 3v18h18" />
																<path d="M18 17V9" />
																<path d="M13 17V5" />
																<path d="M8 17v-3" />
															</svg>
														</button>
													{/if}
												{/if}
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
										</div>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</aside>

		<!-- Map Container -->
		<div class="flex-1 relative bg-gray-50 dark:bg-gray-950">
			<div bind:this={mapContainer} class="w-full h-full absolute inset-0"></div>

			<!-- Layer Component Overlay -->
			{#if mapReady && LayerComponent}
				<div class="absolute inset-0 pointer-events-none">
					<svelte:component this={LayerComponent} {map} {regionId} {regionName} {regionCode} {regionCodeShort} {regionLayer} {isDarkMode} />
				</div>
			{:else if mapReady && !LayerComponent}
				<!-- Placeholder for unimplemented layers -->
				<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div
						class="p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-xl pointer-events-auto"
					>
						<div class="text-6xl mb-4">{selectedLayerData?.icon}</div>
						<h3 class="text-xl font-semibold mb-2">{getLayerTitle(selectedLayerData)}</h3>
						<p class="text-gray-600 dark:text-gray-400">
							{t(translations, 'ui.map.comingSoonLong') !== 'ui.map.comingSoonLong'
								? t(translations, 'ui.map.comingSoonLong')
								: 'Diese Kartenebene wird in Kürze verfügbar sein.'}
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Embed Modal -->
{#if showEmbedModal}
	<div
		class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
		transition:fade={{ duration: 150 }}
		on:click={closeEmbedModal}
		role="button"
		tabindex="-1"
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6"
			on:click|stopPropagation
			role="dialog"
			aria-modal="true"
			aria-labelledby="embed-title"
		>
			<div class="flex items-center justify-between mb-4">
				<h3 id="embed-title" class="text-lg font-bold">
					{t(translations, 'ui.embed.title') !== 'ui.embed.title'
						? t(translations, 'ui.embed.title')
						: 'Karte einbetten'}
				</h3>
				<button
					on:click={closeEmbedModal}
					class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M18 6L6 18" />
						<path d="M6 6l12 12" />
					</svg>
				</button>
			</div>

			<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
				{t(translations, 'ui.embed.mapDescription') !== 'ui.embed.mapDescription'
					? t(translations, 'ui.embed.mapDescription')
					: 'Kopiere den Code unten, um diese Karte auf deiner Website einzubetten.'}
			</p>

			<div class="relative">
				<pre
					class="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">{embedCode}</pre>
				<button
					on:click={copyEmbedCode}
					class="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-md shadow hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
					title={t(translations, 'action.copy') !== 'action.copy'
						? t(translations, 'action.copy')
						: 'Kopieren'}
				>
					{#if embedCopied}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="text-green-600"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
						</svg>
					{/if}
				</button>
			</div>

			<div class="mt-4 flex justify-end">
				<button
					on:click={closeEmbedModal}
					class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
				>
					{t(translations, 'action.close') !== 'action.close'
						? t(translations, 'action.close')
						: 'Schließen'}
				</button>
			</div>
		</div>
	</div>
{/if}

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
