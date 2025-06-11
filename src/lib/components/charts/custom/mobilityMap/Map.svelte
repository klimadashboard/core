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

	const vectorTilesURL = 'https://tiles.klimadashboard.org/data/pt_mismatch_all';
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
			map.addSource('bivariate', {
				type: 'vector',
				tiles: [`${vectorTilesURL}/{z}/{x}/{y}.pbf`],
				tileSize: 512,
				minzoom: 5,
				maxzoom: 14
			});

			// 1. Compute your original pop‐class (0–2) and pt‐class, but bump pt to 5 buckets (0–4)
			const popClass = ['min', 2, ['floor', ['/', ['get', 'pop'], 10]]];
			const ptClass = ['min', 4, ['floor', ['/', ['get', 'pt'], 1]]];

			map.addLayer({
				id: 'bivariate-layer',
				type: 'fill',
				source: 'bivariate',
				'source-layer': 'ptmismatch',
				paint: {
					'fill-color': getFillColor(),
					'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.8, 0.5]
				}
			});

			// Outline layer AFTER fill layer
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
						'#000000', // strong black for selected
						['boolean', ['feature-state', 'hover'], true],
						'#666666', // dark gray for hover
						['boolean', ['feature-state', 'nearby'], true],
						'#999999', // light gray for nearby
						'#000000'
					],
					'line-width': [
						'case',
						['boolean', ['feature-state', 'selected'], true],
						3, // thicker outline for selected
						['boolean', ['feature-state', 'hover'], true],
						1.5,
						['boolean', ['feature-state', 'nearby'], true],
						1,
						0
					],
					'line-opacity': [
						'case',
						['boolean', ['feature-state', 'selected'], true],
						0.6,
						['boolean', ['feature-state', 'hover'], true],
						0.8,
						['boolean', ['feature-state', 'nearby'], true],
						0.4,
						0
					]
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
						'interpolate',
						['linear'],
						['get', 'interval'],
						0,
						'#eff3ff',
						15,
						'#bdd7e7',
						30,
						'#6baed6',
						60,
						'#2171b5'
					],
					'circle-stroke-color': '#ffffff',
					'circle-stroke-width': 1
				}
			});

			map.addLayer({
				id: 'city-labels',
				source: 'labels',
				'source-layer': 'city-labels', // from Tippecanoe: -l city-labels
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
				minzoom: 4
			});

			const outline = page.data.page.outline || false;

			const bounds = outline.coordinates[0].reduce(
				(b, [lon, lat]) => b.extend([lon, lat]),
				new maplibregl.LngLatBounds(outline.coordinates[0][0], outline.coordinates[0][0])
			);
			map.fitBounds(bounds, { padding: 10, duration: 0 });

			if (outline && outline.type === 'Polygon') {
				// Zoom to the outline first
				const bounds = outline.coordinates[0].reduce(
					(b, [lon, lat]) => b.extend([lon, lat]),
					new maplibregl.LngLatBounds(outline.coordinates[0][0], outline.coordinates[0][0])
				);
				map.fitBounds(bounds, { padding: 10, duration: 0 });

				// Wait until tiles are loaded and rendered
				map.once('idle', () => {
					const tiles = map.queryRenderedFeatures({ layers: ['bivariate-layer'] });

					const selected = tiles.filter((tile) => {
						const coords = tile.geometry?.coordinates?.[0];
						if (!coords || coords.length < 3) return false;

						// Use centroid of tile (simplified bounding box)
						const x = (coords[0][0] + coords[2][0]) / 2;
						const y = (coords[0][1] + coords[2][1]) / 2;

						return pointInPolygon([x, y], outline.coordinates);
					});

					if (selected.length > 0) {
						setSelectedTiles(selected);
					}
				});
			}

			// Hover handling
			map.on('mousemove', 'bivariate-layer', (e) => {
				if (e.features.length > 0) {
					map.getCanvas().style.cursor = 'pointer';
					if (hoveredId !== null) {
						updateFeatureState(hoveredId, { hover: false });
					}
					hoveredId = e.features[0].id;
					updateFeatureState(hoveredId, { hover: true });
				}
			});

			map.on('mouseleave', 'bivariate-layer', () => {
				map.getCanvas().style.cursor = '';
				if (hoveredId !== null) {
					updateFeatureState(hoveredId, { hover: false });
				}
				hoveredId = null;
			});

			// Click handler
			map.on('click', async (e) => {
				if (map.getZoom() < 10) return;

				const features = map.queryRenderedFeatures(e.point, { layers: ['bivariate-layer'] });
				if (features.length === 0) return;

				const feature = features[0];
				if (feature.id == null) return;

				setSelectedTiles([feature]);
			});

			map.addSource('selected-outline', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: []
				}
			});

			map.addLayer({
				id: 'selected-outline-layer',
				type: 'line',
				source: 'selected-outline',
				paint: {
					'line-color': '#000',
					'line-width': 2,
					'line-opacity': 0.5
				}
			});

			updateStops();

			// Shift+Drag selection
			let dragStart = null;
			let dragBoxEl = null;

			map.on('mousedown', (e) => {
				if (!e.originalEvent.shiftKey) return;

				dragStart = e.point;

				dragBoxEl = document.createElement('div');
				dragBoxEl.style.position = 'absolute';
				dragBoxEl.style.border = '2px dashed black';
				dragBoxEl.style.background = 'rgba(0, 0, 0, 0.1)';
				dragBoxEl.style.zIndex = '999';
				dragBoxEl.style.pointerEvents = 'none';
				document.body.appendChild(dragBoxEl);

				const canvas = map.getCanvasContainer();
				const startX = dragStart.x;
				const startY = dragStart.y;

				function onMouseMove(eMove) {
					const curr = eMove.point;
					const minX = Math.min(startX, curr.x);
					const maxX = Math.max(startX, curr.x);
					const minY = Math.min(startY, curr.y);
					const maxY = Math.max(startY, curr.y);

					dragBoxEl.style.left = minX + 'px';
					dragBoxEl.style.top = minY + 'px';
					dragBoxEl.style.width = maxX - minX + 'px';
					dragBoxEl.style.height = maxY - minY + 'px';
				}

				function onMouseUp(eUp) {
					map.off('mousemove', onMouseMove);
					map.off('mouseup', onMouseUp);

					if (dragBoxEl) {
						document.body.removeChild(dragBoxEl);
						dragBoxEl = null;
					}

					const end = eUp.point;
					const bounds = [
						[Math.min(startX, end.x), Math.min(startY, end.y)],
						[Math.max(startX, end.x), Math.max(startY, end.y)]
					];

					const features = map.queryRenderedFeatures(bounds, { layers: ['bivariate-layer'] });

					const selected = features
						.filter((f) => f.id != null)
						.map((f) => ({
							id: f.id,
							properties: f.properties,
							geometry: f.geometry
						}));

					if (selected.length > 0) {
						setSelectedTiles(selected);
					}
				}

				map.on('mousemove', onMouseMove);
				map.on('mouseup', onMouseUp);
			});
		});

		map.on('moveend', () => updateStops());
		map.on('zoom', () => updateStops());
	});

	$: updateLayerStyle(viewMode);

	function updateLayerStyle(mode) {
		if (!map || !map.getLayer('bivariate-layer')) return;
		map.setPaintProperty('bivariate-layer', 'fill-color', getFillColor(mode));
	}

	let viewMode = 'mismatch';
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
		<div class="controls">
			<select id="viewMode" bind:value={viewMode}>
				<option value="mismatch">Mismatch</option>
				<option value="pop">Population</option>
				<option value="pt">PT Quality</option>
			</select>
		</div>
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
