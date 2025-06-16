<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import { buildTileOutlines } from './mapUtils';

	export let selectedRegion;
	export let selectedTiles = [];

	let map;
	let stopsSourceId = 'stops-json';
	let minStopsZoom = 12;
	let hoveredId = null;
	let selectedId = null;

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

	const gueteklassColors = {
		none: '#f0f0f0',
		G: '#d73027',
		F: '#fc8d59',
		E: '#fee08b',
		D: '#d9ef8b',
		C: '#91cf60',
		B: '#1a9850',
		A: '#006837'
	};

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

	function getFillColor(mode) {
		if (mode === 'pop') {
			return [
				'interpolate',
				['linear'],
				['get', 'pop'],
				0,
				'#deebf7',
				10,
				'#9ecae1',
				20,
				'#2171b5'
			];
		} else if (mode === 'pt') {
			return ['interpolate', ['linear'], ['get', 'pt'], 0, '#edf8e9', 2, '#a1d99b', 4, '#31a354'];
		} else {
			const popClass = ['min', 2, ['floor', ['/', ['get', 'pop'], 10]]];
			const ptClass = ['min', 4, ['floor', ['/', ['get', 'pt'], 1]]];

			return [
				'case',
				['==', popClass, 0],
				[
					'interpolate',
					['linear'],
					ptClass,
					0,
					'#deebf7',
					1,
					'#c6dbef',
					2,
					'#9ecae1',
					3,
					'#6baed6',
					4,
					'#2171b5'
				],
				['==', popClass, 1],
				[
					'interpolate',
					['linear'],
					ptClass,
					0,
					'#fcbba1',
					1,
					'#e79a8f',
					2,
					'#bdbdbd',
					3,
					'#a1d99b',
					4,
					'#74c476'
				],
				['==', popClass, 2],
				[
					'interpolate',
					['linear'],
					ptClass,
					0,
					'#fb6a4a',
					1,
					'#fa836c',
					2,
					'#fcae91',
					3,
					'#82a360',
					4,
					'#41ab5d'
				],
				'#ffffff'
			];
		}
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
			maxZoom: 14
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');
		map.scrollZoom.disable();

		map.on('load', () => {
			// add vector source
			map.addSource('mobility-source', {
				type: 'vector',
				tiles: [`${vectorTilesURL}/{z}/{x}/{y}.pbf`],
				minzoom: 4,
				maxzoom: 14
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
					'fill-opacity': 0.6
				}
			});

			// optional: add outline
			map.addLayer({
				id: 'gueteklass-outline',
				type: 'line',
				source: 'mobility-source',
				'source-layer': 'ptmismatch',
				paint: {
					'line-color': '#ffffff',
					'line-width': 0.5
				}
			});
		});
	});
</script>

<div id="mobilityMap" class="relative">
	<div class="absolute top-2 p-1 left-2 text-xs flex items-center gap-3 z-20 bg-white">
		{#each Object.values(gueteklassColors) as color, i}
			<div class="flex gap-1 items-center">
				<span style="background:{color}" class="w-4 h-4 block"></span>
				<span>{Object.keys(gueteklassColors)[i]}</span>
			</div>
		{/each}
	</div>

	<div class="absolute top-2 right-10 z-20 p-2 bg-white bg-opacity-90 text-xs rounded shadow">
		<div class="mb-1 font-semibold">Interval (min)</div>
		<div class="flex items-center gap-1">
			<span class="w-3 h-3" style="background: #eff3ff"></span>
			<span>0</span>
			<span class="flex-1 h-1 bg-gradient-to-r from-[#eff3ff] via-[#bdd7e7] to-[#2171b5] mx-2"
			></span>
			<span>60+</span>
		</div>
	</div>
</div>

<style>
	#mobilityMap {
		width: 100%;
		height: 60vh;
	}
</style>
