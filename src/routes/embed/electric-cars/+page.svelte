<script>
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleLinear } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { PUBLIC_VERSION } from '$env/static/public';
	import 'maplibre-gl/dist/maplibre-gl.css';

	export let data;

	const COUNTRY_CODE = PUBLIC_VERSION.toUpperCase();

	const defaultView = {
		AT: { center: [13.333, 47.5], zoom: 6 },
		DE: { center: [10.45, 51.1657], zoom: 4.5 }
	};

	const { center, zoom } = defaultView[COUNTRY_CODE] || defaultView.DE;

	let mapContainer;
	let map;
	let tooltipEl;

	const MAPTILER_KEY = 'C9NLXahOLRDRQl9OB6yH';

	const shareByRegion = {};
	const shareValues = [];

	// Compute electric % shares
	for (const entry of data.cars) {
		const { region, category, value } = entry;
		if (!shareByRegion[region]) shareByRegion[region] = { elektro: 0, gesamt: 0 };

		if (category === 'Elektro') shareByRegion[region].elektro += value;
		if (category === 'Insgesamt') shareByRegion[region].gesamt += value;
	}

	for (const region in shareByRegion) {
		const { elektro, gesamt } = shareByRegion[region];
		if (gesamt > 0) {
			const percent = (elektro / gesamt) * 100;
			shareByRegion[region].percent = percent;
			shareValues.push(percent);
		}
	}

	const min = 0;
	const max = 15;

	const colorScale = scaleLinear()
		.domain([min, max])
		.range(['#D1FAE5', '#065F46'])
		.interpolate(interpolateRgb)
		.clamp(true);

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
				sources: {
					labels: {
						type: 'vector',
						url: 'https://tiles.klimadashboard.org/data/labels-' + PUBLIC_VERSION + '.json'
					}
				},
				layers: [
					{
						id: 'background',
						type: 'background',
						paint: { 'background-color': 'transparent' }
					}
				]
			},
			center,
			zoom,
			minZoom: zoom,
			maxZoom: 11
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');
		map.scrollZoom.disable();

		map.on('load', () => {
			const sourceUrl =
				PUBLIC_VERSION === 'at'
					? 'https://tiles.klimadashboard.org/data/municipalities-at.json'
					: 'https://tiles.klimadashboard.org/data/districts-de.json';

			const sourceLayer = PUBLIC_VERSION === 'at' ? 'municipalities' : 'districts';

			map.addSource('regions', {
				type: 'vector',
				url: sourceUrl
			});

			const entries = Object.entries(shareByRegion).filter(
				([_, info]) => typeof info.percent === 'number'
			);

			const matchExpr = [
				'match',
				['get', 'AGS'],
				...entries.flatMap(([region, info]) => [region, colorScale(info.percent)]),
				'#ccc'
			];

			map.addLayer({
				id: 'regions-layer',
				type: 'fill',
				source: 'regions',
				'source-layer': sourceLayer,
				paint: {
					'fill-color': matchExpr,
					'fill-opacity': 0.8
				}
			});

			// 👇 Add hover outline layer
			map.addLayer({
				id: 'regions-hover-outline',
				type: 'line',
				source: 'regions',
				'source-layer': sourceLayer,
				paint: {
					'line-color': '#000',
					'line-width': 1
				},
				filter: ['==', 'AGS', ''] // initially nothing highlighted
			});

			map.addLayer({
				id: 'city-labels',
				source: 'labels',
				'source-layer': 'city-labels',
				type: 'symbol',
				layout: {
					'text-field': ['get', 'name'],
					'text-font': ['Noto Sans Regular'],
					'text-size': 12,
					'symbol-sort-key': ['get', 'population']
				},
				paint: {
					'text-color': '#000',
					'text-halo-color': '#fff',
					'text-halo-width': 1,
					'text-opacity': 0.7
				},
				minzoom: 4
			});

			// Tooltip + Hover outline
			let lastHoveredAGS = '';
			let hoverTimeout;
			const hoverDelay = 20;

			map.on('mousemove', 'regions-layer', (e) => {
				const feature = e.features?.[0];
				if (!feature) return;

				const AGS = feature.properties.AGS;
				const name = feature.properties.GEN;
				const { pageX, pageY } = e.originalEvent;

				if (AGS === lastHoveredAGS) return;
				lastHoveredAGS = AGS;

				clearTimeout(hoverTimeout);
				hoverTimeout = setTimeout(() => {
					const info = shareByRegion[AGS];
					if (!info || info.percent === undefined) return;

					// Update outline
					map.setFilter('regions-hover-outline', ['==', 'AGS', AGS]);

					// Tooltip
					const content = `
			<span class='text-base font-bold'>${name}</span><br />
			<span class='text-base'>${info.percent.toFixed(1)}% Elektroautos</span><br />
			<span class="text-sm opacity-70">${info.elektro.toLocaleString('de-DE')} Elektroautos<br />${info.gesamt.toLocaleString('de-DE')} PKWs<br />1.1.2025
		`;

					tooltipEl.innerHTML = content;
					tooltipEl.style.display = 'block';
					tooltipEl.style.left = `${pageX + 15}px`;
					tooltipEl.style.top = `${pageY}px`;
				}, hoverDelay);
			});

			map.on('mouseleave', 'regions-layer', () => {
				clearTimeout(hoverTimeout);
				tooltipEl.style.display = 'none';
				map.setFilter('regions-hover-outline', ['==', 'AGS', '']);
				lastHoveredAGS = '';
			});
		});
	});
</script>

<div class="relative">
	<div bind:this={mapContainer} class="h-[550px] w-full rounded-md"></div>
	<div bind:this={tooltipEl} class="tooltip" style="display: none;"></div>

	<!-- Legend -->
	<div
		class="absolute left-2 bottom-2 z-50 flex items-center space-x-2 bg-white border border-gray-300 px-3 py-1 rounded text-sm shadow"
	>
		<span>{min.toFixed(1)}%</span>
		<div
			class="w-10 h-2 rounded"
			style="background: linear-gradient(to right, #D1FAE5      , #065F46);"
		></div>
		<span>{max.toFixed(1)}%</span>
		<span class="opacity-70"
			>Daten: <a
				href="https://www-genesis.destatis.de/datenbank/online/url/802b92c5"
				target="_blank">Kraftfahrtbundesamt (2025)</a
			></span
		>
	</div>

	<a
		class="group absolute top-2 left-2 bg-white border border-gray-300 p-1 shadow rounded overflow-hidden flex items-center gap-1 text-sm"
		href="https://klimadashboard.de"
		target="_blank"
	>
		<img src="/logo.svg" class="w-5 h-5 rounded" />
		<span class=" opacity-70 group-hover:opacity-100">Klimadashboard.de</span>
	</a>
</div>

<style>
	.tooltip {
		position: absolute;
		line-height: 1em;
		z-index: 999;
		background: white;
		border: 1px solid #ccc;
		padding: 6px 10px;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		pointer-events: none;
	}
</style>
