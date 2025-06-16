<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleThreshold } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let selectedRegion;
	export let data = [];
	export let regions;
	export let colors;
	export let selectedEnergy;

	let mapContainer;
	let map;
	let mapReady = false;
	let zoomLevel = 0;
	let legendSteps = [];

	const dispatch = createEventDispatcher();

	const COUNTRY_CODE = PUBLIC_VERSION.toUpperCase();

	const defaultView = {
		AT: { center: [13.333, 47.5], zoom: 6 },
		DE: { center: [10.45, 51.1657], zoom: 5 }
	};

	const { center, zoom } = defaultView[COUNTRY_CODE] || defaultView.DE;

	function getInterpolatedColors(start: string, end: string, steps: number): string[] {
		const interpolate = interpolateRgb(start, end);
		return Array.from({ length: steps }, (_, i) => interpolate(i / (steps - 1)));
	}

	function createSteppedColorScale(values: number[], steps = 7, colors = ['#fee5d9', '#a50f15']) {
		if (!values.length) return () => '#F2F2F2';

		// Option 1: Use percentiles as breakpoints
		const sorted = [...values].sort((a, b) => a - b);
		const thresholds = Array.from({ length: steps - 1 }, (_, i) => {
			const p = (i + 1) / steps;
			return sorted[Math.floor(p * sorted.length)];
		});

		// Option 2: Use logarithmic or square root steps (alternative!)
		// const min = Math.min(...values);
		// const max = Math.max(...values);
		// const thresholds = d3.range(1, steps).map(i => min + (max - min) * Math.pow(i / steps, 0.5));

		const colorRange = getInterpolatedColors(colors[0], colors[1], steps);

		return scaleThreshold().domain(thresholds).range(colorRange);
	}

	function createColorScale(data) {
		if (!Array.isArray(data)) return { scale: () => '#F2F2F2', range: [], thresholds: [] };

		const values = data.map((d) => d.value).filter((v) => v != null);
		if (!values.length) return { scale: () => '#F2F2F2', range: [], thresholds: [] };

		const sorted = [...values].sort((a, b) => a - b);
		const steps = 7;
		const thresholds = Array.from({ length: steps - 1 }, (_, i) => {
			const p = (i + 1) / steps;
			return sorted[Math.floor(p * sorted.length)];
		});

		const colorRange = getInterpolatedColors(colors[0], colors[1], steps);
		const scale = scaleThreshold(thresholds, colorRange);

		return { scale, range: colorRange, thresholds };
	}

	async function loadNearbyWindUnits() {
		if (!map || zoomLevel <= 8 || selectedEnergy !== 'wind') return;
		const center = map.getCenter();
		const lat = center.lat;
		const lon = center.lng;
		try {
			const response = await fetch(
				`https://base.klimadashboard.org/get-nearby-wind-units?lat=${lat}&lon=${lon}&radius_km=50&status=31,35`
			);
			const data = await response.json();
			const geojson = {
				type: 'FeatureCollection',
				features: data.map((unit) => ({
					type: 'Feature',
					properties: {
						name: unit.name,
						status: unit.status,
						power_kw: unit.power_kw,
						district: unit.district,
						municipality: unit.municipality
					},
					geometry: { type: 'Point', coordinates: [unit.lon, unit.lat] }
				}))
			};
			if (map.getSource('wind-units')) {
				map.getSource('wind-units').setData(geojson);
			} else {
				map.addSource('wind-units', {
					type: 'geojson',
					data: geojson,
					cluster: true,
					clusterMaxZoom: 12,
					clusterRadius: 40
				});
				map.addLayer({
					id: 'wind-clusters',
					type: 'circle',
					source: 'wind-units',
					filter: ['has', 'point_count'],
					paint: {
						'circle-color': '#007acc',
						'circle-radius': ['step', ['get', 'point_count'], 12, 10, 16, 50, 24],
						'circle-opacity': 0.6
					}
				});
				map.addLayer({
					id: 'wind-cluster-count',
					type: 'symbol',
					source: 'wind-units',
					filter: ['has', 'point_count'],
					layout: {
						'text-field': '{point_count_abbreviated}',
						'text-font': ['Noto Sans Regular'],
						'text-size': 12
					}
				});
				map.addLayer({
					id: 'wind-points',
					type: 'circle',
					source: 'wind-units',
					filter: ['!', ['has', 'point_count']],
					paint: {
						'circle-radius': 5,
						'circle-color': '#007acc',
						'circle-stroke-color': '#fff',
						'circle-stroke-width': 1
					}
				});
				map.on('click', 'wind-points', (e) => {
					const props = e.features?.[0]?.properties;
					if (!props) return;
					new maplibregl.Popup()
						.setLngLat(e.lngLat)
						.setHTML(
							`<b>${props.name}</b><br />${props.municipality}, ${props.district}<br />${props.power_kw} kW<br />Status: ${props.status}`
						)
						.addTo(map);
				});
				map.on('mouseenter', 'wind-points', () => {
					map.getCanvas().style.cursor = 'pointer';
				});
				map.on('mouseleave', 'wind-points', () => {
					map.getCanvas().style.cursor = '';
				});
			}
		} catch (err) {
			console.error('Failed to load wind units:', err);
		}
	}

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=C9NLXahOLRDRQl9OB6yH`,
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
			center,
			zoom,
			minZoom: zoom,
			maxZoom: 14
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');
		map.scrollZoom.disable();

		map.on('load', () => {
			map.addSource('regions', {
				type: 'vector',
				tiles: ['https://tiles.klimadashboard.org/data/municipalities-de/{z}/{x}/{y}.pbf'],
				minzoom: 4,
				maxzoom: 12
			});

			map.addLayer({
				id: 'regions-layer',
				type: 'fill',
				source: 'regions',
				'source-layer': 'municipalities',
				paint: {
					'fill-color': '#ccc',
					'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0.8, 10, 0.4]
				}
			});

			map.addLayer({
				id: 'regions-outline',
				type: 'line',
				source: 'regions',
				'source-layer': 'municipalities',
				paint: {
					'line-color': '#fff',
					'line-width': 0.05
				}
			});

			map.addLayer({
				id: 'highlight-outline',
				type: 'line',
				source: 'regions',
				'source-layer': 'municipalities',
				paint: {
					'line-color': '#000',
					'line-width': 2
				},
				filter: ['==', 'AGS', '']
			});

			map.addSource('carto-voyager', {
				type: 'raster',
				tiles: [
					'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
				],
				tileSize: 256,
				maxzoom: 20
			});

			map.addLayer(
				{
					id: 'carto-voyager',
					type: 'raster',
					source: 'carto-voyager',
					paint: {
						'raster-opacity': 0
					},
					minzoom: 9
				},
				'regions-layer' // Insert below your vector layer
			);

			map.on('click', 'regions-layer', (e) => {
				const feature = e.features?.[0];
				if (feature) {
					const regionId = feature.properties?.AGS;
					dispatch('selectRegion', regionId);
				}
			});

			map.on('mouseenter', 'regions-layer', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'regions-layer', () => {
				map.getCanvas().style.cursor = '';
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

			mapReady = true;
			if (selectedEnergy === 'wind' && zoomLevel > 8) {
				loadNearbyWindUnits();
			}
		});

		map.on('zoom', () => {
			zoomLevel = map.getZoom();
			if (zoomLevel <= 9 && map.getSource('wind-units')) {
				map.removeLayer('wind-points');
				map.removeLayer('wind-cluster-count');
				map.removeLayer('wind-clusters');
				map.removeSource('wind-units');
			}
			const fadeTarget = zoomLevel > 9 ? 1 : 0;
			map.setPaintProperty('carto-voyager', 'raster-opacity', fadeTarget);

			// Optional: Smooth transition (over ~300ms)
			map.setPaintProperty('carto-voyager', 'raster-fade-duration', 300);
		});

		map.on('moveend', () => {
			zoomLevel = map.getZoom();
			if (selectedEnergy === 'wind' && zoomLevel > 8) {
				loadNearbyWindUnits();
			}
		});
	});

	// Highlight + fly to selected region
	$: if (mapReady && map) {
		if (selectedRegion && selectedRegion.layer !== 'country') {
			map.setFilter('highlight-outline', ['==', 'AGS', selectedRegion.code]);

			// Only fly if you have coordinates
			if (selectedRegion?.center) {
				map.flyTo({ center: selectedRegion.center, zoom: 9.2, duration: 800 });
			}
		} else {
			map.setFilter('highlight-outline', ['==', 'AGS', '']);
			map.flyTo({ center, zoom, duration: 800 });
		}
	}

	// Color fill updates
	$: if (mapReady && map && Array.isArray(data) && data.length > 0) {
		try {
			const uniqueData = new Map();
			for (const row of data) {
				if (row.region && row.power_per_area_kw_per_km2 != null && !uniqueData.has(row.region)) {
					uniqueData.set(row.region, row.power_per_area_kw_per_km2);
				}
			}

			const entriesArray = Array.from(uniqueData.entries()).map(([region, value]) => ({
				region,
				value
			}));

			if (entriesArray.length > 0) {
				const { scale, range, thresholds } = createColorScale(entriesArray);

				// 🟢 Set map color
				const matchExpression = ['match', ['get', 'AGS']];
				for (const { region, value } of entriesArray) {
					const color = value != null ? scale(value) : '#F2F2F2';
					matchExpression.push(region, color);
				}
				matchExpression.push('#F2F2F2');
				map.setPaintProperty('regions-layer', 'fill-color', matchExpression);

				// 🟢 Set legend
				legendSteps = range.map((color, i) => {
					const lower = i === 0 ? 0 : thresholds[i - 1];
					const upper = thresholds[i];
					const label =
						upper !== undefined
							? `${Math.round(lower)}–${Math.round(upper)}`
							: `> ${Math.round(lower)}`;
					return { color, label };
				});
			}
		} catch (err) {
			console.error('Error updating fill colors or legend:', err);
		}
	}

	// Wind layers cleanup when energy type changes
	$: if (mapReady && map && selectedEnergy !== 'wind') {
		if (map.getSource('wind-units')) {
			map.removeLayer('wind-points');
			map.removeLayer('wind-cluster-count');
			map.removeLayer('wind-clusters');
			map.removeSource('wind-units');
		}
	}
</script>

<div
	bind:this={mapContainer}
	id="map"
	class="w-full h-full relative my-4 rounded-2xl bg-white dark:bg-gray-950"
>
	{#if zoomLevel > 4}
		<button
			on:mousedown={() => (selectedRegion = regions.find((d) => d.layer == 'country'))}
			class="cursor-pointer absolute bottom-12 left-2 z-40 border border-current/10 bg-white dark:bg-gray-200 rounded-full w-8 h-8 grid shadow"
			transition:fade
			aria-label="Zurück zur nationalen Ansicht"
		>
			<img src="/icons/general/{PUBLIC_VERSION}.svg" class="w-6 h-6 m-auto" alt="" />
		</button>
	{/if}
	{#if mapReady && data.length > 0}
		<div
			class="legend absolute top-2 left-2 z-40 bg-white dark:bg-gray-800 text-xs rounded shadow p-2"
		>
			<div class="font-semibold mb-1">Leistung (kW/km²)</div>
			{#each legendSteps as step, i}
				<div class="flex items-center gap-1 mb-0.5">
					<span class="inline-block w-4 h-4 rounded" style="background-color: {step.color}"></span>
					<span>
						{step.label}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
</style>
