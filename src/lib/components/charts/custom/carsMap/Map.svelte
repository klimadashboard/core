<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleLinear } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';

	export let selectedRegion;
	export let selectedPeriod;
	export let regions;

	let mapContainer;
	let map;
	let mapReady = false;

	const dispatch = createEventDispatcher();

	function createColorScale(data) {
		const values = data.map((d) => d.value).filter((v) => v != null);
		if (values.length === 0) return () => '#ccc';

		const min = Math.min(...values);
		const max = Math.max(...values);

		if (min === max) {
			return () => '#08519c';
		}

		return scaleLinear()
			.domain([min, max])
			.range(['#eeeeee', 'blue'])
			.interpolate(interpolateRgb)
			.clamp(true);
	}

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
				sources: {
					openmaptiles: {
						type: 'vector',
						url: 'https://demotiles.maplibre.org/tiles/tiles.json'
					}
				},
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: {
							'background-color': '#ffffff'
						}
					},
					{
						id: 'state-labels',
						source: 'openmaptiles',
						'source-layer': 'place_label',
						type: 'symbol',
						filter: ['==', ['get', 'class'], 'state'],
						layout: {
							'text-field': ['get', 'name'],
							'text-font': ['Open Sans Bold'],
							'text-size': 14
						},
						paint: {
							'text-color': '#444',
							'text-halo-color': '#fff',
							'text-halo-width': 1
						},
						minzoom: 4,
						maxzoom: 7
					},
					{
						id: 'city-labels',
						source: 'openmaptiles',
						'source-layer': 'place_label',
						type: 'symbol',
						filter: ['==', ['get', 'class'], 'city'],
						layout: {
							'text-field': ['get', 'name'],
							'text-font': ['Open Sans Regular'],
							'text-size': 12
						},
						paint: {
							'text-color': '#000',
							'text-halo-color': '#fff',
							'text-halo-width': 1
						},
						minzoom: 8
					}
				]
			},
			center: [10.45, 51.1657],
			zoom: 5
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

			mapReady = true;
		});
	});

	$: if (map && selectedRegion) {
		map.setFilter('highlight-outline', ['==', 'RS', selectedRegion]);
	}

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
</script>

<div bind:this={mapContainer} id="map" class="w-full h-full"></div>
