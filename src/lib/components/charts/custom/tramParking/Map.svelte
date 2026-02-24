<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { browser } from '$app/environment';

	export let incidents = [];
	export let hotspots = [];
	export let selectedDistrict = null;
	export let selectedHotspot = null;
	export let tramLines = null;
	export let tramStops = null;
	export let districts = null;

	const dispatch = createEventDispatcher();

	let mapContainer;
	let map;
	let mapLoaded = false;
	let hoveredDistrict = null;
	let tooltip = { show: false, x: 0, y: 0, text: '' };

	const VIENNA_CENTER = [16.37, 48.21];
	const VIENNA_ZOOM = 11;

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
		const style = isDark() ? 'dark_all' : 'rastertiles/voyager';
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

		// Dark mode observer
		const observer = new MutationObserver(() => {
			if (!map) return;
			const source = map.getSource('carto-basemap');
			if (source) {
				source.setTiles(basemapTiles());
			}
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
					'line-color': isDark() ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
					'line-width': ['case', ['==', ['get', 'number'], selectedDistrict || -1], 2.5, 1]
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

		// Tram lines layer
		if (tramLines) {
			map.addSource('tram-lines', { type: 'geojson', data: tramLines });
			map.addLayer({
				id: 'tram-lines',
				type: 'line',
				source: 'tram-lines',
				paint: {
					'line-color': isDark() ? '#60a5fa' : '#2563eb',
					'line-width': 2,
					'line-opacity': 0.5
				}
			});
		}

		// Tram stops layer
		if (tramStops) {
			map.addSource('tram-stops', { type: 'geojson', data: tramStops });
			map.addLayer({
				id: 'tram-stops',
				type: 'circle',
				source: 'tram-stops',
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 14, 4, 17, 7],
					'circle-color': isDark() ? '#60a5fa' : '#2563eb',
					'circle-stroke-width': 1,
					'circle-stroke-color': isDark() ? '#1e293b' : 'white',
					'circle-opacity': 0.7
				}
			});

			map.on('mousemove', 'tram-stops', (e) => {
				if (!e.features?.length) return;
				tooltip = {
					show: true,
					x: e.point.x,
					y: e.point.y,
					text: `${e.features[0].properties.name} (${e.features[0].properties.lines})`
				};
			});
			map.on('mouseleave', 'tram-stops', () => {
				tooltip = { ...tooltip, show: false };
			});
		}

		// Incidents layer (will be updated reactively)
		updateIncidentsLayer();

		// Hotspots layer
		updateHotspotsLayer();
	}

	function incidentsToGeoJSON(incs) {
		return {
			type: 'FeatureCollection',
			features: incs
				.filter((i) => i.lat != null && i.lon != null)
				.map((i) => ({
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [i.lon, i.lat] },
					properties: {
						id: i.id,
						address: i.address || '',
						lines: i.lines || '',
						date: i.date_start?.slice(0, 10) || '',
						district: i.district
					}
				}))
		};
	}

	function hotspotsToGeoJSON(hs) {
		return {
			type: 'FeatureCollection',
			features: hs.map((h) => ({
				type: 'Feature',
				geometry: { type: 'Point', coordinates: h.center },
				properties: {
					id: h.id,
					label: h.label,
					count: h.count,
					type: h.type
				}
			}))
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

	function updateHotspotsLayer() {
		if (!map || !mapLoaded) return;

		const geojson = hotspotsToGeoJSON(hotspots);

		if (map.getSource('hotspots')) {
			map.getSource('hotspots').setData(geojson);
		} else {
			map.addSource('hotspots', { type: 'geojson', data: geojson });

			map.addLayer({
				id: 'hotspots-circles',
				type: 'circle',
				source: 'hotspots',
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 3, 12, 20, 20, 100, 35],
					'circle-color': [
						'case',
						['==', ['get', 'id'], selectedHotspot?.id || ''],
						'rgba(234,179,8,0.5)',
						'rgba(234,179,8,0.25)'
					],
					'circle-stroke-width': ['case', ['==', ['get', 'id'], selectedHotspot?.id || ''], 3, 1.5],
					'circle-stroke-color': '#eab308'
				},
				minzoom: 11,
				maxzoom: 15
			});

			map.addLayer({
				id: 'hotspots-labels',
				type: 'symbol',
				source: 'hotspots',
				layout: {
					'text-field': ['get', 'count'],
					'text-size': 11,
					'text-font': ['Open Sans Bold'],
					'text-allow-overlap': true
				},
				paint: {
					'text-color': isDark() ? '#fbbf24' : '#92400e'
				},
				minzoom: 11,
				maxzoom: 15
			});

			map.on('click', 'hotspots-circles', (e) => {
				if (!e.features?.length) return;
				const id = e.features[0].properties.id;
				const hs = hotspots.find((h) => h.id === id);
				if (hs) dispatch('selectHotspot', hs);
			});

			map.on('mouseenter', 'hotspots-circles', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'hotspots-circles', () => {
				map.getCanvas().style.cursor = '';
			});
		}
	}

	// Update district selection highlight
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

	function updateHotspotHighlight() {
		if (!map || !mapLoaded || !map.getLayer('hotspots-circles')) return;
		map.setPaintProperty('hotspots-circles', 'circle-color', [
			'case',
			['==', ['get', 'id'], selectedHotspot?.id || ''],
			'rgba(234,179,8,0.5)',
			'rgba(234,179,8,0.25)'
		]);
		map.setPaintProperty('hotspots-circles', 'circle-stroke-width', [
			'case',
			['==', ['get', 'id'], selectedHotspot?.id || ''],
			3,
			1.5
		]);
	}

	// Reactivity
	$: if (mapLoaded && incidents) updateIncidentsLayer();
	$: if (mapLoaded && hotspots) updateHotspotsLayer();
	$: if (mapLoaded) updateDistrictHighlight(selectedDistrict);
	$: if (mapLoaded) updateHotspotHighlight(selectedHotspot);

	// Fly to hotspot when selected
	$: if (mapLoaded && selectedHotspot && map) {
		map.flyTo({ center: selectedHotspot.center, zoom: 15, duration: 800 });
	}

	export function flyToDistrict(districtNumber) {
		if (!map || !districts) return;
		const feat = districts.features.find((f) => f.properties.number === districtNumber);
		if (!feat) return;
		// Compute bounds from polygon
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
