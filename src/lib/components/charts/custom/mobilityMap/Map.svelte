<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	export let selectedRegion;

	let map;
	let stopsSourceId = 'stops-json';
	let minStopsZoom = 12;
	let hoveredId = null;
	let selectedId = null;

	const vectorTilesURL = 'https://tiles.klimadashboard.org/data/pt_mismatch_all';

	const updateFeatureState = (id, newState) => {
		if (!map || id == null) return;
		const current = map.getFeatureState({ source: 'bivariate', sourceLayer: 'ptmismatch', id });
		const changed = Object.entries(newState).some(([k, v]) => current[k] !== v);
		if (changed) {
			map.setFeatureState({ source: 'bivariate', sourceLayer: 'ptmismatch', id }, newState);
		}
	};

	async function updateStops() {
		if (!map || map.getZoom() < minStopsZoom) {
			map.getSource(stopsSourceId)?.setData({
				type: 'FeatureCollection',
				features: []
			});
			return;
		}

		const center = map.getCenter();
		const response = await fetch(
			`https://base.klimadashboard.org/get-nearby-stops?lat=${center.lat}&lon=${center.lng}&radius_km=10`
		);
		const stops = await response.json();

		const features = stops.map((stop) => ({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: stop.center
			},
			properties: {
				id: stop.id,
				name: stop.name,
				code: stop.code,
				category: stop.category,
				interval: stop.interval,
				lines: stop.lines
			}
		}));

		map.getSource(stopsSourceId)?.setData({
			type: 'FeatureCollection',
			features
		});
	}

	onMount(() => {
		map = new maplibregl.Map({
			container: 'mobilityMap',
			style: {
				version: 8,
				sources: {
					carto: {
						type: 'raster',
						tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors © CARTO'
					}
				},
				layers: [
					{
						id: 'carto-basemap',
						type: 'raster',
						source: 'carto',
						minzoom: 0,
						maxzoom: 22
					}
				]
			},
			center: [13.3, 47.5],
			zoom: 7,
			minZoom: 5,
			maxZoom: 14
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');

		map.on('load', () => {
			map.addSource('bivariate', {
				type: 'vector',
				tiles: [`${vectorTilesURL}/{z}/{x}/{y}.pbf`],
				tileSize: 512,
				minzoom: 5,
				maxzoom: 14
			});

			map.addLayer({
				id: 'bivariate-layer',
				type: 'fill',
				source: 'bivariate',
				'source-layer': 'ptmismatch',
				paint: {
					'fill-color': [
						'match',
						[
							'+',
							['*', ['min', 2, ['floor', ['/', ['get', 'pop'], 10]]], 3],
							['min', 2, ['floor', ['/', ['get', 'pt'], 2]]]
						],
						0,
						'#deebf7',
						1,
						'#c6dbef',
						2,
						'#9ecae1',
						3,
						'#fcbba1',
						4,
						'#bdbdbd',
						5,
						'#a1d99b',
						6,
						'#fb6a4a',
						7,
						'#fcae91',
						8,
						'#41ab5d',
						'#ffffff'
					],
					'fill-opacity': 0.5
				}
			});

			map.addLayer({
				id: 'bivariate-outline',
				type: 'line',
				source: 'bivariate',
				'source-layer': 'ptmismatch',
				filter: [
					'any',
					['boolean', ['feature-state', 'selected'], false],
					['boolean', ['feature-state', 'hover'], false],
					['boolean', ['feature-state', 'nearby'], false]
				],
				paint: {
					'line-color': [
						'case',
						['boolean', ['feature-state', 'selected'], true],
						'#000',
						['boolean', ['feature-state', 'hover'], true],
						'#666',
						['boolean', ['feature-state', 'nearby'], true],
						'#999',
						'#000'
					],
					'line-width': [
						'case',
						['boolean', ['feature-state', 'selected'], true],
						2,
						['boolean', ['feature-state', 'hover'], true],
						1,
						['boolean', ['feature-state', 'nearby'], true],
						1,
						0
					],
					'line-opacity': 1
				}
			});

			map.addSource('austria-mask', {
				type: 'geojson',
				data: 'https://data.klimadashboard.org/at/austria.json'
			});

			map.addLayer({
				id: 'outside-austria-mask',
				type: 'fill',
				source: 'austria-mask',
				paint: {
					'fill-color': '#ffffff',
					'fill-opacity': 1
				},
				filter: ['!=', '$type', 'Polygon']
			});

			map.addSource(stopsSourceId, {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: []
				}
			});

			map.addLayer({
				id: 'stops-layer',
				type: 'circle',
				source: stopsSourceId,
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 4],
					'circle-color': [
						'match',
						['get', 'category'],
						'I',
						'#67001f',
						'II',
						'#980043',
						'III',
						'#ce1256',
						'IV',
						'#e7298a',
						'V',
						'#ab47bc',
						'VI',
						'#5c6bc0',
						'VII',
						'#26c6da',
						'VIII',
						'#ffca28',
						'#9e9e9e'
					],
					'circle-stroke-color': '#ffffff',
					'circle-stroke-width': 1
				}
			});

			map.on('mousemove', 'bivariate-layer', (e) => {
				if (e.features.length > 0) {
					if (hoveredId !== null) {
						updateFeatureState(hoveredId, { hover: false });
					}
					hoveredId = e.features[0].id;
					updateFeatureState(hoveredId, { hover: true });
				}
			});

			map.on('mouseleave', 'bivariate-layer', () => {
				if (hoveredId !== null) {
					updateFeatureState(hoveredId, { hover: false });
				}
				hoveredId = null;
			});

			map.on('click', async (e) => {
				if (map.getZoom() < 10) return;

				const features = map.queryRenderedFeatures(e.point, { layers: ['bivariate-layer'] });
				if (features.length === 0) return;

				const feature = features[0];
				const coords = e.lngLat;
				const props = feature.properties;

				// Clear previous selection/nearby
				map.queryRenderedFeatures({ layers: ['bivariate-layer'] }).forEach((f) => {
					updateFeatureState(f.id, { selected: false, nearby: false });
				});

				selectedId = feature.id;
				updateFeatureState(selectedId, { selected: true });

				// Highlight "star" around selected
				const getCenter = (f) => {
					const ring = f.geometry.coordinates?.[0];
					if (!ring) return [0, 0];
					const x = (ring[0][0] + ring[2][0]) / 2;
					const y = (ring[0][1] + ring[2][1]) / 2;
					return [x, y];
				};

				const [cx, cy] = getCenter(feature);
				map.queryRenderedFeatures({ layers: ['bivariate-layer'] }).forEach((f) => {
					if (f.id === selectedId) return;
					const [fx, fy] = getCenter(f);
					const dx = Math.abs(fx - cx);
					const dy = Math.abs(fy - cy);
					const isNearby = (dx === 0 || dy === 0) && dx <= 0.08 && dy <= 0.08;
					if (isNearby) updateFeatureState(f.id, { nearby: true });
				});

				map.flyTo({
					center: coords,
					zoom: Math.max(map.getZoom(), 14)
				});

				const response = await fetch(
					`https://base.klimadashboard.org/get-nearby-stops?lat=${coords.lat}&lon=${coords.lng}&radius_km=0.5`
				);
				const nearbyStops = await response.json();

				selectedRegion = {
					coordinates: [coords.lng, coords.lat],
					geometry: feature.geometry,
					properties: {
						pop: props.pop,
						pt: props.pt,
						mismatch: props.mismatch,
						nearbyStops
					}
				};
			});

			updateStops();
		});

		map.on('moveend', () => updateStops());
		map.on('zoom', () => updateStops());
	});
</script>

<div id="mobilityMap" class="relative">
	<div class="absolute top-2 p-1 left-2 text-xs flex items-center gap-3 z-20 bg-white">
		<div class="flex gap-1 items-center">
			<span style="background:#c6dbef" class="w-4 h-4 block"></span> <span>Low mismatch</span>
		</div>
		<div class="flex gap-1 items-center">
			<span style="background:#fb6a4a" class="w-4 h-4 block"></span> <span>High mismatch</span>
		</div>
		<div class="flex gap-1 items-center">
			<span style="background:#41ab5d" class="w-4 h-4 block"></span> <span>Excellent match</span>
		</div>
		<div>(preview version)</div>
	</div>
</div>

<style>
	#mobilityMap {
		width: 100%;
		height: 60vh;
	}
	.controls {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 10;
		background: white;
		padding: 0.5rem;
		border-radius: 4px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}
	select {
		font-size: 1rem;
		padding: 0.25rem;
	}
</style>
