<!-- $lib/components/charts/custom/renewablesChart/MapView.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { page } from '$app/state';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fetchRegion } from '$lib/utils/getRegion';
	import type { Region } from '$lib/utils/getRegion';
	import {
		fetchTurbines,
		getColor,
		formatPowerValue,
		formatNumber,
		type EnergyType,
		type TurbineData
	} from './config';

	// Props
	export let selectedEnergy: EnergyType = 'wind';
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let regionId: string | null = null;

	const dispatch = createEventDispatcher();

	// State
	let loading = true;
	let internalRegionLoading = true;
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let turbines: TurbineData[] = [];
	let hoveredTurbine: Record<string, any> | null = null;
	let tooltipX = 0;
	let tooltipY = 0;

	// Region data
	let internalRegion: Region | null = null;
	$: effectiveRegion = region || internalRegion;
	$: regionName = effectiveRegion?.name || 'Deutschland';
	$: regionCenter = effectiveRegion?.center || ['10.45', '51.16'];

	// Get effective region ID from props, URL, or page data
	$: urlRegionId = page?.url?.searchParams?.get('region');
	$: pageRegionId = page?.data?.page?.id;
	$: effectiveRegionId = regionId || urlRegionId || pageRegionId || null;

	// Energy labels
	$: energyLabel =
		{
			wind: 'Windkraftanlagen',
			solar: 'Solaranlagen',
			hydro: 'Wasserkraftanlagen',
			bio: 'Biomasseanlagen'
		}[selectedEnergy] || 'Anlagen';

	$: unitLabel =
		{
			wind: 'Windräder',
			solar: 'Solaranlagen',
			hydro: 'Wasserkraftwerke',
			bio: 'Biomasseanlagen'
		}[selectedEnergy] || 'Anlagen';

	$: color = getColor(selectedEnergy);

	// Load region data (only if not provided via prop)
	async function loadRegion() {
		if (region) {
			// Region provided via prop, use it directly
			internalRegion = null;
			internalRegionLoading = false;
			initializeMap(region.center || ['10.45', '51.16']);
			return;
		}

		internalRegionLoading = true;

		// If no region ID, we're at country level
		if (!effectiveRegionId) {
			internalRegion = null;
			internalRegionLoading = false;
			initializeMap(['10.45', '51.16']);
			return;
		}

		try {
			// First check if region is already in page data
			const pageRegion = page?.data?.page;
			if (pageRegion && pageRegion.id === effectiveRegionId) {
				internalRegion = {
					id: pageRegion.id,
					code: pageRegion.code,
					codeShort: pageRegion.codeShort,
					name: pageRegion.name,
					layer: pageRegion.layer,
					center: pageRegion.center,
					area_km2: pageRegion.area_km2,
					population: pageRegion.population,
					parents: pageRegion.parents
				};
				internalRegionLoading = false;
				initializeMap(internalRegion.center);
			} else {
				// Fetch from API
				internalRegion = await fetchRegion(effectiveRegionId);
				internalRegionLoading = false;
				initializeMap(internalRegion?.center || ['10.45', '51.16']);
			}
		} catch (error) {
			console.error('Failed to load region:', error);
			internalRegion = null;
			internalRegionLoading = false;
			initializeMap(['10.45', '51.16']);
		}
	}

	// Data fetching
	async function loadTurbines(center: [string, string]) {
		loading = true;
		try {
			turbines = await fetchTurbines(center, selectedEnergy, 50);

			if (map) {
				addTurbinesToMap();
			}
		} catch (error) {
			console.error('Failed to load renewable units:', error);
		} finally {
			loading = false;
		}
	}

	function initializeMap(center: [string, string] | string[]) {
		if (!mapContainer) {
			console.error('Map container not found');
			return;
		}

		// Ensure center is properly typed
		const centerArray: [string, string] = [String(center[0]), String(center[1])];

		// If map already exists, just update center and load turbines
		if (map) {
			const lon = parseFloat(centerArray[0]);
			const lat = parseFloat(centerArray[1]);
			map.setCenter([isNaN(lon) ? 10.45 : lon, isNaN(lat) ? 51.16 : lat]);
			loadTurbines(centerArray);
			return;
		}

		// Parse center coordinates
		const lon = parseFloat(centerArray[0]);
		const lat = parseFloat(centerArray[1]);
		const centerCoords: [number, number] = [isNaN(lon) ? 10.45 : lon, isNaN(lat) ? 51.16 : lat];

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
			center: centerCoords,
			zoom: 9
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');

		map.on('load', () => {
			loadTurbines(centerArray);
		});
	}

	function addTurbinesToMap() {
		if (!map || turbines.length === 0) return;

		// Remove existing layers/sources
		if (map.getLayer('turbines')) map.removeLayer('turbines');
		if (map.getLayer('turbines-halo')) map.removeLayer('turbines-halo');
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
						hub_height_m: t.height,
						rotor_diameter_m: t.rotor_diameter,
						municipality: t.municipality,
						district: t.district
					}
				}))
			}
		});

		// Individual turbine points (halo)
		map.addLayer({
			id: 'turbines-halo',
			type: 'circle',
			source: 'turbines',
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
			paint: {
				'circle-radius': 6,
				'circle-color': color,
				'circle-stroke-width': 1,
				'circle-stroke-color': '#fff'
			}
		});

		// Hover handlers for individual turbines
		map.on('mousemove', 'turbines', (e) => {
			if (e.features && e.features.length > 0) {
				map!.getCanvas().style.cursor = 'pointer';
				const feature = e.features[0];
				hoveredTurbine = feature.properties;
				tooltipX = e.point.x;
				tooltipY = e.point.y;
			}
		});

		map.on('mouseleave', 'turbines', () => {
			map!.getCanvas().style.cursor = '';
			hoveredTurbine = null;
		});

		// Fit bounds to turbines
		if (turbines.length > 0) {
			const bounds = turbines.reduce((bounds, t) => {
				if (t.coordinates) {
					return bounds.extend(t.coordinates);
				}
				return bounds;
			}, new maplibregl.LngLatBounds());

			map.fitBounds(bounds, {
				padding: 50,
				maxZoom: 12
			});
		}
	}

	function openMapOverlay() {
		dispatch('openMapOverlay', {
			layerId: `${selectedEnergy}-power`,
			regionCode: effectiveRegion?.codeShort,
			regionName: regionName
		});
	}

	// Reactive: Load region when effectiveRegionId changes (only if mounted)
	let mounted = false;
	$: if (mounted && (effectiveRegionId !== undefined || region)) {
		loadRegion();
	}

	// Reactive: Reload turbines when energy type changes
	$: if (mounted && map && selectedEnergy) {
		loadTurbines(regionCenter as [string, string]);
	}

	onMount(() => {
		mounted = true;
		loadRegion();
	});

	onDestroy(() => {
		mounted = false;
		if (map) {
			map.remove();
		}
	});

	$: totalPower = turbines.reduce((sum, t) => sum + (t.net_power_kw || 0), 0);
