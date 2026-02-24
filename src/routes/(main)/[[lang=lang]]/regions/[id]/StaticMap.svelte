<script>
	import { onMount, onDestroy } from 'svelte';
	import maplibregl from 'maplibre-gl';

	export let center;
	export let zoom;
	export let outline;

	let mapContainer;
	let map;
	let observer;

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

	function addOutlineLayer(isDark) {
		if (!outline) return;

		// Add source for the region outline
		if (!map.getSource('region-outline')) {
			map.addSource('region-outline', {
				type: 'geojson',
				data: {
					type: 'Feature',
					geometry: outline
				}
			});
		}

		// Add outline stroke layer
		if (!map.getLayer('region-outline-stroke')) {
			map.addLayer({
				id: 'region-outline-stroke',
				type: 'line',
				source: 'region-outline',
				paint: {
					'line-color': isDark ? '#ffffff' : '#000000',
					'line-width': 2,
					'line-opacity': 0.5
				}
			});
		}
	}

	function fitToOutline() {
		if (!outline) return;

		// Calculate bounds from outline geometry
		const bounds = new maplibregl.LngLatBounds();

		function addCoordinates(coords) {
			if (typeof coords[0] === 'number') {
				bounds.extend(coords);
			} else {
				coords.forEach(addCoordinates);
			}
		}

		if (outline.type === 'Polygon') {
			outline.coordinates.forEach(addCoordinates);
		} else if (outline.type === 'MultiPolygon') {
			outline.coordinates.forEach((ring) => ring.forEach(addCoordinates));
		}

		map.fitBounds(bounds, {
			padding: 40,
			animate: false
		});
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

		map.on('load', () => {
			addOutlineLayer(isDark);
			fitToOutline();
		});

		observer = new MutationObserver(() => {
			const nowDark = document.body.classList.contains('dark');
			const currentTiles = map.getStyle().sources.carto.tiles?.[0];

			const darkURL = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
			const lightURL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

			const isCurrentlyDark = currentTiles === darkURL;

			if (nowDark !== isCurrentlyDark) {
				map.setStyle(getBaseMapStyle(nowDark));
				// Re-add outline layer after style change
				map.once('style.load', () => {
					addOutlineLayer(nowDark);
				});
			}
		});

		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

		onDestroy(() => {
			observer.disconnect();
			map.remove();
		});
	});

	// Recenter map when `center` changes
	$: if (map && center) {
		map.setCenter(center);
	}
</script>

<div bind:this={mapContainer} class="w-full h-full absolute -z-50 opacity-100"></div>
