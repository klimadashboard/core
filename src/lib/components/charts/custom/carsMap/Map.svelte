<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleLinear } from 'd3-scale';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { interpolateRgb } from 'd3-interpolate';

	export let selectedRegion;
	export let selectedPeriod;
	export let regions;
	export let colors;

	let mapContainer;
	let map;
	let mapReady = false;

	const dispatch = createEventDispatcher();

	const MAPTILER_KEY = 'C9NLXahOLRDRQl9OB6yH'; // <-- replace with your API key

	// Color scale
	function createColorScale(data) {
		const values = data.map((d) => d.value).filter((v) => v != null);
		if (values.length === 0) return () => '#ccc';

		const min = Math.min(...values);
		const max = Math.max(...values);

		if (min === max) return () => '#08519c';

		return scaleLinear().domain([min, max]).range(colors).interpolate(interpolateRgb).clamp(true);
	}

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
				sources: {
					labels: {
						type: 'vector',
						url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`
					}
				},
				layers: [
					// White background (optional)
					{
						id: 'background',
						type: 'background',
						paint: {
							'background-color': '#ffffff'
						}
					}
					// Your landkreise and highlight-outline will be added dynamically after load...
				]
			},
			center: [10.45, 51.1657],
			zoom: 4,
			minZoom: 4,
			maxZoom: 8
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');

		map.on('load', () => {
			const geojson = {
				type: 'FeatureCollection',
				features: regions
					.filter((r) => r.outline)
					.map((r) => ({
						type: 'Feature',
						properties: {
							RS: r.code
						},
						geometry: r.outline
					}))
			};

			map.addSource('landkreise', {
				type: 'geojson',
				data: geojson
			});

			map.addLayer({
				id: 'landkreise-layer',
				type: 'fill',
				source: 'landkreise',
				paint: {
					'fill-color': '#ccc',
					'fill-opacity': 0.8
				}
			});

			map.addLayer({
				id: 'landkreise-outline',
				type: 'line',
				source: 'landkreise',
				paint: {
					'line-color': '#000',
					'line-width': 0.5
				}
			});

			map.addLayer({
				id: 'highlight-outline',
				type: 'line',
				source: 'landkreise',
				paint: {
					'line-color': '#000',
					'line-width': 3
				},
				filter: ['==', 'RS', '']
			});

			map.on('click', 'landkreise-layer', (e) => {
				const feature = e.features?.[0];
				if (feature) {
					const regionId = feature.properties?.RS;
					dispatch('selectRegion', regionId);
				}
			});

			map.on('mouseenter', 'landkreise-layer', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'landkreise-layer', () => {
				map.getCanvas().style.cursor = '';
			});

			const COUNTRY_CODE = PUBLIC_VERSION.toUpperCase(); // "DE", "AT", etc.

			map.addLayer({
				id: 'city-labels',
				source: 'labels',
				'source-layer': 'place',
				type: 'symbol',
				filter: ['==', ['get', 'class'], 'city'],
				layout: {
					'text-field': ['get', 'name:de'],
					'text-font': ['Noto Sans Regular'],
					'text-size': 12
				},
				paint: {
					'text-color': '#000',
					'text-halo-color': '#fff',
					'text-halo-width': 1
				},
				minzoom: 4
			});

			mapReady = true;
		});
	});

	// Color updates
	$: if (mapReady && map && regions && selectedPeriod) {
		const dataForPeriod = regions.map((region) => {
			const match = region.data?.find((d) => String(d.period) === String(selectedPeriod));
			return {
				region: String(region.code),
				value: match ? match.value : null
			};
		});

		const uniqueData = new Map();
		for (const row of dataForPeriod) {
			if (!uniqueData.has(row.region)) {
				uniqueData.set(row.region, row.value);
			}
		}

		const colorScale = createColorScale(
			Array.from(uniqueData.entries()).map(([region, value]) => ({ region, value }))
		);

		const matchExpression = ['match', ['get', 'RS']];
		for (const [region, value] of uniqueData.entries()) {
			const color = value != null ? colorScale(value) : '#ccc';
			matchExpression.push(region, color);
		}
		matchExpression.push('#ccc');

		map.setPaintProperty('landkreise-layer', 'fill-color', matchExpression);
	}

	// Selection outline + flyTo
	$: if (mapReady && map) {
		if (selectedRegion) {
			map.setFilter('highlight-outline', ['==', 'RS', selectedRegion]);
			const region = regions.find((r) => r.code === selectedRegion);
			if (region?.center) {
				map.flyTo({
					center: region.center,
					zoom: 7,
					duration: 800
				});
			}
		} else {
			map.setFilter('highlight-outline', ['==', 'RS', '']);
			map.flyTo({
				center: [10.45, 51.1657],
				zoom: 4,
				duration: 800
			});
		}
	}
</script>

<div bind:this={mapContainer} id="map" class="w-full h-full relative my-4 rounded-2xl">
	<button
		on:mousedown={() => (selectedRegion = null)}
		class="cursor-pointer absolute bottom-12 left-2 z-40 border border-current/10 bg-white dark:bg-gray-900 rounded-full w-8 h-8 grid shadow"
	>
		<img src="/icons/general/{PUBLIC_VERSION}.svg" class="w-6 h-6 m-auto" alt="" />
	</button>
</div>
