<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleLinear } from 'd3-scale';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { fade } from 'svelte/transition';

	export let data; // raw data from Directus
	export let regions; // geo features
	export let selectedRegion;
	export let selectedPeriod;
	export let selectedVariable;
	export let selectedView;

	const COUNTRY_CODE = PUBLIC_VERSION.toUpperCase();

	const defaultView = {
		AT: { center: [13.333, 47.5], zoom: 6 },
		DE: { center: [10.45, 51.1657], zoom: 4 }
	};

	const { center, zoom } = defaultView[COUNTRY_CODE] || defaultView.DE;

	let map;
	let mapLoaded = false;
	let zoomLevel;

	let transformedData = [];

	// === 1. Transform data reactively ===
	$: if (data && selectedView && selectedVariable !== undefined && selectedPeriod !== undefined) {
		transformedData = transformDataForMap(data, selectedView, selectedVariable, selectedPeriod);
	}

	// === 2. Create geojson from regions and transformed values ===
	let geojson;
	$: geojson = {
		type: 'FeatureCollection',
		features: regions.map((region) => {
			const entry = transformedData.find((d) => d.region === region.code);
			return {
				type: 'Feature',
				properties: {
					code: region.code,
					value: entry?.value ?? 0
				},
				geometry: region.outline_simple
			};
		})
	};

	// === 3. Color scale ===
	const colorDomain = [0, 1];
	const colorRange = ['#c7e9b4', '#253494'];
	const colorScale = scaleLinear().domain(colorDomain).range(colorRange).clamp(true);

	// === 4. Initialize map ===
	onMount(() => {
		map = new maplibregl.Map({
			container: 'mapUrbanSprawl',
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=C9NLXahOLRDRQl9OB6yH`,
				sources: {
					labels: {
						type: 'vector',
						url: `https://tiles.klimadashboard.org/data/labels-${PUBLIC_VERSION}.json`
					}
				},
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: { 'background-color': 'transparent' }
					}
				]
			},
			center,
			zoom
		});

		map.on('load', () => {
			mapLoaded = true;

			map.addSource('regions', { type: 'geojson', data: geojson });
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

			const matchExpr = ['match', ['get', 'code']];
			geojson.features.forEach((f) => {
				matchExpr.push(f.properties.code, colorScale(f.properties.value));
			});
			matchExpr.push('#ccc');

			map.addLayer({
				id: 'carto-voyager',
				type: 'raster',
				source: 'carto-voyager',
				paint: { 'raster-opacity': 0.5 }
			});

			map.addLayer({
				id: 'regions-fill',
				type: 'fill',
				source: 'regions',
				paint: {
					'fill-color': matchExpr,
					'fill-opacity': 0.7
				}
			});

			map.addLayer({
				id: 'regions-outline',
				type: 'line',
				source: 'regions',
				paint: {
					'line-color': '#333',
					'line-width': 1
				}
			});

			map.addLayer({
				id: 'highlight-outline',
				type: 'line',
				source: 'regions',
				paint: {
					'line-color': '#000',
					'line-width': 2
				},
				filter: ['==', 'code', '']
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
				minzoom: 4
			});
		});

		map.on('click', 'regions-fill', (e) => {
			const feature = e.features?.[0];
			if (feature) {
				selectedRegion = feature.properties.code;
			}
		});

		map.on('zoom', () => {
			zoomLevel = map.getZoom();
		});

		map.on('mouseenter', 'regions-fill', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'regions-fill', () => {
			map.getCanvas().style.cursor = '';
		});
	});

	// === 5. Highlight selected region ===
	$: if (map && mapLoaded) {
		if (selectedRegion) {
			map.setFilter('highlight-outline', ['==', 'code', selectedRegion]);
			const region = regions.find((r) => r.code === selectedRegion);
			if (region?.center) {
				map.flyTo({ center: region.center, zoom: 8.5, duration: 800 });
			}
		} else {
			map.setFilter('highlight-outline', ['==', 'code', '']);
			map.flyTo({ center, zoom, duration: 800 });
		}
	}

	// === 6. Update source + color scale reactively ===
	$: if (map && mapLoaded && geojson) {
		const source = map.getSource('regions');
		if (source) {
			source.setData(geojson);
		}

		const matchExpr = ['match', ['get', 'code']];
		geojson.features.forEach((f) => {
			matchExpr.push(f.properties.code, colorScale(f.properties.value));
		});
		matchExpr.push('#ccc');

		if (map.getLayer('regions-fill')) {
			map.setPaintProperty('regions-fill', 'fill-color', matchExpr);
		}
	}

	// === Helper ===
	function transformDataForMap(data, selectedView, selectedVariable, selectedPeriod) {
		const grouped = data.reduce((acc, entry) => {
			(acc[entry.region] ||= []).push(entry);
			return acc;
		}, {});

		return Object.entries(grouped).map(([regionCode, entries]) => {
			if (selectedView === 'change') {
				const years = [...new Set(entries.map((e) => +e.period))].sort((a, b) => a - b);
				const first = years[0];
				const last = years.at(-1);

				const popFirst =
					+entries.find((e) => e.period == first && e.category === 'population')?.value ?? 0;
				const pop3First =
					+entries.find((e) => e.period == first && e.category === 'pop3')?.value ?? 0;
				const popLast =
					+entries.find((e) => e.period == last && e.category === 'population')?.value ?? 0;
				const pop3Last =
					+entries.find((e) => e.period == last && e.category === 'pop3')?.value ?? 0;

				return {
					region: regionCode,
					value: popLast > 0 && popFirst > 0 ? pop3Last / popLast - pop3First / popFirst : 0
				};
			}

			if (selectedView === 'absolute') {
				const pop =
					+entries.find((e) => e.period == selectedPeriod && e.category === 'population')?.value ??
					0;
				const val =
					+entries.find((e) => e.period == selectedPeriod && e.category === selectedVariable)
						?.value ?? 0;

				return {
					region: regionCode,
					value: pop > 0 ? val / pop : 0
				};
			}

			return { region: regionCode, value: 0 };
		});
	}
</script>

<div id="mapUrbanSprawl" class="w-full h-full rounded-2xl">
	{#if zoomLevel > 4}
		<button
			on:mousedown={() => (selectedRegion = null)}
			class="cursor-pointer absolute bottom-12 left-2 z-40 border border-current/10 bg-white dark:bg-gray-500 rounded-full w-8 h-8 grid shadow"
			transition:fade
		>
			<img src="/icons/general/{PUBLIC_VERSION}.svg" class="w-6 h-6 m-auto" alt="" />
		</button>
	{/if}
</div>
