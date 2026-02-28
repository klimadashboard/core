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
	let clickedIncident = false;

	const VIENNA_CENTER = [16.37, 48.21];
	const VIENNA_ZOOM = 11;

	const STOP_COLOR_LIGHT = 'rgba(120,120,120,0.6)';
	const STOP_COLOR_DARK = 'rgba(180,180,180,0.7)';

	// --- Density-colored line helpers ---
	const SEGMENT_LEN = 50;
	const DENSITY_RADIUS = 50;
	const GRID_CELL = 0.001;

	function haversineD(a, b) {
		const R = 6371000;
		const toRad = (d) => (d * Math.PI) / 180;
		const dLat = toRad(b[1] - a[1]);
		const dLon = toRad(b[0] - a[0]);
		const lat1 = toRad(a[1]);
		const lat2 = toRad(b[1]);
		const s =
			Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
		return 2 * R * Math.asin(Math.sqrt(s));
	}

	function segmentLineCoords(coords, maxLen) {
		if (coords.length < 2) return [];
		const segments = [];
		let seg = [coords[0]];
		let segLen = 0;
		for (let i = 1; i < coords.length; i++) {
			const d = haversineD(coords[i - 1], coords[i]);
			segLen += d;
			seg.push(coords[i]);
			if (segLen >= maxLen && i < coords.length - 1) {
				segments.push(seg);
				seg = [coords[i]];
				segLen = 0;
			}
		}
		if (seg.length >= 2) segments.push(seg);
		else if (segments.length > 0 && seg.length === 1) {
			segments[segments.length - 1].push(seg[0]);
		}
		return segments;
	}

	function buildSpatialGrid(incs) {
		const grid = new Map();
		for (const inc of incs) {
			if (inc.lat == null || inc.lon == null) continue;
			const key = `${Math.floor(inc.lon / GRID_CELL)},${Math.floor(inc.lat / GRID_CELL)}`;
			if (!grid.has(key)) grid.set(key, []);
			grid.get(key).push(inc);
		}
		return grid;
	}

	function countNearbyIncidents(grid, lon, lat, radius) {
		const cx = Math.floor(lon / GRID_CELL);
		const cy = Math.floor(lat / GRID_CELL);
		let count = 0;
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				const cell = grid.get(`${cx + dx},${cy + dy}`);
				if (!cell) continue;
				for (const inc of cell) {
					if (haversineD([lon, lat], [inc.lon, inc.lat]) <= radius) count++;
				}
			}
		}
		return count;
	}

	function buildDensityGeoJSON(lineGeoJSON, grid) {
		if (!lineGeoJSON?.features) return null;
		const features = [];
		for (const feat of lineGeoJSON.features) {
			const geom = feat.geometry;
			const lineArrays =
				geom.type === 'MultiLineString' ? geom.coordinates : [geom.coordinates];
			for (const coords of lineArrays) {
				const segments = segmentLineCoords(coords, SEGMENT_LEN);
				for (const segCoords of segments) {
					const midIdx = Math.floor(segCoords.length / 2);
					const mid = segCoords[midIdx];
					const density = countNearbyIncidents(grid, mid[0], mid[1], DENSITY_RADIUS);
					features.push({
						type: 'Feature',
						geometry: { type: 'LineString', coordinates: segCoords },
						properties: { density }
					});
				}
			}
		}
		return features;
	}

	function createDiamondImage(map) {
		const size = 16;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		ctx.beginPath();
		ctx.moveTo(size / 2, 0);
		ctx.lineTo(size, size / 2);
		ctx.lineTo(size / 2, size);
		ctx.lineTo(0, size / 2);
		ctx.closePath();
		ctx.fillStyle = 'white';
		ctx.fill();
		const data = ctx.getImageData(0, 0, size, size);
		map.addImage('diamond', data, { sdf: true });
	}

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

	function basemapNoLabelsTiles() {
		const style = isDark() ? 'dark_nolabels' : 'light_nolabels';
		return [
			`https://a.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`,
			`https://b.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`,
			`https://c.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`,
			`https://d.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`
		];
	}

	function basemapLabelsTiles() {
		const style = isDark() ? 'dark_only_labels' : 'light_only_labels';
		return [
			`https://a.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`,
			`https://b.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`,
			`https://c.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`,
			`https://d.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`
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
					'basemap-base': {
						type: 'raster',
						tiles: basemapNoLabelsTiles(),
						tileSize: 512,
						maxzoom: 20
					}
				},
				layers: [
					{
						id: 'basemap-base',
						type: 'raster',
						source: 'basemap-base',
						paint: { 'raster-opacity': 0.55 }
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
			createDiamondImage(map);
			addLayers();
		});

		const observer = new MutationObserver(() => {
			if (!map) return;
			const base = map.getSource('basemap-base');
			if (base) base.setTiles(basemapNoLabelsTiles());
			const labels = map.getSource('basemap-labels');
			if (labels) labels.setTiles(basemapLabelsTiles());
		});
		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
	}

	function addLayers() {
		if (!map || !mapLoaded) return;

		// Labels layer (below data layers — provides context without obscuring lines)
		map.addSource('basemap-labels', {
			type: 'raster',
			tiles: basemapLabelsTiles(),
			tileSize: 512,
			maxzoom: 20
		});
		map.addLayer({
			id: 'basemap-labels',
			type: 'raster',
			source: 'basemap-labels',
			minzoom: 13,
			paint: { 'raster-opacity': 0.5 }
		});

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
					'line-width': [
						'case',
						['==', ['get', 'number'], selectedDistrict || -1],
						2.5,
						1
					],
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
				if (clickedIncident) return;
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

		// Incident points (topmost data layer)
		updateIncidentsLayer();

		// Transit layers (below incident points)
		updateTransitLayers();
	}

	/** Density-driven line paint — opaque colors, no alpha stacking issues */
	const DENSITY_LINE_PAINT = {
		'line-color': [
			'interpolate',
			['linear'],
			['get', 'density'],
			0,
			'#c0c4cc',
			1,
			'#fb923c',
			3,
			'#f97316',
			6,
			'#ea580c',
			10,
			'#dc2626',
			20,
			'#b91c1c',
			35,
			'#7f1d1d'
		],
		'line-width': ['interpolate', ['linear'], ['get', 'density'], 0, 1.5, 3, 2.5, 10, 3.5, 25, 4.5],
		'line-opacity': ['interpolate', ['linear'], ['get', 'density'], 0, 0.7, 1, 1]
	};

	/** Add or remove a stop layer */
	function setStopLayer(stopId, stopData) {
		if (!map || !mapLoaded) return;
		if (stopData) {
			if (!map.getSource(stopId)) {
				map.addSource(stopId, { type: 'geojson', data: stopData });
				map.addLayer(
					{
						id: stopId,
						type: 'symbol',
						source: stopId,
						minzoom: 14,
						layout: {
							'icon-image': 'diamond',
							'icon-size': [
								'interpolate',
								['linear'],
								['zoom'],
								14,
								0.35,
								17,
								0.8
							],
							'icon-allow-overlap': true
						},
						paint: {
							'icon-color': isDark() ? STOP_COLOR_DARK : STOP_COLOR_LIGHT,
							'icon-opacity': 0.7
						}
					},
					'incidents-points'
				);

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
		// Ensure incidents layer exists so we can insert before it
		if (!map.getLayer('incidents-points')) {
			updateIncidentsLayer();
		}

		// Build spatial grid once for all line types
		const grid = buildSpatialGrid(incidents);

		// Merge all active line types into one set of density features
		const allFeatures = [];
		for (const lineData of [tramLines, busLines, nightbusLines]) {
			if (!lineData) continue;
			const features = buildDensityGeoJSON(lineData, grid);
			if (features) allFeatures.push(...features);
		}

		// Sort ascending: gray segments first (bottom), colored on top
		allFeatures.sort((a, b) => a.properties.density - b.properties.density);

		const merged = { type: 'FeatureCollection', features: allFeatures };

		if (map.getSource('transit-lines')) {
			map.getSource('transit-lines').setData(merged);
		} else if (allFeatures.length > 0) {
			map.addSource('transit-lines', { type: 'geojson', data: merged });
			map.addLayer(
				{
					id: 'transit-lines',
					type: 'line',
					source: 'transit-lines',
					layout: { 'line-cap': 'round', 'line-join': 'round' },
					paint: DENSITY_LINE_PAINT
				},
				'incidents-points'
			);
		}

		// Stops: separate layers per type
		setStopLayer('tram-stops', tramStops);
		setStopLayer('bus-stops', busStops);
		setStopLayer('nightbus-stops', nightbusStops);
	}

	function incidentsToGeoJSON(incs) {
		const geocoded = incs.filter((i) => i.lat != null && i.lon != null);

		const coordIndices = new Map();
		const coordCounts = new Map();
		for (const i of geocoded) {
			const key = `${i.lon},${i.lat}`;
			coordCounts.set(key, (coordCounts.get(key) || 0) + 1);
		}

		return {
			type: 'FeatureCollection',
			features: geocoded.map((i) => {
				const key = `${i.lon},${i.lat}`;
				const count = coordCounts.get(key);
				let coords = [i.lon, i.lat];
				if (count > 1) {
					const idx = coordIndices.get(key) || 0;
					coordIndices.set(key, idx + 1);
					const angle = (idx / count) * 2 * Math.PI;
					const dist = 0.00004;
					coords = [i.lon + Math.cos(angle) * dist, i.lat + Math.sin(angle) * dist];
				}
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
				id: 'incidents-points',
				type: 'circle',
				source: 'incidents',
				minzoom: 12,
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2, 14, 4, 17, 7],
					'circle-color': '#e11d48',
					'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 15, 1],
					'circle-stroke-color': 'white',
					'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 14, 0.7, 16, 0.9]
				}
			});

			map.on('click', 'incidents-points', (e) => {
				if (!e.features?.length) return;
				clickedIncident = true;
				setTimeout(() => (clickedIncident = false), 100);
				const id = e.features[0].properties.id;
				const inc = incidents.find((i) => i.id === id);
				if (inc) {
					dispatch('selectIncident', inc);
					const coords = e.features[0].geometry.coordinates;
					map.flyTo({
						center: coords,
						zoom: Math.max(map.getZoom(), 15),
						duration: 600
					});
				}
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
	$: if (mapLoaded)
		updateTransitLayers(
			tramLines,
			tramStops,
			busLines,
			busStops,
			nightbusLines,
			nightbusStops,
			incidents
		);

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
