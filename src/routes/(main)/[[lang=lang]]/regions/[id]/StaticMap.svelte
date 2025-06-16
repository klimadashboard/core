<script>
	import { onMount, onDestroy } from 'svelte';
	import maplibregl from 'maplibre-gl';

	export let center;
	export let zoom;
	export let outline;

	let mapContainer;
	let map;

	function getBaseMapStyle(isDark) {
		return {
			version: 8,
			sources: {
				carto: {
					type: 'raster',
					tiles: [
						isDark
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
		};
	}

	onMount(() => {
		const isDark = document.body.classList.contains('dark');

		map = new maplibregl.Map({
			container: mapContainer,
			interactive: false,
			style: getBaseMapStyle(isDark),
			center,
			zoom,
			attributionControl: false
		});

		const observer = new MutationObserver(() => {
			const nowDark = document.body.classList.contains('dark');
			const currentTiles = map.getStyle().sources.carto.tiles?.[0];

			const darkURL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
			const lightURL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

			const isCurrentlyDark = currentTiles === darkURL;

			if (nowDark !== isCurrentlyDark) {
				map.setStyle(getBaseMapStyle(nowDark));
			}
		});

		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

		onDestroy(() => {
			observer.disconnect();
			map.remove();
		});
	});

	// ✅ Recenter map when `center` changes
	$: if (map && center) {
		map.setCenter(center);
	}
</script>

<div bind:this={mapContainer} class="w-full h-full absolute -z-50 opacity-100"></div>
