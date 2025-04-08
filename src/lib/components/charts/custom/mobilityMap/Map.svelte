<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	export let selectedRegion;

	let map;
	let selectedLayer = 'mismatch';

	const vectorTilesURL = 'https://tiles.klimadashboard.org/data/pt_mismatch_all';

	const layers = {
		mismatch: {
			id: 'mismatch',
			label: 'Mismatch (PT vs. Population)',
			property: 'mismatch',
			colorStops: [
				[0, '#ffffff'],
				[1, '#ffe5d9'],
				[5, '#fb6a4a'],
				[10, '#cb181d']
			]
		},
		pt: {
			id: 'pt',
			label: 'Public Transport Quality',
			property: 'pt',
			colorStops: [
				[0, '#ffffff'],
				[36, '#f0f9e8'],
				[109, '#bae4bc'],
				[255, '#238b45']
			]
		},
		pop: {
			id: 'pop',
			label: 'Population Density',
			property: 'pop',
			colorStops: [
				[0, '#ffffff'],
				[5, '#deebf7'],
				[10, '#9ecae1'],
				[255, '#084594']
			]
		}
	};

	function switchLayer(id) {
		selectedLayer = id;
		Object.values(layers).forEach((layer) => {
			if (map.getLayer(layer.id)) {
				map.setLayoutProperty(layer.id, 'visibility', layer.id === id ? 'visible' : 'none');
			}
		});
	}

	onMount(() => {
		map = new maplibregl.Map({
			container: 'mobilityMap',
			style: {
				version: 8,
				sources: {
					carto: {
						type: 'raster',
						tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution:
							'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>'
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

		map.on('load', () => {
			Object.values(layers).forEach((layer) => {
				map.addSource(layer.id, {
					type: 'vector',
					tiles: [`${vectorTilesURL}/{z}/{x}/{y}.pbf`],
					tileSize: 512,
					minzoom: 5,
					maxzoom: 14
				});

				map.addLayer({
					id: layer.id,
					type: 'fill',
					source: layer.id,
					'source-layer': 'ptmismatch',
					paint: {
						'fill-color': [
							'interpolate',
							['linear'],
							['get', layer.property],
							...layer.colorStops.flat()
						],
						'fill-opacity': [
							'interpolate',
							['linear'],
							['get', layer.property],
							0,
							0, // fully transparent at 0
							1,
							0.3, // semi-transparent
							10,
							0.6, // more visible
							255,
							0.9 // almost solid
						]
					},
					layout: {
						visibility: layer.id === selectedLayer ? 'visible' : 'none'
					}
				});
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

			map.on('zoom', () => {
				// console.log(map.getZoom());
			});

			map.on('click', (e) => {
				const features = map.queryRenderedFeatures(e.point, {
					layers: Object.values(layers).map((l) => l.id)
				});

				if (features.length > 0) {
					const feature = features[0];
					const props = feature.properties;
					const coords = e.lngLat;

					selectedRegion = {
						coordinates: [coords.lng, coords.lat],
						geometry: feature.geometry,
						properties: {
							pop: props.pop,
							pt: props.pt,
							mismatch: props.mismatch
						}
					};
					console.log('Selected Region:', selectedRegion);
				}
			});
		});
	});
</script>

<div class="">
	<select bind:value={selectedLayer} on:change={() => switchLayer(selectedLayer)} class="input">
		{#each Object.values(layers) as layer}
			<option value={layer.id}>{layer.label}</option>
		{/each}
	</select>
</div>

<div id="mobilityMap"></div>

<style>
	#mobilityMap {
		width: 100%;
		height: 60vh;
	}
	.controls {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 10;
		background: white;
		padding: 0.5rem;
		border-radius: 4px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}
	select {
		font-size: 1rem;
		padding: 0.25rem;
	}
</style>
