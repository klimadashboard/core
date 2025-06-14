<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import formatNumber from '$lib/stores/formatNumber';

	let map;
	let hoveredCode = '';
	const regions = page.data.regions;
	const codeProperty = PUBLIC_VERSION === 'at' ? 'AGS' : 'ARS';

	const defaultView = {
		at: { center: [13.333, 47.5], zoom: 6 },
		de: { center: [10.45, 51.5], zoom: 4.5 }
	};

	const regionInfoMap = new Map(regions.filter((r) => r.code).map((r) => [String(r.code), r]));

	function getBaseMapStyle(isDark: boolean) {
		return {
			version: 8,
			glyphs: 'https://data.klimadashboard.org/fonts/{fontstack}/{range}.pbf',
			sources: {
				carto: {
					type: 'raster',
					tiles: [
						isDark
							? 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
							: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
					],
					tileSize: 256
				},
				municipalities: {
					type: 'vector',
					tiles: [
						`https://tiles.klimadashboard.org/data/municipalities-${PUBLIC_VERSION}/{z}/{x}/{y}.pbf`
					],
					minzoom: 4,
					maxzoom: 12
				},
				regionLabels: {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: regions
							.filter((r) => r.center && r.name)
							.map((r) => ({
								type: 'Feature',
								properties: { name: r.name },
								geometry: { type: 'Point', coordinates: r.center }
							}))
					}
				}
			},
			layers: [
				{
					id: 'carto-basemap',
					type: 'raster',
					source: 'carto'
				}
			]
		};
	}

	onMount(async () => {
		if (!browser || !regions?.length) return;

		const maplibregl = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');

		const isDark = document.body.classList.contains('dark');

		// Helper to offset center
		function offsetCenter([lng, lat]: [number, number]): [number, number] {
			const isLargeScreen = typeof window !== 'undefined' && window.innerWidth >= 1024;
			const latOffset = 0.5; // move map content slightly down
			const lngOffset = isLargeScreen ? -4 : 0; // shift right only on large screens
			return [lng + lngOffset, lat + latOffset];
		}

		const rawCenter = (defaultView[PUBLIC_VERSION] || defaultView.de).center;
		const center = offsetCenter(rawCenter);

		map = new maplibregl.Map({
			container: 'map',
			style: getBaseMapStyle(isDark),
			center,
			zoom: defaultView[PUBLIC_VERSION].zoom,
			minZoom: 4.5,
			maxZoom: 12
		});

		map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

		const observer = new MutationObserver(() => {
			const nowDark = document.body.classList.contains('dark');
			const currentTiles = map.getStyle().sources.carto.tiles?.[0];
			const isCurrentlyDark = currentTiles?.includes('dark_all');

			if (nowDark !== isCurrentlyDark) {
				map.setStyle(getBaseMapStyle(nowDark));
			}
		});

		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

		map.on('load', () => {
			map.addLayer({
				id: 'region-fill',
				type: 'fill',
				source: 'municipalities',
				'source-layer': 'municipalities',
				paint: {
					'fill-color': '#3b82f6',
					'fill-opacity': 0.2
				}
			});

			map.addLayer({
				id: 'region-outline',
				type: 'line',
				source: 'municipalities',
				'source-layer': 'municipalities',
				paint: {
					'line-color': '#2563eb',
					'line-opacity': 0.1,
					'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.3, 12, 1.5]
				}
			});

			map.addLayer({
				id: 'region-hover',
				type: 'line',
				source: 'municipalities',
				'source-layer': 'municipalities',
				paint: {
					'line-color': '#f59e0b',
					'line-width': 2
				},
				filter: ['==', codeProperty, '']
			});

			map.addLayer({
				id: 'region-labels',
				type: 'symbol',
				source: 'regionLabels',
				minzoom: 6,
				layout: {
					'text-field': ['get', 'name'],
					'text-font': ['Barlow-Regular'],
					'text-size': 12
				},
				paint: {
					'text-color': '#111',
					'text-halo-color': '#fff',
					'text-halo-width': 1
				}
			});

			let lastHoveredCode = '';
			let hoverTimeout;

			map.on('mousemove', 'region-fill', (e) => {
				map.getCanvas().style.cursor = 'pointer';

				const code = e.features?.[0]?.properties?.[codeProperty];
				if (!code || code === lastHoveredCode) return;

				lastHoveredCode = code;
				hoveredCode = String(code);

				clearTimeout(hoverTimeout);
				hoverTimeout = setTimeout(() => {
					map.setFilter('region-hover', ['==', codeProperty, hoveredCode]);
				}, 30);

				const region = regionInfoMap.get(hoveredCode);
				if (region) {
					const tooltip = document.getElementById('tooltip');
					if (tooltip) {
						tooltip.innerHTML = `
							<div class="font-bold">${region.name}</div>
							<div class="opacity-80">${region.layer_label}</div>
							<div class="opacity-80">${formatNumber(region.population || 0)} Einwohner:innen</div>
							<div class="opacity-80">${region.area ? formatNumber(region.area) + ' km²' : '–'}</div>
						`;
						tooltip.style.display = 'block';
						tooltip.style.left = e.point.x + 12 + 'px';
						tooltip.style.top = e.point.y + 12 + 'px';
					}
				}
			});

			map.on('mouseleave', 'region-fill', () => {
				map.getCanvas().style.cursor = '';
				map.setFilter('region-hover', ['==', codeProperty, '']);
				const tooltip = document.getElementById('tooltip');
				if (tooltip) tooltip.style.display = 'none';
			});

			map.on('click', 'region-fill', (e) => {
				const code = e.features?.[0]?.properties?.[codeProperty];
				if (!code) return;

				const region = regionInfoMap.get(String(code));
				if (region?.id) {
					window.location.href = `/regions/${region.id}`;
				}
			});
		});
	});
</script>

<div class="relative">
	<div id="map" class="" />
	<div
		id="tooltip"
		class="absolute z-10 hidden p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 shadow-2xl leading-tight"
	/>
</div>

<style>
	#map {
		width: 100%;
		height: 60vh;
		margin-bottom: 2rem;
	}

	#tooltip {
		transition:
			left 0.05s ease,
			top 0.05s ease;
	}
</style>
