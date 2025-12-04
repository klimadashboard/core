<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	// Props
	export let regionCode = null;
	export let regionName = 'Deutschland';
	export let regionCenter = [10.45, 51.16];

	const dispatch = createEventDispatcher();

	// State
	let loading = true;
	let mapContainer;
	let map;
	let turbines = [];
	let hoveredTurbine = null;
	let tooltipX = 0;
	let tooltipY = 0;

	// Formatting
	function formatPower(value) {
		if (value >= 1000) {
			return `${(value / 1000).toFixed(2)} MW`;
		}
		return `${value.toFixed(0)} kW`;
	}

	function formatNumber(value) {
		return new Intl.NumberFormat('de-DE').format(value);
	}

	// Data fetching
	async function loadTurbines() {
		loading = true;
		try {
			const url = regionCode
				? `https://base.klimadashboard.org/get-renewable-units?table=energy_wind_units&region=${regionCode}`
				: `https://base.klimadashboard.org/get-renewable-units?table=energy_wind_units`;

			const response = await fetch(url);
			const data = await response.json();

			turbines = data
				.filter((d) => d.latitude && d.longitude && d.net_power_kw)
				.map((d) => ({
					...d,
					coordinates: [parseFloat(d.longitude), parseFloat(d.latitude)]
				}));

			loading = false;

			if (map) {
				addTurbinesToMap();
			}
		} catch (error) {
			console.error('Failed to load wind turbines:', error);
			loading = false;
		}
	}

	function addTurbinesToMap() {
		if (!map || turbines.length === 0) return;

		// Remove existing layers/sources
		if (map.getLayer('turbines')) map.removeLayer('turbines');
		if (map.getLayer('turbines-halo')) map.removeLayer('turbines-halo');
		if (map.getLayer('clusters')) map.removeLayer('clusters');
		if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
		if (map.getSource('turbines')) map.removeSource('turbines');

		// Add source
		map.addSource('turbines', {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: turbines.map((t) => ({
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: t.coordinates
					},
					properties: {
						name: t.name || 'Unbekannt',
						power_kw: t.net_power_kw,
						commissioning_date: t.commissioning_date,
						manufacturer: t.manufacturer || 'Unbekannt',
						hub_height_m: t.hub_height_m,
						rotor_diameter_m: t.rotor_diameter_m
					}
				}))
			},
			cluster: true,
			clusterMaxZoom: 12,
			clusterRadius: 50
		});

		// Cluster circles
		map.addLayer({
			id: 'clusters',
			type: 'circle',
			source: 'turbines',
			filter: ['has', 'point_count'],
			paint: {
				'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
				'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25],
				'circle-stroke-width': 2,
				'circle-stroke-color': '#fff'
			}
		});

		// Cluster count labels
		map.addLayer({
			id: 'cluster-count',
			type: 'symbol',
			source: 'turbines',
			filter: ['has', 'point_count'],
			layout: {
				'text-field': '{point_count_abbreviated}',
				'text-font': ['Noto Sans Regular'],
				'text-size': 12
			},
			paint: {
				'text-color': '#fff'
			}
		});

		// Individual turbine points (halo)
		map.addLayer({
			id: 'turbines-halo',
			type: 'circle',
			source: 'turbines',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-radius': 8,
				'circle-color': '#fff',
				'circle-opacity': 0.8
			}
		});

		// Individual turbine points
		map.addLayer({
			id: 'turbines',
			type: 'circle',
			source: 'turbines',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-radius': 6,
				'circle-color': '#003B80',
				'circle-stroke-width': 1,
				'circle-stroke-color': '#fff'
			}
		});

		// Click handler for clusters - zoom in
		map.on('click', 'clusters', (e) => {
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['clusters']
			});
			const clusterId = features[0].properties.cluster_id;
			map.getSource('turbines').getClusterExpansionZoom(clusterId, (err, zoom) => {
				if (err) return;
				map.easeTo({
					center: features[0].geometry.coordinates,
					zoom: zoom
				});
			});
		});

		// Hover handlers for individual turbines
		map.on('mousemove', 'turbines', (e) => {
			if (e.features.length > 0) {
				map.getCanvas().style.cursor = 'pointer';
				const feature = e.features[0];
				hoveredTurbine = feature.properties;
				tooltipX = e.point.x;
				tooltipY = e.point.y;
			}
		});

		map.on('mouseleave', 'turbines', () => {
			map.getCanvas().style.cursor = '';
			hoveredTurbine = null;
		});

		// Fit bounds to turbines
		if (turbines.length > 0) {
			const bounds = turbines.reduce((bounds, t) => {
				return bounds.extend(t.coordinates);
			}, new maplibregl.LngLatBounds());

			map.fitBounds(bounds, {
				padding: 50,
				maxZoom: 10
			});
		}
	}

	function openMapOverlay() {
		dispatch('openMapOverlay', {
			layerId: 'wind-power',
			regionCode,
			regionName
		});
	}

	// Reactive statements
	$: if (regionCode !== undefined) {
		loadTurbines();
	}

	onMount(() => {
		// Initialize map
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				sources: {
					'carto-light': {
						type: 'raster',
						tiles: [
							'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
							'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
							'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
						],
						tileSize: 256
					}
				},
				layers: [
					{
						id: 'carto-light',
						type: 'raster',
						source: 'carto-light'
					}
				]
			},
			center: regionCenter,
			zoom: 7
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');

		map.on('load', () => {
			loadTurbines();
		});

		return () => {
			if (map) {
				map.remove();
			}
		};
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	$: totalPower = turbines.reduce((sum, t) => sum + (t.net_power_kw || 0), 0);
	$: avgPower = turbines.length > 0 ? totalPower / turbines.length : 0;
</script>

<div class="renewables-wind-map">
	{#if loading && turbines.length === 0}
		<div class="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
	{:else if turbines.length === 0}
		<div class="text-center py-8">
			<p class="text-gray-500">Keine Windkraftanlagen in dieser Region gefunden</p>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-4">
			<div class="flex justify-between items-start">
				<div>
					<h3 class="font-bold text-lg">Windkraftanlagen-Standorte</h3>
					<p class="text-sm opacity-80 mt-1">
						{formatNumber(turbines.length)} Windräder mit insgesamt {formatPower(totalPower)} Leistung
					</p>
				</div>
				<button
					on:click={openMapOverlay}
					class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
						<path d="M9 3v15" />
						<path d="M15 6v15" />
					</svg>
					Detailkarte öffnen
				</button>
			</div>
		</div>

		<!-- Map -->
		<div class="relative">
			<div
				bind:this={mapContainer}
				class="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
			></div>

			<!-- Tooltip -->
			{#if hoveredTurbine}
				<div
					class="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm pointer-events-none"
					style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;"
				>
					<div class="font-bold mb-1">{hoveredTurbine.name}</div>
					<div class="space-y-1 text-xs">
						<div><strong>Leistung:</strong> {formatPower(hoveredTurbine.power_kw)}</div>
						{#if hoveredTurbine.commissioning_date}
							<div>
								<strong>Inbetriebnahme:</strong>
								{new Date(hoveredTurbine.commissioning_date).toLocaleDateString('de-DE')}
							</div>
						{/if}
						{#if hoveredTurbine.manufacturer}
							<div><strong>Hersteller:</strong> {hoveredTurbine.manufacturer}</div>
						{/if}
						{#if hoveredTurbine.hub_height_m}
							<div><strong>Nabenhöhe:</strong> {hoveredTurbine.hub_height_m} m</div>
						{/if}
						{#if hoveredTurbine.rotor_diameter_m}
							<div><strong>Rotordurchmesser:</strong> {hoveredTurbine.rotor_diameter_m} m</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Loading overlay -->
			{#if loading}
				<div
					class="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-lg"
				>
					<div
						class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"
					></div>
				</div>
			{/if}
		</div>

		<!-- Legend -->
		<div class="mt-4 flex flex-wrap gap-4 text-sm">
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 rounded-full bg-[#003B80] border-2 border-white"></div>
				<span>Einzelne Anlage</span>
			</div>
			<div class="flex items-center gap-2">
				<div
					class="w-6 h-6 rounded-full bg-[#51bbd6] border-2 border-white flex items-center justify-center text-white text-xs font-bold"
				>
					5
				</div>
				<span>Gruppe (Klicken zum Zoomen)</span>
			</div>
		</div>

		<!-- Stats -->
		<div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
				<div>
					<div class="text-2xl font-bold">{formatNumber(turbines.length)}</div>
					<div class="text-xs opacity-80">Anlagen</div>
				</div>
				<div>
					<div class="text-2xl font-bold">{formatPower(totalPower)}</div>
					<div class="text-xs opacity-80">Gesamtleistung</div>
				</div>
				<div>
					<div class="text-2xl font-bold">{formatPower(avgPower)}</div>
					<div class="text-xs opacity-80">Ø Leistung</div>
				</div>
				<div>
					<div class="text-2xl font-bold">
						{turbines.filter((t) => new Date(t.commissioning_date).getFullYear() >= 2020).length}
					</div>
					<div class="text-xs opacity-80">Seit 2020</div>
				</div>
			</div>
		</div>

		<p class="text-xs opacity-80 mt-3">
			Datenquelle: Marktstammdatenregister der Bundesnetzagentur
		</p>
	{/if}
</div>

<style>
	:global(.maplibregl-ctrl-logo) {
		display: none !important;
	}
</style>
