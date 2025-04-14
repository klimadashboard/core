<script>
	import maplibregl from 'maplibre-gl';
	import { onMount } from 'svelte';

	export let data;

	let mapContainer;

	onMount(() => {
		const map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://demotiles.maplibre.org/style.json',
			center: [10.4515, 51.1657], // Center of Germany
			zoom: 5
		});

		data.forEach((plant) => {
			new maplibregl.Marker().setLngLat([plant.lon, plant.lat]).addTo(map);
		});
	});
</script>

<div bind:this={mapContainer} style="width: 100%; height: 100vh;"></div>

<style>
	/* Add any additional styling here */
</style>
