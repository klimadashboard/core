<script>
	import maplibregl from 'maplibre-gl';
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';

	const dispatch = createEventDispatcher();

	export let data;
	export let selectedStation;

	let map;
	let mapContainer;
	let mapLoaded = false;

	let MAPTILER_KEY = 'C9NLXahOLRDRQl9OB6yH';

	// Initialize the map
	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
				sources: {
					labels: {
						type: 'vector',
						url: 'https://tiles.klimadashboard.org/data/labels-' + PUBLIC_VERSION + '.json'
					}
				},
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: {
							'background-color': 'transparent'
						}
					}
				]
			},
			center: PUBLIC_VERSION === 'at' ? [13.5, 47.6] : [10.5, 51.2], // Center AT or DE
			zoom: PUBLIC_VERSION === 'at' ? 6 : 4.5,
			minZoom: 4,
			maxZoom: 10
		});

		map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
		map.scrollZoom.disable();

		map.on('load', () => {
			// Add country outline
			map.addSource('outline', {
				type: 'geojson',
				data: data.geo
			});

			map.addSource('carto-light', {
				type: 'raster',
				tiles: [
					'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
					'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
					'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
					'https://d.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
				],
				tileSize: 256,
				attribution:
					'© <a href="https://carto.com/">CARTO</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			});

			map.addLayer({
				id: 'carto-light-layer',
				type: 'raster',
				source: 'carto-light',
				minzoom: 0,
				maxzoom: 22
			});

			map.addLayer({
				id: 'outline-layer',
				type: 'line',
				source: 'outline',
				paint: {
					'line-color': '#000',
					'line-width': 1,
					'line-opacity': 0.2
				}
			});
			map.addLayer({
				id: 'background-layer',
				type: 'fill',
				source: 'outline',
				paint: {
					'fill-color': '#ffffff',
					'fill-opacity': 0.1
				}
			});

			// Add weather stations
			map.addSource('stations', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: data.stations.map((station) => ({
						type: 'Feature',
						properties: {
							id: station.id,
							height: station.height,
							name: station.name
						},
						geometry: {
							type: 'Point',
							coordinates: [station.longitude, station.latitude]
						}
					}))
				}
			});

			map.addLayer({
				id: 'stations-layer',
				type: 'circle',
				source: 'stations',
				paint: {
					'circle-radius': 5,
					'circle-color': [
						'interpolate',
						['linear'],
						['get', 'height'],
						0,
						'#209857',
						3000,
						'#fdea45'
					],
					'circle-opacity': 0.7
				}
			});

			// Selected station highlight
			map.addLayer({
				id: 'selected-station',
				type: 'circle',
				source: 'stations',
				filter: ['==', 'id', ''],
				paint: {
					'circle-radius': 8,
					'circle-color': '#C7495C',
					'circle-opacity': 0.9
				}
			});

			map.addLayer({
				id: 'station-labels',
				type: 'symbol',
				source: 'stations',
				layout: {
					'text-field': ['concat', ['get', 'name'], ' (', ['get', 'height'], ' m)'],
					'text-size': 12,
					'text-offset': [0, 0.7],
					'text-anchor': 'top',
					'text-allow-overlap': false // verhindert Überlappungen
				},
				paint: {
					'text-color': '#000',
					'text-halo-color': '#f0f0f0',
					'text-halo-width': 1
				}
			});

			map.addLayer({
				id: 'selected-station-label',
				type: 'symbol',
				source: 'stations',
				filter: ['==', 'id', ''], // dynamisch gesetzt
				layout: {
					'text-field': ['concat', ['get', 'name'], ' (', ['get', 'height'], ' m)'],
					'text-size': 12,
					'text-offset': [0, 0.7],
					'text-anchor': 'top',
					'text-allow-overlap': true // wichtig: überlappt andere Labels
				},
				paint: {
					'text-color': '#C7495C',
					'text-halo-color': '#fff',
					'text-halo-width': 1.5
				}
			});

			mapLoaded = true;

			map.on('click', 'stations-layer', (e) => {
				const feature = e.features[0];
				const id = feature.properties.id;
				const station = data.stations.find((s) => s.id == id);
				if (station) {
					dispatch('select', station);
				}
			});

			map.on('click', 'station-labels', (e) => {
				const feature = e.features[0];
				const id = feature.properties.id;
				const station = data.stations.find((s) => s.id == id);
				if (station) {
					dispatch('select', station);
				}
			});

			map.on('mouseenter', 'stations-layer', () => {
				map.getCanvas().style.cursor = 'pointer';
			});

			map.on('mouseenter', 'station-labels', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'stations-layer', () => {
				map.getCanvas().style.cursor = '';
			});
			map.on('mouseleave', 'station-labels', () => {
				map.getCanvas().style.cursor = '';
			});
		});
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	$: if (selectedStation?.id && mapLoaded) {
		map.setFilter('selected-station', ['==', 'id', selectedStation.id]);
		map.setFilter('selected-station-label', ['==', 'id', selectedStation.id]);

		map.flyTo({
			center: [selectedStation.longitude, selectedStation.latitude],
			zoom: 9
		});
	}

	$: if (
		localStorage.getItem('kd_region_coordinates') &&
		$page.url.pathname.includes('regions') &&
		mapLoaded
	) {
		const stored = localStorage.getItem('kd_region_coordinates');
		const [lng, lat] = stored.split(',').map(Number); // convert to numbers
		const coordinates = [lng, lat];

		map.flyTo({
			center: coordinates,
			zoom: 9
		});
	}
</script>

<div
	bind:this={mapContainer}
	class="map-container relative rounded-2xl mb-6"
	style="--map-height: {PUBLIC_VERSION === 'at' ? '24rem' : '24rem'}"
>
	<div
		class="bg-white dark:bg-gray-900 rounded-full p-1 flex items-center gap-1 z-20 text-current/70 absolute bottom-2 left-2 text-xs"
	>
		<span>Seehöhe: 0m</span>
		<div
			class="w-8 h-3 bg-gray-100 rounded-full"
			style="background: linear-gradient(90deg, #209857 0%, #fdea45 100%);"
		></div>
		<span>3.000m</span>
	</div>
</div>

<style>
	.map-container {
		width: 100%;
		height: var(--map-height);
	}
</style>
