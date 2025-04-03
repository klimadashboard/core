<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import Inspector from './Inspector.svelte';
	import Switch from '$lib/components/Switch.svelte';

	let map: maplibregl.Map;
	let tooltipContent = '';
	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let currentZoom = 0;

	let rcps = [
		{ key: '4.5', label: 'RCP4.5' },
		{ key: '8.5', label: 'RCP8.5' }
	];
	let variables = [
		{ key: 'su25', label: 'Sommertage' },
		{ key: 'su30', label: 'Hitzetage' }
	];

	let activeVariable = variables[variables.length - 1].key;
	let activeRcp = rcps[rcps.length - 1].key;
	let selectedFeature: Record<string, any> | null = null;

	onMount(() => {
		map = new maplibregl.Map({
			container: 'map',
			style: {
				version: 8,
				sources: {
					basemap: {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors'
					},
					climate: {
						type: 'vector',
						tiles: ['https://tiles.klimadashboard.org/data/climate_all/{z}/{x}/{y}.pbf'],
						minzoom: 5,
						maxzoom: 14
					}
				},
				layers: [
					{ id: 'basemap', type: 'raster', source: 'basemap' },
					{
						id: 'climate-fill',
						type: 'fill',
						source: 'climate',
						'source-layer': 'climate',
						filter: [
							'all',
							['==', ['get', 'variable'], activeVariable],
							['==', ['get', 'rcp'], activeRcp]
						],
						paint: {
							'fill-color': [
								'interpolate',
								['linear'],
								['get', 'q50'],
								0,
								'#ffffb2',
								20,
								'#fecc5c',
								40,
								'#fd8d3c',
								60,
								'#e31a1c',
								80,
								'#800026'
							],
							'fill-opacity': 0.7
						}
					}
				]
			},
			center: [13.3, 47.5],
			zoom: 6,
			minZoom: 5,
			maxZoom: 14
		});

		map.on('zoom', () => {
			currentZoom = map.getZoom();
		});

		map.on('mousemove', 'climate-fill', (e) => {
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['climate-fill']
			});

			if (!features || features.length === 0) {
				selectedFeature = null;
				tooltipVisible = false;
				return;
			}

			const grouped = {};
			for (const f of features) {
				const key = `${f.properties.variable}_${f.properties.rcp}`;
				grouped[key] = f.properties;
			}

			selectedFeature = grouped;

			tooltipContent = Object.entries(grouped)
				.map(([key, props]) => {
					return `
					<div style="margin-bottom: 4px">
						<b>${props.variable} – RCP ${props.rcp}</b><br>
						<b>Period:</b> ${props.period}<br>
						<b>Median (q50):</b> ${props.q50}<br>
						<b>10% (q10):</b> ${props.q10}<br>
						<b>90% (q90):</b> ${props.q90}<br>
						<b>Trust:</b> ${props.trust}
					</div>`;
				})
				.join('');

			tooltipVisible = true;
			tooltipX = e.point.x;
			tooltipY = e.point.y;
		});

		map.on('mouseleave', 'climate-fill', () => {
			tooltipVisible = false;
		});
	});

	$: if (map && map.getLayer('climate-fill')) {
		map.setFilter('climate-fill', [
			'all',
			['==', ['get', 'variable'], activeVariable],
			['==', ['get', 'rcp'], activeRcp]
		]);
	}
</script>

<Switch
	views={rcps}
	bind:activeView={activeRcp}
	on:itemClick={(event) => {
		activeRcp = event.detail;
	}}
/>

<Switch
	views={variables}
	bind:activeView={activeVariable}
	on:itemClick={(event) => {
		activeVariable = event.detail;
	}}
/>

{currentZoom}

<div id="map" class="w-full h-[60vh] rounded-2xl"></div>

{#if tooltipVisible}
	<div class="tooltip" style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;">
		{@html tooltipContent}
	</div>
{/if}

<Inspector {selectedFeature} />

<style>
	.tooltip {
		position: absolute;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 8px;
		font-size: 0.9rem;
		pointer-events: none;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		max-width: 240px;
	}
</style>
