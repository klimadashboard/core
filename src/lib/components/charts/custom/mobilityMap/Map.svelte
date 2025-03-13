<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { MapboxOverlay } from '@deck.gl/mapbox';
	import { GeoJsonLayer } from '@deck.gl/layers';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let map;
	const geojsonUrl = 'https://base.klimadashboard.org/assets/0e40312a-8bf0-4ba9-99a3-9a6a0e2ff2c7';

	const colorScale = {
		1: [255, 255, 0, 150], // A - Yellow
		2: [255, 200, 0, 150], // B
		3: [255, 150, 50, 150], // C
		4: [255, 100, 100, 150], // D
		5: [200, 50, 150, 150], // E
		6: [150, 0, 200, 150], // F
		7: [100, 0, 150, 150] // G - Dark Purple
	};

	async function loadMap() {
		try {
			console.log('Initializing MapLibre...');

			// ✅ Create MapLibre Map
			map = new maplibregl.Map({
				container: 'mobilityMap',
				style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
				center: [13.3333, 47.5162], // Centering Austria
				zoom: 6
			});

			// ✅ Make sure the map is fully loaded
			map.on('load', async () => {
				console.log('MapLibre Loaded!');

				// ✅ Fetch external dataset
				const response = await fetch(geojsonUrl);
				if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

				const geojson = await response.json();
				console.log('Loaded External GeoJSON:', geojson);

				// ✅ Ensure there are features
				if (!geojson.features || geojson.features.length === 0) {
					throw new Error('GeoJSON has no features!');
				}

				// ✅ Ensure polygons exist
				const validPolygons = geojson.features.filter(
					(feature) =>
						feature.geometry &&
						(feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
				);

				console.log('Valid polygons:', validPolygons.length);

				if (validPolygons.length === 0) {
					console.error('No valid Polygon/MultiPolygon features found!');
				}

				// 🎨 Helper function to assign colors based on MIN_katego
				function getFillColor(feature) {
					const category = feature.properties?.MIN_katego;
					if (category === undefined || category === null || !(category in colorScale)) {
						console.warn('Invalid MIN_katego:', category, 'Feature:', feature);
						return [100, 100, 100, 150]; // Default gray
					}
					return colorScale[category];
				}

				// ✅ Create Deck.gl GeoJsonLayer for the external dataset
				const geoJsonLayer = new GeoJsonLayer({
					id: 'geojson-layer',
					data: validPolygons.map((feature, index) => ({
						...feature,
						id: feature.id ?? `feature-${index}` // Ensure ID exists
					})),
					filled: true,
					getFillColor: getFillColor,
					getLineColor: [255, 255, 255, 200], // White borders
					getLineWidth: 1,
					pickable: true,
					autoHighlight: true
				});

				// ✅ Add both layers to Deck.gl
				const deckOverlay = new MapboxOverlay({
					layers: [geoJsonLayer]
				});

				console.log('Adding Deck.gl overlay...');
				map.addControl(deckOverlay);

				// ✅ Force Deck.gl to render
				console.log('Deck.gl should now be rendering...');
			});
		} catch (error) {
			console.error('Error loading map data:', error);
		}
	}

	onMount(loadMap);
</script>

<div id="mobilityMap"></div>

<style>
	#mobilityMap {
		width: 100%;
		height: 100vh;
	}
</style>
