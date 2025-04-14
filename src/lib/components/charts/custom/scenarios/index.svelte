<!-- Updated Map.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import Switch from '$lib/components/Switch.svelte';

	let map: maplibregl.Map;
	let tooltipContent = '';
	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let currentZoom = 0;

	let warmingLevels = ['2.0C', '3.0C', '4.0C'];
	let indicators = [
		{ key: 'heatdays_30', label: 'Hitzetage ≥30°C' },
		{ key: 'summerdays_25', label: 'Sommertage ≥25°C' }
	];
	let viewModes = [
		{ key: 'absolute', label: 'Zukunft (q50)' },
		{ key: 'delta', label: 'Differenz zu heute' },
		{ key: 'current', label: 'Heute (2001–2020)' }
	];

	let activeIndicator = indicators[0].key;
	let activeWarmingIndex = 0;
	let activeWarming = warmingLevels[activeWarmingIndex];
	let viewMode = 'absolute';
	let selectedFeature: Record<string, any> | null = null;

	onMount(() => {
		map = new maplibregl.Map({
			container: 'scenarioMap',
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
						tiles: ['https://tiles.klimadashboard.org/data/indicators_all/{z}/{x}/{y}.pbf'],
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
						paint: {
							'fill-color': [
								'interpolate',
								['linear'],
								['get', 'q50'],
								0,
								'#ffffb2',
								10,
								'#fecc5c',
								20,
								'#fd8d3c',
								40,
								'#e31a1c',
								60,
								'#800026'
							],
							'fill-opacity': 0.7
						}
					},
					{
						id: 'climate-hover',
						type: 'fill',
						source: 'climate',
						'source-layer': 'climate',
						paint: { 'fill-opacity': 0 }
					}
				]
			},
			center: [13.3, 47.5],
			zoom: 6
		});

		map.on('zoom', () => {
			currentZoom = map.getZoom();
		});

		map.on('mousemove', (e) => {
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['climate-hover']
			});

			const match = features.find(
				(f) =>
					f.properties.indicator === activeIndicator && f.properties.warming_level === activeWarming
			);

			if (!match) {
				tooltipVisible = false;
				return;
			}

			const props = match.properties;
			selectedFeature = props;

			const val =
				viewMode === 'delta' ? props.delta : viewMode === 'current' ? props.current : props.q50;

			tooltipContent = `
				<b>${props.indicator} – ${props.warming_level}</b><br>
				<b>${viewMode}:</b> ${val}<br>
				<b>q10:</b> ${props.q10}<br>
				<b>q90:</b> ${props.q90}<br>
				<b>Heute:</b> ${props.current}
			`;

			tooltipVisible = true;
			tooltipX = e.point.x;
			tooltipY = e.point.y;
		});

		map.on('mouseleave', 'climate-fill', () => {
			tooltipVisible = false;
		});
	});

	$: activeWarming = warmingLevels[activeWarmingIndex];

	$: if (map && map.getLayer('climate-fill')) {
		map.setFilter('climate-fill', [
			'all',
			['==', ['get', 'indicator'], activeIndicator],
			['==', ['get', 'warming_level'], activeWarming]
		]);

		const colorStops =
			viewMode === 'delta'
				? [
						'interpolate',
						['linear'],
						['get', 'delta'],
						-5,
						'#0571b0',
						0,
						'#f7f7f7',
						5,
						'#ca0020',
						10,
						'#a50026',
						15,
						'#67001f'
					]
				: viewMode === 'current'
					? [
							'interpolate',
							['linear'],
							['get', 'current'],
							0,
							'#ffffb2',
							10,
							'#fecc5c',
							20,
							'#fd8d3c',
							40,
							'#e31a1c',
							60,
							'#800026'
						]
					: [
							'interpolate',
							['linear'],
							['get', 'q50'],
							0,
							'#ffffb2',
							10,
							'#fecc5c',
							20,
							'#fd8d3c',
							40,
							'#e31a1c',
							60,
							'#800026'
						];

		map.setPaintProperty('climate-fill', 'fill-color', colorStops);
	}
</script>

<!-- UI Controls -->
<div class="controls space-y-2 mb-4">
	<Switch
		views={indicators}
		bind:activeView={activeIndicator}
		on:itemClick={(e) => (activeIndicator = e.detail)}
	/>

	<Switch
		views={viewModes}
		bind:activeView={viewMode}
		on:itemClick={(e) => (viewMode = e.detail)}
	/>

	<label class="block text-sm font-medium">Erwärmung: {warmingLevels[activeWarmingIndex]}</label>
	<input
		type="range"
		min="0"
		max={warmingLevels.length - 1}
		step="1"
		bind:value={activeWarmingIndex}
		class="w-full"
	/>
</div>

<!-- Map -->
<div id="scenarioMap" class="w-full h-[60vh] rounded-2xl relative"></div>

<!-- Tooltip -->
{#if tooltipVisible}
	<div class="tooltip" style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;">
		{@html tooltipContent}
	</div>
{/if}

<!-- Legend -->
<div class="legend mt-2">
	{#if viewMode === 'delta'}
		<div><span style="background:#0571b0"></span> -5</div>
		<div><span style="background:#f7f7f7"></span> 0</div>
		<div><span style="background:#ca0020"></span> +5</div>
		<div><span style="background:#a50026"></span> +10</div>
		<div><span style="background:#67001f"></span> +15</div>
	{:else}
		<div><span style="background:#ffffb2"></span> 0</div>
		<div><span style="background:#fecc5c"></span> 10</div>
		<div><span style="background:#fd8d3c"></span> 20</div>
		<div><span style="background:#e31a1c"></span> 40</div>
		<div><span style="background:#800026"></span> 60</div>
	{/if}
</div>

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
	.legend {
		display: flex;
		gap: 8px;
		font-size: 0.75rem;
		margin-top: 1rem;
	}
	.legend div {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.legend span {
		width: 20px;
		height: 12px;
		display: inline-block;
	}
</style>