</script>

<div class="map-view">
	<!-- Map Container -->
	<div class="relative">
		<div
			bind:this={mapContainer}
			class="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
		></div>

		<!-- Loading State Overlay -->
		{#if (loading || regionLoading || internalRegionLoading) && turbines.length === 0}
			<div
				class="absolute inset-0 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center"
			>
				<div class="text-center">
					<div
						class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-2"
					></div>
					<div class="text-gray-500">Lade Daten...</div>
				</div>
			</div>
		{/if}

		<!-- Empty State Overlay -->
		{#if !loading && !regionLoading && !internalRegionLoading && turbines.length === 0}
			<div
				class="absolute inset-0 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center"
			>
				<div class="text-center py-8">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-12 w-12 mx-auto mb-3 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
						/>
					</svg>
					<p class="text-gray-600 dark:text-gray-400 font-medium">
						Keine {energyLabel} in dieser Region gefunden
					</p>
					{#if regionName}
						<p class="text-sm text-gray-500 mt-1">Region: {regionName}</p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Tooltip -->
		{#if hoveredTurbine}
			<div
				class="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm pointer-events-none"
				style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;"
			>
				<div class="font-bold mb-1">{hoveredTurbine.name || 'Anlage'}</div>
				<div class="space-y-1 text-xs">
					<div><strong>Leistung:</strong> {formatPowerValue(hoveredTurbine.power_kw)}</div>
					{#if hoveredTurbine.municipality}
						<div><strong>Gemeinde:</strong> {hoveredTurbine.municipality}</div>
					{/if}
					{#if hoveredTurbine.district}
						<div><strong>Landkreis:</strong> {hoveredTurbine.district}</div>
					{/if}
					{#if hoveredTurbine.commissioning_date}
						<div>
							<strong>Inbetriebnahme:</strong>
							{new Date(hoveredTurbine.commissioning_date).toLocaleDateString('de-DE')}
						</div>
					{/if}
					{#if hoveredTurbine.manufacturer && hoveredTurbine.manufacturer !== 'Unbekannt'}
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

		<!-- Loading overlay for updates -->
		{#if loading && turbines.length > 0}
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
	{#if turbines.length > 0}
		<div class="mt-4 flex flex-wrap gap-4 text-sm">
			<div class="flex items-center gap-2">
				<div
					class="w-4 h-4 rounded-full border-2 border-white shadow"
					style="background-color: {color}"
				></div>
				<span>Einzelne Anlage</span>
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
