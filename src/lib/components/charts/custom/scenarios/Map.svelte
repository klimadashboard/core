<!-- Updated Map.svelte -->
<script lang="ts">
	import { centroid } from '@turf/centroid';
	import { booleanContains } from '@turf/boolean-contains';
	import { bbox } from '@turf/bbox';
	import { union } from '@turf/union';
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { page } from '$app/state';
	import Switch from '$lib/components/Switch.svelte';

	export let selectedRegion;
	export let selection;
	export let selectedTiles = [];

	let map: maplibregl.Map;

	let warmingLevels = [
		{ key: 'current', label: 'Heute' },
		{ key: '2.0C', label: '2.0° C' },
		{ key: '3.0C', label: '3.0° C' },
		{ key: '4.0C', label: '4.0° C' }
	];
	let indicators = [
		{ key: 'heatdays_30', label: 'Hitzetage ≥30°C' },
		{ key: 'summerdays_25', label: 'Sommertage ≥25°C' }
	];
	let viewModes = [
		{ key: 'absolute', label: 'Zukunft (q50)' },
		{ key: 'delta', label: 'Differenz zu heute' }
	];

	let activeIndicator = indicators[0].key;
	let activeWarming = warmingLevels[1].key;
	let viewMode = 'absolute';

	onMount(() => {
		map = new maplibregl.Map({
			container: 'scenarioMap',
			style: {
				version: 8,
				sources: {
					carto: {
						type: 'raster',
						tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors © CARTO'
					},
					climate: {
						type: 'vector',
						tiles: ['https://tiles.klimadashboard.org/data/indicators_all/{z}/{x}/{y}.pbf'],
						minzoom: 5,
						maxzoom: 9
					},
					outline: {
						type: 'geojson',
						data: {
							type: 'FeatureCollection',
							features: []
						}
					}
				},
				layers: [
					{
						id: 'carto-basemap',
						type: 'raster',
						source: 'carto',
						minzoom: 0,
						maxzoom: 22
					},
					{
						id: 'climate-layer',
						type: 'fill',
						source: 'climate',
						'source-layer': 'climate',
						paint: { 'fill-opacity': 0 }
					},
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
						},
						filter: [
							'all',
							['==', ['get', 'indicator'], activeIndicator],
							['==', ['get', 'warming_level'], activeWarming]
						]
					},
					{
						id: 'outline-layer',
						type: 'line',
						source: 'outline',
						paint: {
							'line-color': '#000',
							'line-width': 2,
							'line-opacity': 0.5
						}
					}
				]
			},
			center: [13.3, 47.5],
			zoom: 6
		});

		map.on('load', () => {
			const outline = page.data.page.outline || false;

			if (!outline) return;

			map.fitBounds(getBounds(outline), { padding: 10, duration: 0 });

			map.once('idle', () => {
				const tiles = map.queryRenderedFeatures({ layers: ['climate-layer'] });
				const tilesInRegion = tiles.filter(({ geometry }) => {
					return booleanContains(outline, centroid(geometry));
				});

				selection = aggregateCells(tilesInRegion);

				map.fitBounds(getBounds(selection), { padding: 25, duration: 0 });
				map.getSource('outline')?.setData(selection);
			});
		});

		// map.on('zoomend', () => {
		// 	const outline = page.data.page.outline;
		// 	if (!outline) return;

		// 	const tiles = map.queryRenderedFeatures({ layers: ['climate-layer'] });
		// 	const tilesInRegion = tiles.filter(({ geometry }) => {
		// 		return booleanContains(outline, centroid(geometry));
		// 	});

		// 	if (tilesInRegion.length === 0) return;

		// 	selection = aggregateCells(tilesInRegion);
		// 	map.getSource('outline')?.setData(selection);
		// });

		map.on('mousemove', (e) => {
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['climate-layer']
			});

			map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : 'default';
		});

		map.on('click', async (e) => {
			// if (map.getZoom() < 10) return;

			const features = map.queryRenderedFeatures(e.point, { layers: ['climate-layer'] });

			if (features.length === 0) return;

			selection = aggregateCells(features);
			map.getSource('outline')?.setData(selection);
		});
	});

	// $: activeWarming = warmingLevels[activeWarmingIndex];

	$: if (map && map.getLayer('climate-fill')) {
		const filterWarming = activeWarming === 'current' ? '2.0C' : activeWarming;
		map.setFilter('climate-fill', [
			'all',
			['==', ['get', 'indicator'], activeIndicator],
			['==', ['get', 'warming_level'], filterWarming]
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
				: activeWarming === 'current'
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

	const aggregateCells = (features) => {
		// {
		// 	indicator: 'heatdays_30'
		// 	current: 8.3,
		// 	warming_levels: [{
		// 		warming_level: "2.0C",
		// 		q10: 14.9,
		// 		q50: 18.05,
		// 		q90: 20.65,
		// 		delta: 4.05
		// 	}]
		// }
		// const featuresWithCentroid = features.map((feature) => {
		// 	const c = feature.properties.centroid ?? centroid(feature);
		// 	const id = feature.properties.id ?? c.geometry.coordinates.join('-');
		// 	return { ...feature, properties: { ...feature.properties, centroid: c, id } };
		// });

		return {
			type: 'Feature',
			geometry:
				features.length >= 2
					? union({
							type: 'FeatureCollection',
							features: features
						})?.geometry
					: (features[0]?.geometry ?? null),
			properties: Object.fromEntries(
				indicators.map(({ key }) => {
					return [
						key,
						Object.fromEntries(
							[...warmingLevels, 'current'].map((warmingLevel) => {
								const properties = features
									.filter(
										({ properties }) =>
											properties.indicator === key &&
											(properties.warming_level === warmingLevel || warmingLevel == 'current')
									)
									.map(({ properties }) => properties);

								return [
									warmingLevel,
									warmingLevel === 'current'
										? propertyMean(properties, 'current')
										: {
												q10: propertyMean(properties, 'q10'),
												q50: propertyMean(properties, 'q50'),
												q90: propertyMean(properties, 'q90'),
												delta: propertyMean(properties, 'delta')
											}
								];
							})
						)
					];
				})
			)
		};
	};

	const propertyMean = (arr, key) => {
		const values = arr.map((obj) => obj?.[key]).filter((value) => value != null && !isNaN(value));
		if (values.length === 0) return null;
		return values.reduce((a, b) => a + b) / values.length;
	};

	const getBounds = (feature) => {
		const bounds = bbox(feature);
		return [
			[bounds[0], bounds[1]],
			[bounds[2], bounds[3]]
		];
	};
</script>

<!-- UI Controls -->
<div class="controls space-y-2 mb-4">
	<Switch
		views={indicators}
		bind:activeView={activeIndicator}
		type="small"
		on:itemClick={(e) => (activeIndicator = e.detail)}
	/>

	<Switch
		views={viewModes}
		bind:activeView={viewMode}
		type="small"
		on:itemClick={(e) => (viewMode = e.detail)}
	/>

	<Switch
		views={warmingLevels}
		bind:activeView={activeWarming}
		type="small"
		on:itemClick={(e) => (activeWarming = e.detail)}
	/>
</div>

<!-- Map -->
<div id="scenarioMap" class="w-full h-[60vh] rounded-2xl relative"></div>

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
