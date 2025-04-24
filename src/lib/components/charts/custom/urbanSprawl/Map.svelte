<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleLinear } from 'd3-scale';

	export let data; // [{ code: 'XXX', value: 123 }, ...]
	export let regions; // [{ code: 'XXX', outline_simple: { type: 'Polygon', ... } }, ...]

	let map;

	// Merge value into region features
	const geojson = {
		type: 'FeatureCollection',
		features: regions.map((region) => {
			const entry = data.find((d) => d.region === region.code);
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

	console.log(geojson);

	// Your custom domain and colors (you can also make these props)
	const colorDomain = [0, 1];
	const colorRange = ['#fef0d9', '#b30000']; // light to dark red, for example

	// D3 linear color scale
	const colorScale = scaleLinear().domain(colorDomain).range(colorRange).clamp(true); // optional: clamps values outside domain

	onMount(() => {
		map = new maplibregl.Map({
			container: 'mapUrbanSprawl',
			style: {
				version: 8,
				sources: {
					basemap: {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors'
					}
				},
				layers: [
					{
						id: 'basemap',
						type: 'raster',
						source: 'basemap'
					}
				]
			},
			center: [13.4, 47.5], // Austria center-ish
			zoom: 6
		});

		map.on('load', () => {
			map.addSource('regions', {
				type: 'geojson',
				data: geojson
			});

			// Build safe match expression
			const matchExpr = ['match', ['get', 'code']];
			geojson.features.forEach((f) => {
				const color = colorScale(f.properties.value);
				matchExpr.push(f.properties.code, color);
			});
			matchExpr.push('#ccc'); // fallback color

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
		});
	});
</script>

<div id="mapUrbanSprawl" class="w-full h-[500px]"></div>
