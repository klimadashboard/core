<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { browser } from '$app/environment';

	export let incidents = [];
	export let selectedDistrict = null;
	export let selectedHotspot = null;
	export let tramLines = null;
	export let tramStops = null;
	export let busLines = null;
	export let busStops = null;
	export let nightbusLines = null;
	export let nightbusStops = null;
	export let districts = null;

	const dispatch = createEventDispatcher();

	let mapContainer;
	let map;
	let mapLoaded = false;
	let hoveredDistrict = null;
	let tooltip = { show: false, x: 0, y: 0, text: '' };

	const VIENNA_CENTER = [16.37, 48.21];
	const VIENNA_ZOOM = 11;

	const LINE_COLOR_LIGHT = 'rgba(120,120,120,0.5)';
	const LINE_COLOR_DARK = 'rgba(180,180,180,0.6)';
	const STOP_COLOR_LIGHT = 'rgba(120,120,120,0.6)';
	const STOP_COLOR_DARK = 'rgba(180,180,180,0.7)';

	onMount(() => {
		if (!browser) return;
		createMap();
		return () => {
			if (map) map.remove();
		};
	});

	function isDark() {
		return document.body.classList.contains('dark');
	}

	function basemapTiles() {
		const style = isDark() ? 'dark_all' : 'light_all';
		return [
			`https://a.basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png`,
			`https://b.basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png`,
			`https://c.basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png`,
			`https://d.basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png`
		];
	}

	function createMap() {
		map = new maplibregl.Map({
			container: mapContainer,
			interactive: true,
			style: {
				version: 8,
				glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=C9NLXahOLRDRQl9OB6yH',
				sources: {
					'carto-basemap': {
						type: 'raster',
						tiles: basemapTiles(),
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
			center: VIENNA_CENTER,
			zoom: VIENNA_ZOOM,
			minZoom: 10,
			maxZoom: 18
		});

		map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-left');

		map.on('load', () => {
			mapLoaded = true;
			addLayers();
		});

		const observer = new MutationObserver(() => {
			if (!map) return;
			const source = map.getSource('carto-basemap');
			if (source) source.setTiles(basemapTiles());
		});
		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
	}

	function addLayers() {
		if (!map || !mapLoaded) return;

		// Districts layer
		if (districts) {
			if (map.getSource('districts')) return;

			map.addSource('districts', { type: 'geojson', data: districts });

			map.addLayer({
				id: 'districts-fill',
				type: 'fill',
				source: 'districts',
				paint: {
					'fill-color': [
						'case',
						['==', ['get', 'number'], selectedDistrict || -1],
						isDark() ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)',
						'transparent'
					],
					'fill-opacity': 0.8
				}
			});

			map.addLayer({
				id: 'districts-outline',
				type: 'line',
				source: 'districts',
				paint: {
					'line-color': isDark() ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)',
					'line-width': ['case', ['==', ['get', 'number'], selectedDistrict || -1], 2.5, 1],
					'line-dasharray': [4, 3]
				}
			});

			map.addLayer({
				id: 'districts-hover',
				type: 'line',
				source: 'districts',
				paint: {
					'line-color': '#3b82f6',
					'line-width': 2.5
				},
				filter: ['==', ['get', 'number'], -1]
			});

			map.on('click', 'districts-fill', (e) => {
				if (!e.features?.length) return;
				const num = e.features[0].properties.number;
				dispatch('selectDistrict', num === selectedDistrict ? null : num);
			});

			map.on('mousemove', 'districts-fill', (e) => {
				if (!e.features?.length) return;
				const num = e.features[0].properties.number;
				if (hoveredDistrict !== num) {
					hoveredDistrict = num;
					map.setFilter('districts-hover', ['==', ['get', 'number'], num]);
					map.getCanvas().style.cursor = 'pointer';
				}
				tooltip = {
					show: true,
					x: e.point.x,
					y: e.point.y,
					text: e.features[0].properties.label
				};
			});

			map.on('mouseleave', 'districts-fill', () => {
				hoveredDistrict = null;
				map.setFilter('districts-hover', ['==', ['get', 'number'], -1]);
				map.getCanvas().style.cursor = '';
				tooltip = { ...tooltip, show: false };
			});
		}

		// Transit layers will be added/removed reactively
		updateTransitLayers();

		// Incidents layer
		updateIncidentsLayer();
	}

	/** Add or remove a line+stop layer pair */
	function setTransitLayer(lineId, stopId, lineData, stopData) {
		if (!map || !mapLoaded) return;

		// Lines
		if (lineData) {
			if (!map.getSource(lineId)) {
				map.addSource(lineId, { type: 'geojson', data: lineData });
				map.addLayer({
					id: lineId,
					type: 'line',
					source: lineId,
					paint: {
						'line-color': isDark() ? LINE_COLOR_DARK : LINE_COLOR_LIGHT,
						'line-width': 2,
						'line-opacity': 0.7
					}
				}, 'incidents-heat'); // insert before heatmap
			}
		} else {
			if (map.getLayer(lineId)) map.removeLayer(lineId);
			if (map.getSource(lineId)) map.removeSource(lineId);
		}

		// Stops
		if (stopData) {
			if (!map.getSource(stopId)) {
				map.addSource(stopId, { type: 'geojson', data: stopData });
				map.addLayer({
					id: stopId,
					type: 'circle',
					source: stopId,
					paint: {
						'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 14, 4, 17, 7],
						'circle-color': isDark() ? STOP_COLOR_DARK : STOP_COLOR_LIGHT,
						'circle-stroke-width': 1,
						'circle-stroke-color': isDark() ? '#1e293b' : 'white',
						'circle-opacity': 0.7
					}
				}, 'incidents-heat');

				map.on('mousemove', stopId, (e) => {
					if (!e.features?.length) return;
					const p = e.features[0].properties;
					const name = p.name || 'Haltestelle';
					tooltip = {
						show: true,
						x: e.point.x,
						y: e.point.y,
						text: `${name}${p.lines ? ` (${p.lines})` : ''}`
					};
				});
				map.on('mouseleave', stopId, () => {
					tooltip = { ...tooltip, show: false };
				});
			}
		} else {
			if (map.getLayer(stopId)) map.removeLayer(stopId);
			if (map.getSource(stopId)) map.removeSource(stopId);
		}
	}

	function updateTransitLayers() {
		if (!map || !mapLoaded) return;
		// Ensure incidents source exists first so we can insert transit layers before it
		if (!map.getSource('incidents')) {
			updateIncidentsLayer();
		}
		setTransitLayer('tram-lines', 'tram-stops', tramLines, tramStops);
		setTransitLayer('bus-lines', 'bus-stops', busLines, busStops);
		setTransitLayer('nightbus-lines', 'nightbus-stops', nightbusLines, nightbusStops);
	}

	/** Deterministic hash-based jitter so same incident always gets same offset */
	function jitter(id, coord) {
		const h = Math.abs(id * 2654435761 % 2147483647);
		const angle = (h % 360) * Math.PI / 180;
		const dist = ((h >> 8) % 100) / 100 * 0.0003;
		return [coord[0] + Math.cos(angle) * dist, coord[1] + Math.sin(angle) * dist];
	}

	function incidentsToGeoJSON(incs) {
		const coordCounts = new Map();
		const geocoded = incs.filter((i) => i.lat != null && i.lon != null);
		for (const i of geocoded) {
			const key = `${i.lon},${i.lat}`;
			coordCounts.set(key, (coordCounts.get(key) || 0) + 1);
		}

		return {
			type: 'FeatureCollection',
			features: geocoded.map((i) => {
				const key = `${i.lon},${i.lat}`;
				const coords = coordCounts.get(key) > 1
					? jitter(i.id, [i.lon, i.lat])
					: [i.lon, i.lat];
				return {
					type: 'Feature',
					geometry: { type: 'Point', coordinates: coords },
					properties: {
						id: i.id,
						address: i.address || '',
						lines: i.lines || '',
						date: i.date_start?.slice(0, 10) || '',
						district: i.district
					}
				};
			})
		};
	}

	function updateIncidentsLayer() {
		if (!map || !mapLoaded) return;

		const geojson = incidentsToGeoJSON(incidents);

		if (map.getSource('incidents')) {
			map.getSource('incidents').setData(geojson);
		} else {
			map.addSource('incidents', { type: 'geojson', data: geojson });

			map.addLayer({
				id: 'incidents-heat',
				type: 'heatmap',
				source: 'incidents',
				maxzoom: 15,
				paint: {
					'heatmap-weight': 1,
					'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
					'heatmap-color': [
						'interpolate',
						['linear'],
						['heatmap-density'],
						0,
						'rgba(0,0,0,0)',
						0.2,
						'rgba(254,178,76,0.4)',
						0.4,
						'rgba(253,141,60,0.6)',
						0.6,
						'rgba(252,78,42,0.7)',
						0.8,
						'rgba(227,26,28,0.8)',
						1,
						'rgba(177,0,38,0.9)'
					],
					'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 15, 14, 25, 16, 40],
					'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.8, 15, 0.3]
				}
			});

			map.addLayer({
				id: 'incidents-points',
				type: 'circle',
				source: 'incidents',
				minzoom: 13,
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 16, 6],
					'circle-color': '#e11d48',
					'circle-stroke-width': 1,
					'circle-stroke-color': 'white',
					'circle-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.3, 15, 0.8]
				}
			});

			map.on('click', 'incidents-points', (e) => {
				if (!e.features?.length) return;
				const id = e.features[0].properties.id;
				const inc = incidents.find((i) => i.id === id);
				if (inc) dispatch('selectIncident', inc);
			});

			map.on('mouseenter', 'incidents-points', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'incidents-points', () => {
				map.getCanvas().style.cursor = '';
			});

			map.on('mousemove', 'incidents-points', (e) => {
				if (!e.features?.length) return;
				const p = e.features[0].properties;
				tooltip = {
					show: true,
					x: e.point.x,
					y: e.point.y,
					text: `${p.address} | ${p.lines} | ${p.date}`
				};
			});
			map.on('mouseleave', 'incidents-points', () => {
				tooltip = { ...tooltip, show: false };
			});
		}
	}

	function updateDistrictHighlight() {
		if (!map || !mapLoaded || !map.getLayer('districts-fill')) return;
		map.setPaintProperty('districts-fill', 'fill-color', [
			'case',
			['==', ['get', 'number'], selectedDistrict || -1],
			isDark() ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)',
			'transparent'
		]);
		map.setPaintProperty('districts-outline', 'line-width', [
			'case',
			['==', ['get', 'number'], selectedDistrict || -1],
			2.5,
			1
		]);
	}

	// Reactivity
	$: if (mapLoaded && incidents) updateIncidentsLayer();
	$: if (mapLoaded) updateDistrictHighlight(selectedDistrict);
	$: if (mapLoaded) updateTransitLayers(tramLines, tramStops, busLines, busStops, nightbusLines, nightbusStops);

	// Fly to hotspot when selected
	$: if (mapLoaded && selectedHotspot && map) {
		map.flyTo({ center: selectedHotspot.center, zoom: 15, duration: 800 });
	}

	export function flyToDistrict(districtNumber) {
		if (!map || !districts) return;
		const feat = districts.features.find((f) => f.properties.number === districtNumber);
		if (!feat) return;
		const coords = feat.geometry.coordinates.flat(2);
		const lons = coords.filter((_, i) => i % 2 === 0);
		const lats = coords.filter((_, i) => i % 2 === 1);
		const bounds = [
			[Math.min(...lons), Math.min(...lats)],
			[Math.max(...lons), Math.max(...lats)]
		];
		map.fitBounds(bounds, { padding: 40, duration: 800 });
	}

	export function resetView() {
		if (!map) return;
		map.flyTo({ center: VIENNA_CENTER, zoom: VIENNA_ZOOM, duration: 800 });
	}

	export function invalidateSize() {
		if (map) map.resize();
	}
</script>

<div class="relative w-full h-full">
	<div bind:this={mapContainer} class="w-full h-full rounded-xl" />

	{#if tooltip.show}
		<div
			class="absolute z-50 pointer-events-none bg-white dark:bg-gray-800 shadow-lg rounded-lg px-3 py-1.5 text-sm max-w-xs"
			style="left: {tooltip.x + 12}px; top: {tooltip.y - 10}px;"
		>
			{tooltip.text}
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss/theme";

	:global(.maplibregl-ctrl-group) {
		@apply shadow-lg;
	}
</style>
