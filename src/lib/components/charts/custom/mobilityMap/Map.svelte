<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import { buildTileOutlines } from './mapUtils';

	export let selectedRegion;
	export let selectedTiles = [];
	export let gueteklassColors;

	let map;
	let stopsSourceId = 'stops-json';
	let minStopsZoom = 12;
	let hoveredId = null;
	let selectedId = null;

	const categories = [
		{
			category: 'I',
			gueteklass: 'A'
		},
		{
			category: 'II',
			gueteklass: 'B'
		},
		{
			category: 'III',
			gueteklass: 'C'
		},
		{
			category: 'IV',
			gueteklass: 'D'
		},
		{
			category: 'V',
			gueteklass: 'E'
		},
		{
			category: 'VI',
			gueteklass: 'F'
		},
		{
			category: 'VII',
			gueteklass: 'G'
		},
		{
			category: null,
			gueteklass: 'none'
		}
	];

	function pointInPolygon(point, polygon) {
		const [x, y] = point;
		let inside = false;
		const ring = polygon[0]; // assuming outer ring only

		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			const xi = ring[i][0],
				yi = ring[i][1];
			const xj = ring[j][0],
				yj = ring[j][1];

			const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
			if (intersect) inside = !inside;
		}

		return inside;
	}

	const vectorTilesURL = 'https://tiles.klimadashboard.org/data/mobility-at';
	const MAPTILER_KEY = 'C9NLXahOLRDRQl9OB6yH'; // <-- replace with your API key

	const clearSelectedStates = () => {
		selectedTiles.forEach((tile) => {
			if (tile.id != null) updateFeatureState(tile.id, { selected: false });
		});
		selectedTiles = [];

		if (map && map.getSource('selected-outline')) {
			map.getSource('selected-outline').setData({
				type: 'FeatureCollection',
				features: []
			});
		}
	};

	const setSelectedTiles = (features) => {
		clearSelectedStates();

		selectedTiles = features.map((f) => ({
			id: f.id,
			properties: f.properties,
			geometry: f.geometry
		}));

		selectedTiles.forEach((tile) => {
			if (tile.id != null) updateFeatureState(tile.id, { selected: true });
		});

		if (map && map.getSource('selected-outline')) {
			const outlineGeoJSON = buildTileOutlines(selectedTiles);
			map.getSource('selected-outline').setData(outlineGeoJSON);
		}
	};

	const updateFeatureState = (id, newState) => {
		if (!map || id == null) return;
		const current = map.getFeatureState({ source: 'mobility-source', sourceLayer: 'merged', id });
		const changed = Object.entries(newState).some(([k, v]) => current[k] !== v);
		if (changed) {
			map.setFeatureState({ source: 'mobility-source', sourceLayer: 'merged', id }, newState);
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
				gueteklass: categories.find((d) => d.category == stop.category)?.gueteklass,
				interval: stop.interval,
				lines: stop.lines
			}
		}));

		console.log(features);

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
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
				sources: {
					carto: {
						type: 'raster',
						tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors © CARTO'
					},
					labels: {
						type: 'vector',
						url: 'https://tiles.klimadashboard.org/data/labels-' + PUBLIC_VERSION + '.json'
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
			maxZoom: 16
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');
		map.scrollZoom.disable();

		map.on('load', () => {
			// add vector source
			map.addSource('mobility-source', {
				type: 'vector',
				tiles: [`${vectorTilesURL}/{z}/{x}/{y}.pbf`],
				minzoom: 4,
				maxzoom: 12
			});

			// add fill layer for gueteklass
			map.addLayer({
				id: 'gueteklass-layer',
				type: 'fill',
				source: 'mobility-source',
				'source-layer': 'merged',
				paint: {
					'fill-color': [
						'match',
						['get', 'gueteklass'],
						'none',
						gueteklassColors.none,
						'G',
						gueteklassColors.G,
						'F',
						gueteklassColors.F,
						'E',
						gueteklassColors.E,
						'D',
						gueteklassColors.D,
						'C',
						gueteklassColors.C,
						'B',
						gueteklassColors.B,
						'A',
						gueteklassColors.A,
						'#ffffff' // fallback
					],
					'fill-opacity': 0.5
				}
			});

			map.addLayer({
				id: 'hover-outline',
				type: 'line',
				source: 'mobility-source',
				'source-layer': 'merged',
				paint: {
					'line-color': '#000',
					'line-width': [
						'case',
						[
							'any',
							['boolean', ['feature-state', 'hover'], false],
							['boolean', ['feature-state', 'selected'], false]
						],
						2,
						0
					]
				}
			});

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
					'text-color': '#000',
					'text-halo-color': '#fff',
					'text-halo-width': 1
				},
				minzoom: 4,
				maxzoom: 9
			});

			// stops
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
					'circle-radius': 5,
					'circle-color': [
						'match',
						['get', 'gueteklass'],
						'none',
						gueteklassColors.none,
						'G',
						gueteklassColors.G,
						'F',
						gueteklassColors.F,
						'E',
						gueteklassColors.E,
						'D',
						gueteklassColors.D,
						'C',
						gueteklassColors.C,
						'B',
						gueteklassColors.B,
						'A',
						gueteklassColors.A,
						'#ccc' // fallback
					],
					'circle-stroke-color': '#fff',
					'circle-stroke-width': 1,
					'circle-blur': 0.5,
					'circle-opacity': 0.9
				},
				minzoom: minStopsZoom
			});
		});

		map.on('mousemove', 'gueteklass-layer', (e) => {
			if (e.features.length > 0) {
				if (hoveredId !== null) {
					map.setFeatureState(
						{ source: 'mobility-source', sourceLayer: 'merged', id: hoveredId },
						{ hover: false }
					);
				}
				hoveredId = e.features[0].id;
				map.setFeatureState(
					{ source: 'mobility-source', sourceLayer: 'merged', id: hoveredId },
					{ hover: true }
				);
			}
		});

		map.on('mouseenter', 'gueteklass-layer', () => {
			map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', 'gueteklass-layer', () => {
			map.getCanvas().style.cursor = '';
			if (hoveredId !== null) {
				map.setFeatureState(
					{ source: 'mobility-source', sourceLayer: 'merged', id: hoveredId },
					{ hover: false }
				);
				hoveredId = null;
			}
		});

		map.on('moveend', updateStops);
		map.on('zoomend', updateStops);

		map.on('click', 'gueteklass-layer', (e) => {
			if (e.features.length > 0) {
				const feature = e.features[0];

				setSelectedTiles([feature]);
				selectedRegion = {
					id: feature.id,
					properties: feature.properties
				};

				const bounds = new maplibregl.LngLatBounds();
				feature.geometry.coordinates[0].forEach((coord) => bounds.extend(coord));
				map.fitBounds(bounds, { padding: 100, maxZoom: 13 });
			}
		});

		const center = page?.data?.region?.center;
		if (center) {
			map
				.querySourceFeatures('mobility-source', {
					sourceLayer: 'ptmismatch'
				})
				.forEach((f) => {
					if (
						f.geometry.type === 'Polygon' &&
						pointInPolygon(center.map(Number), f.geometry.coordinates)
					) {
						setSelectedTiles([f]);
						selectedRegion = {
							id: f.id,
							properties: f.properties
						};

						const bounds = new maplibregl.LngLatBounds();
						f.geometry.coordinates[0].forEach((coord) => bounds.extend(coord));
						map.fitBounds(bounds, { padding: 500, maxZoom: 13 });
					}
				});
		}
	});
</script>

<div id="mobilityMap" class="relative rounded-2xl overflow-hidden"></div>

<style>
	#mobilityMap {
		width: 100%;
		height: 60vh;
	}
</style>
