<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let map;

	const tileServerBase = 'https://tiles.klimadashboard.org/data';
	const popTiles = `${tileServerBase}/austria_pop/{z}/{x}/{y}.png`;
	const transportTiles = `${tileServerBase}/austria_publictransport/{z}/{x}/{y}.png`;

	function tileToLonLat(x, y, z) {
		const n = Math.pow(2, z);
		const lon = (x / n) * 360 - 180;
		const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
		return [lon, lat];
	}

	async function processRiskTile(x, y, z) {
		const popTileUrl = popTiles.replace('{z}', z).replace('{x}', x).replace('{y}', y);
		const transportTileUrl = transportTiles.replace('{z}', z).replace('{x}', x).replace('{y}', y);

		const popImg = await loadImage(popTileUrl);
		const transportImg = await loadImage(transportTileUrl);

		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 256;
		const ctx = canvas.getContext('2d');

		ctx.drawImage(popImg, 0, 0, 256, 256);
		const popData = ctx.getImageData(0, 0, 256, 256);

		ctx.clearRect(0, 0, 256, 256);
		ctx.drawImage(transportImg, 0, 0, 256, 256);
		const transportData = ctx.getImageData(0, 0, 256, 256);

		const riskData = ctx.createImageData(256, 256);

		for (let i = 0; i < popData.data.length; i += 4) {
			const popValue = popData.data[i]; // Red channel
			const transportValue = transportData.data[i + 1]; // Green channel

			if (popValue > 200 && transportValue < 100) {
				riskData.data[i] = 255; // Red
				riskData.data[i + 1] = 0;
				riskData.data[i + 2] = 0;
				riskData.data[i + 3] = 255;
			} else if (popValue > 150 && transportValue < 100) {
				riskData.data[i] = 255; // Orange
				riskData.data[i + 1] = 100;
				riskData.data[i + 2] = 0;
				riskData.data[i + 3] = 255;
			} else {
				riskData.data[i + 3] = 0; // Transparent
			}
		}

		ctx.putImageData(riskData, 0, 0);
		return canvas;
	}

	function loadImage(url) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
	}

	function loadMap() {
		map = new maplibregl.Map({
			container: 'mobilityMap',
			style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
			center: [13.3333, 47.5162],
			zoom: 6
		});

		map.on('load', async () => {
			map.addSource('population', {
				type: 'raster',
				tiles: [popTiles],
				tileSize: 256
			});

			map.addSource('transport', {
				type: 'raster',
				tiles: [transportTiles],
				tileSize: 256
			});

			map.addLayer({
				id: 'population',
				type: 'raster',
				source: 'population',
				paint: { 'raster-opacity': 0.6 }
			});

			map.addLayer({
				id: 'transport',
				type: 'raster',
				source: 'transport',
				paint: { 'raster-opacity': 0.6 }
			});

			map.on('movestart', () => {
				if (map.getSource('risk')) {
					map.removeLayer('risk');
					map.removeSource('risk');
				}
			});

			map.on('moveend', async () => {
				const bounds = map.getBounds();
				const z = Math.round(map.getZoom());
				const x = Math.floor(((bounds.getWest() + 180) / 360) * Math.pow(2, z));
				const y = Math.floor(
					((1 -
						Math.log(
							Math.tan((bounds.getNorth() * Math.PI) / 180) +
								1 / Math.cos((bounds.getNorth() * Math.PI) / 180)
						) /
							Math.PI) /
						2) *
						Math.pow(2, z)
				);

				const riskCanvas = await processRiskTile(x, y, z);

				const topLeft = tileToLonLat(x, y, z);
				const topRight = tileToLonLat(x + 1, y, z);
				const bottomRight = tileToLonLat(x + 1, y + 1, z);
				const bottomLeft = tileToLonLat(x, y + 1, z);

				map.addSource('risk', {
					type: 'canvas',
					canvas: riskCanvas,
					tileSize: 256,
					coordinates: [topLeft, topRight, bottomRight, bottomLeft]
				});

				map.addLayer({
					id: 'risk',
					type: 'raster',
					source: 'risk',
					paint: { 'raster-opacity': 0.6 }
				});
			});
		});
	}

	onMount(() => {
		loadMap();
	});
</script>

<div id="mobilityMap"></div>

<style>
	#mobilityMap {
		width: 100%;
		height: 100vh;
	}
</style>
