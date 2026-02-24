<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import MapCarsDensity from '../../../(main)/[[lang=lang]]/regions/[id]/maps/MapCarsDensity.svelte';
	import MapCarTypes from '../../../(main)/[[lang=lang]]/regions/[id]/maps/MapCarTypes.svelte';
	import MapSolar from '../../../(main)/[[lang=lang]]/regions/[id]/maps/MapSolar.svelte';
	import MapWind from '../../../(main)/[[lang=lang]]/regions/[id]/maps/MapWind.svelte';

	// Get layer ID from URL params
	$: layerId = $page.params.layerId;

	// Query params for customization
	$: regionId = $page.url.searchParams.get('region') || undefined;
	$: regionName = $page.url.searchParams.get('regionName') || '';
	$: bgColor = $page.url.searchParams.get('bgcolor') || 'f9fafb';
	$: zoom = parseFloat($page.url.searchParams.get('zoom') || '6');
	$: lat = parseFloat($page.url.searchParams.get('lat') || '51.1657');
	$: lng = parseFloat($page.url.searchParams.get('lng') || '10.4515');

	// Map layer registry
	const mapLayers = {
		'car-density': { component: MapCarsDensity, title: 'PKW-Dichte' },
		'car-types': { component: MapCarTypes, title: 'PKW-Antriebsarten' },
		'solar-installations': { component: MapSolar, title: 'Photovoltaik-Anlagen' },
		'wind-power': { component: MapWind, title: 'Windkraftanlagen' }
	};

	let mapContainer;
	let map;
	let mapReady = false;
	let isDarkMode = false;

	$: layerConfig = mapLayers[layerId];
	$: LayerComponent = layerConfig?.component;

	// Detect dark mode
	onMount(() => {
		isDarkMode = document.body.classList.contains('dark');

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.attributeName === 'class') {
					isDarkMode = document.body.classList.contains('dark');
					updateBasemap();
				}
			}
		});
		observer.observe(document.body, { attributes: true });

		// Initialize map
		initMap();

		// Report height for auto-resize embeds
		reportHeight();

		return () => {
			observer.disconnect();
			map?.remove();
		};
	});

	function initMap() {
		const basemapStyle = isDarkMode
			? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
			: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

		map = new maplibregl.Map({
			container: mapContainer,
			style: basemapStyle,
			center: [lng, lat],
			zoom: zoom,
			attributionControl: false
		});

		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
		map.addControl(
			new maplibregl.AttributionControl({
				compact: true,
				customAttribution: '© Klimadashboard'
			}),
			'bottom-left'
		);

		map.on('load', () => {
			mapReady = true;
		});
	}

	function updateBasemap() {
		if (!map) return;
		const basemapStyle = isDarkMode
			? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
			: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
		map.setStyle(basemapStyle);
		map.once('style.load', () => {
			mapReady = true;
		});
	}

	function reportHeight() {
		const height = document.body.scrollHeight;
		window.parent.postMessage(
			{
				type: 'klimadashboard-resize',
				chartId: `map-${layerId}`,
				height: Math.ceil(height)
			},
			'*'
		);
	}
</script>

<svelte:head>
	<title>{layerConfig?.title || 'Karte'} | Klimadashboard</title>
</svelte:head>

<main class="w-full h-screen relative" style="background-color: #{bgColor}">
	<div bind:this={mapContainer} class="w-full h-full absolute inset-0"></div>

	{#if mapReady && LayerComponent}
		<div class="absolute inset-0 pointer-events-none">
			<svelte:component this={LayerComponent} {map} {regionId} {regionName} {isDarkMode} />
		</div>
	{:else if !layerConfig}
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="p-8 text-center bg-white dark:bg-gray-800 rounded-xl shadow-xl">
				<h3 class="text-xl font-semibold mb-2">Karte nicht gefunden</h3>
				<p class="text-gray-600 dark:text-gray-400">
					Die angeforderte Kartenebene "{layerId}" existiert nicht.
				</p>
				<p class="text-sm text-gray-500 mt-4">
					Verfügbare Karten: {Object.keys(mapLayers).join(', ')}
				</p>
			</div>
		</div>
	{/if}

	<!-- Branding Footer -->
	<div class="absolute bottom-2 right-2 z-50 pointer-events-auto">
		<a
			href="https://klimadashboard.org"
			target="_blank"
			rel="noopener"
			class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
			</svg>
			klimadashboard.org
		</a>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
