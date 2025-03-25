<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let map;
	let selectedLayer = 'ptpop';

	const tileServerBase = 'https://tiles.klimadashboard.org/data';
	const layers = {
		ptpop: {
			id: 'ptpop',
			label: 'Mismatch (PT vs. Population)',
			url: `${tileServerBase}/kd_raster_ptpop/{z}/{x}/{y}.png`
		},
		pt: {
			id: 'pt',
			label: 'Public Transport Quality',
			url: `${tileServerBase}/kd_raster_pt/{z}/{x}/{y}.png`
		},
		pop: {
			id: 'pop',
			label: 'Population Density',
			url: `${tileServerBase}/kd_raster_pop/{z}/{x}/{y}.png`
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
			minZoom: 6,
			maxZoom: 14
		});

		map.on('load', () => {
			Object.values(layers).forEach((layer) => {
				map.addSource(layer.id, {
					type: 'raster',
					tiles: [layer.url],
					tileSize: 256
				});

				map.addLayer({
					id: layer.id,
					type: 'raster',
					source: layer.id,
					layout: {
						visibility: layer.id === selectedLayer ? 'visible' : 'none'
					},
					paint: {
						'raster-opacity': 1
					}
				});
			});

			// Add all raster sources and layers (above basemap)
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
				filter: ['!=', '$type', 'Polygon'] // We'll invert this in the next step
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
