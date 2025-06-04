<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';

	export let center;
	export let zoom = 7;
	export let darkMode = false;
	export let outline;

	let mapContainer;

	onMount(() => {
		const map = new maplibregl.Map({
			container: mapContainer,
			interactive: false,
			style: {
				version: 8,
				sources: {
					carto: {
						type: 'raster',
						tiles: [
							darkMode
								? 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
								: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
						],
						tileSize: 256,
						attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
					}
				},
				layers: [
					{
						id: 'carto',
						type: 'raster',
						source: 'carto'
					}
				]
			},
			center,
			zoom,
			attributionControl: false
		});
	});
</script>

<div bind:this={mapContainer} class="w-full h-full absolute -z-50 opacity-70"></div>
