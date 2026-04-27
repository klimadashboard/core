<!-- $lib/components/charts/custom/renewablesChart/MapView.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { page } from '$app/state';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fetchRegion } from '$lib/utils/getRegion';
	import type { Region } from '$lib/utils/getRegion';
	import Loader from '$lib/components/Loader.svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import {
		fetchAllTurbines,
		fetchTurbineDetails,
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
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Shared data props (from parent) - for placeholders like titleWind
	export let yearlyData: Array<{
		year: number;
		added_units?: number;
		cumulative_units?: number;
	}> = [];
	export let goal: any = null;
	export let updateDate: string = '';
	export let gridOperatorCheckedRatio: number | null = null;
	export let dataLoading: boolean = true;

	const dispatch = createEventDispatcher();

	// Color for highlighted (region-owned) turbines
	const HIGHLIGHTED_COLOR = '#0ea5e9';

	// State
	let loading = true;
	let internalRegionLoading = true;
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let turbines: TurbineData[] = [];
	let hoveredTurbine: TurbineData | null = null;
	let hoveredTurbineId: string | null = null;
	let loadingDetails = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let isDarkMode = false;

	// Region data
	let internalRegion: Region | null = null;
	$: effectiveRegion = region || internalRegion;
	$: regionName = effectiveRegion?.name || 'Deutschland';
	$: regionCenter = effectiveRegion?.center || ['10.45', '51.16'];
	$: regionOutline = effectiveRegion?.outline || page?.data?.page?.outline;

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

	$: color = getColor(selectedEnergy);

	// Check if a turbine is owned by the current region
	function isRegionOwned(turbine: TurbineData): boolean {
		if (!effectiveRegionId || !turbine.region_owner) return false;
		return turbine.region_owner === effectiveRegionId;
	}

	// Detect dark mode
	function checkDarkMode() {
		isDarkMode = document.body.classList.contains('dark');
	}

	// Count turbines by category (region-owned vs regular)
	$: highlightedTurbines = turbines.filter((t) => isRegionOwned(t));
	$: regularTurbines = turbines.filter((t) => !isRegionOwned(t));

	// Load region data (only if not provided via prop)
	async function loadRegion() {
		if (region) {
			internalRegion = null;
			internalRegionLoading = false;
			initializeMap(region.center || ['10.45', '51.16']);
			return;
		}

		internalRegionLoading = true;

		if (!effectiveRegionId) {
			internalRegion = null;
			internalRegionLoading = false;
			initializeMap(['10.45', '51.16']);
			return;
		}

		try {
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

	// Load all turbines
	async function loadTurbines() {
		loading = true;
		try {
			turbines = await fetchAllTurbines(selectedEnergy);
			if (map) {
				addTurbinesToMap();
			}
		} catch (error) {
			console.error('Failed to load renewable units:', error);
		} finally {
			loading = false;
		}
	}

	// Fetch turbine details on hover
	async function loadTurbineDetails(turbineId: string) {
		if (hoveredTurbineId === turbineId && hoveredTurbine) return;

		hoveredTurbineId = turbineId;
		loadingDetails = true;

		try {
			const details = await fetchTurbineDetails(turbineId, selectedEnergy);
			if (details && hoveredTurbineId === turbineId) {
				hoveredTurbine = details;
			}
		} catch (error) {
			console.error('Failed to load turbine details:', error);
		} finally {
			loadingDetails = false;
		}
	}

	function getBasemapStyle(dark: boolean) {
		const tiles = dark
			? [
					'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
					'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
					'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
				]
			: [
					'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
					'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
					'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
				];

		return {
			version: 8,
			sources: {
				'carto-basemap': {
					type: 'raster',
					tiles,
					tileSize: 256
				}
			},
			layers: [
				{
					id: 'carto-basemap',
					type: 'raster',
					source: 'carto-basemap'
				}
			]
		};
	}

	function initializeMap(center: [string, string] | string[]) {
		if (!mapContainer) {
			console.error('Map container not found');
			return;
		}

		checkDarkMode();

		const centerArray: [string, string] = [String(center[0]), String(center[1])];

		if (map) {
			// If we have a region outline, fit to it; otherwise just center
			if (regionOutline) {
				fitToRegionOutline();
			} else {
				const lon = parseFloat(centerArray[0]);
				const lat = parseFloat(centerArray[1]);
				map.setCenter([isNaN(lon) ? 10.45 : lon, isNaN(lat) ? 51.16 : lat]);
			}
			// Re-add turbines to update highlighting and potentially re-fit
			if (turbines.length > 0) {
				addTurbinesToMap();
			}
			return;
		}

		const lon = parseFloat(centerArray[0]);
		const lat = parseFloat(centerArray[1]);
		const centerCoords: [number, number] = [isNaN(lon) ? 10.45 : lon, isNaN(lat) ? 51.16 : lat];

		map = new maplibregl.Map({
			container: mapContainer,
			style: getBasemapStyle(isDarkMode),
			center: centerCoords,
			zoom: 8
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');

		map.on('load', () => {
			loadTurbines();
		});

		map.on('mousemove', 'turbines-layer', (e: any) => {
			if (!map || !e.features || e.features.length === 0) return;

			map.getCanvas().style.cursor = 'pointer';

			const feature = e.features[0];
			const turbineId = feature.properties.id;

			loadTurbineDetails(turbineId);

			tooltipX = e.point.x;
			tooltipY = e.point.y;
		});

		map.on('mouseleave', 'turbines-layer', () => {
			if (!map) return;
			map.getCanvas().style.cursor = '';
			hoveredTurbine = null;
			hoveredTurbineId = null;
		});

		// Watch for dark mode changes
		const observer = new MutationObserver(() => {
			const nowDark = document.body.classList.contains('dark');
			if (nowDark !== isDarkMode) {
				isDarkMode = nowDark;
				if (map) {
					map.setStyle(getBasemapStyle(isDarkMode));
					map.once('styledata', () => {
						addTurbinesToMap();
					});
				}
			}
		});
		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
	}

	function addRegionOutline() {
		if (!map || !regionOutline) return;

		// Remove existing outline
		if (map.getLayer('region-outline')) {
			map.removeLayer('region-outline');
		}
		if (map.getSource('region-outline')) {
			map.removeSource('region-outline');
		}

		try {
			// Parse outline GeoJSON
			const outlineGeoJSON =
				typeof regionOutline === 'string' ? JSON.parse(regionOutline) : regionOutline;

			map.addSource('region-outline', {
				type: 'geojson',
				data: outlineGeoJSON
			});

			map.addLayer({
				id: 'region-outline',
				type: 'line',
				source: 'region-outline',
				paint: {
					'line-color': isDarkMode ? '#ffffff' : '#000000',
					'line-width': 2,
					'line-opacity': 0.6
				}
			});
		} catch (error) {
			console.error('Failed to add region outline:', error);
		}
	}

	/** Calculate bounding box for an array of turbines */
	function calculateBounds(
		turbineList: TurbineData[]
	): [[number, number], [number, number]] | null {
		if (turbineList.length === 0) return null;

		let minLon = Infinity,
			maxLon = -Infinity,
			minLat = Infinity,
			maxLat = -Infinity;

		for (const t of turbineList) {
			if (t.lon < minLon) minLon = t.lon;
			if (t.lon > maxLon) maxLon = t.lon;
			if (t.lat < minLat) minLat = t.lat;
			if (t.lat > maxLat) maxLat = t.lat;
		}

		return [
			[minLon, minLat],
			[maxLon, maxLat]
		];
	}

	/** Get bounds from region outline */
	function getRegionOutlineBounds(): [[number, number], [number, number]] | null {
		if (!regionOutline) return null;

		try {
			const outlineGeoJSON =
				typeof regionOutline === 'string' ? JSON.parse(regionOutline) : regionOutline;

			// Extract coordinates from GeoJSON to calculate bounds
			const coords: [number, number][] = [];
			const extractCoords = (geometry: any) => {
				if (geometry.type === 'Polygon') {
					geometry.coordinates[0].forEach((c: number[]) => coords.push([c[0], c[1]]));
				} else if (geometry.type === 'MultiPolygon') {
					geometry.coordinates.forEach((poly: number[][][]) => {
						poly[0].forEach((c: number[]) => coords.push([c[0], c[1]]));
					});
				} else if (geometry.type === 'GeometryCollection') {
					geometry.geometries.forEach(extractCoords);
				} else if (geometry.type === 'Feature') {
					extractCoords(geometry.geometry);
				} else if (geometry.type === 'FeatureCollection') {
					geometry.features.forEach((f: any) => extractCoords(f.geometry));
				}
			};

			extractCoords(outlineGeoJSON);

			if (coords.length === 0) return null;

			let minLon = Infinity,
				maxLon = -Infinity,
				minLat = Infinity,
				maxLat = -Infinity;

			for (const [lon, lat] of coords) {
				if (lon < minLon) minLon = lon;
				if (lon > maxLon) maxLon = lon;
				if (lat < minLat) minLat = lat;
				if (lat > maxLat) maxLat = lat;
			}

			return [
				[minLon, minLat],
				[maxLon, maxLat]
			];
		} catch (error) {
			console.error('Failed to get region outline bounds:', error);
			return null;
		}
	}

	/** Combine two bounding boxes into one that contains both */
	function combineBounds(
		bounds1: [[number, number], [number, number]] | null,
		bounds2: [[number, number], [number, number]] | null
	): [[number, number], [number, number]] | null {
		if (!bounds1 && !bounds2) return null;
		if (!bounds1) return bounds2;
		if (!bounds2) return bounds1;

		return [
			[Math.min(bounds1[0][0], bounds2[0][0]), Math.min(bounds1[0][1], bounds2[0][1])],
			[Math.max(bounds1[1][0], bounds2[1][0]), Math.max(bounds1[1][1], bounds2[1][1])]
		];
	}

	/** Fit map to show highlighted turbines AND region outline */
	function fitToHighlightedTurbines(highlightedList: TurbineData[]) {
		if (!map) return;

		const turbineBounds = highlightedList.length > 0 ? calculateBounds(highlightedList) : null;
		const regionBounds = getRegionOutlineBounds();
		const combinedBounds = combineBounds(turbineBounds, regionBounds);

		if (!combinedBounds) return;

		map.fitBounds(combinedBounds, {
			padding: { top: 50, bottom: 50, left: 50, right: 50 },
			maxZoom: 10,
			duration: 1000
		});
	}

	/** Fit map to region outline with padding */
	function fitToRegionOutline() {
		if (!map) return;

		const bounds = getRegionOutlineBounds();
		if (!bounds) return;

		map.fitBounds(bounds, {
			padding: { top: 30, bottom: 30, left: 30, right: 30 },
			maxZoom: 12,
			duration: 1000
		});
	}

	function addTurbinesToMap() {
		if (!map || turbines.length === 0) return;

		// Remove existing layer and source
		if (map.getLayer('turbines-layer')) {
			map.removeLayer('turbines-layer');
		}
		if (map.getLayer('turbines-highlighted-layer')) {
			map.removeLayer('turbines-highlighted-layer');
		}
		if (map.getSource('turbines')) {
			map.removeSource('turbines');
		}
		if (map.getSource('turbines-highlighted')) {
			map.removeSource('turbines-highlighted');
		}

		// Add region outline first (so it appears below turbines)
		addRegionOutline();

		// Separate regular turbines and region-owned (highlighted) turbines
		const regularTurbinesData = turbines.filter((t) => !isRegionOwned(t));
		const highlightedTurbinesData = turbines.filter((t) => isRegionOwned(t));

		// Add regular turbines
		if (regularTurbinesData.length > 0) {
			map.addSource('turbines', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: regularTurbinesData.map((t) => ({
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [t.lon, t.lat]
						},
						properties: {
							id: t.id
						}
					}))
				}
			});

			map.addLayer({
				id: 'turbines-layer',
				type: 'circle',
				source: 'turbines',
				paint: {
					'circle-radius': 4,
					'circle-color': color,
					'circle-stroke-color': '#ffffff',
					'circle-stroke-width': 1,
					'circle-opacity': 0.8
				}
			});
		}

		// Add highlighted (region-owned) turbines
		if (highlightedTurbinesData.length > 0) {
			map.addSource('turbines-highlighted', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: highlightedTurbinesData.map((t) => ({
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [t.lon, t.lat]
						},
						properties: {
							id: t.id
						}
					}))
				}
			});

			map.addLayer({
				id: 'turbines-highlighted-layer',
				type: 'circle',
				source: 'turbines-highlighted',
				paint: {
					'circle-radius': 5,
					'circle-color': HIGHLIGHTED_COLOR,
					'circle-stroke-color': '#ffffff',
					'circle-stroke-width': 1.5,
					'circle-opacity': 0.9
				}
			});

			// Zoom to fit all highlighted turbines
			fitToHighlightedTurbines(highlightedTurbinesData);
		} else if (regionOutline) {
			// No highlighted turbines - zoom to region boundary
			fitToRegionOutline();
		}
	}

	function openMapOverlay() {
		dispatch('openMapOverlay', {
			layerId: `${selectedEnergy}-power`,
			regionCode: effectiveRegion?.codeShort,
			regionName: regionName
		});
	}

	// Reactive: Load region when effectiveRegionId changes
	let mounted = false;
	$: if (mounted && (effectiveRegionId !== undefined || region)) {
		loadRegion();
	}

	// Build titleWind placeholder for map view using shared yearly data
	$: titleWind = (() => {
		if (selectedEnergy !== 'wind') return '';
		const regionDisplayName = effectiveRegion?.name || 'Deutschland';

		// Use shared yearly data if available (for accurate "last installation year" info)
		if (yearlyData.length > 0) {
			const lastEntry = yearlyData[yearlyData.length - 1];
			const totalCumulativeUnits = lastEntry?.cumulative_units || 0;

			if (totalCumulativeUnits === 0) {
				return `In ${regionDisplayName} ist aktuell kein Windrad in Betrieb.`;
			}

			// Find the most recent year with new installations
			const lastYearWithInstallation = [...yearlyData].reverse().find((d) => (d.added_units || 0) > 0);
			if (lastYearWithInstallation) {
				return `Zuletzt wurde im Jahr ${lastYearWithInstallation.year} ein Windrad in ${regionDisplayName} in Betrieb genommen.`;
			}

			// Has cumulative but no yearly data - fallback
			return `In ${regionDisplayName} sind Windräder in Betrieb.`;
		}

		// Fallback to turbine count if yearly data not yet loaded
		const totalTurbines = turbines.length;
		if (totalTurbines === 0 && !loading && !regionLoading && !internalRegionLoading && !dataLoading) {
			return `In ${regionDisplayName} ist aktuell kein Windrad in Betrieb.`;
		} else if (totalTurbines > 0) {
			return `In ${regionDisplayName} sind Windräder in Betrieb.`;
		}
		return '';
	})();

	// Send chart data with placeholders when region is available
	$: if (onChartData && effectiveRegion !== undefined) {
		onChartData({
			raw: [],
			table: { columns: [], rows: [], filename: `${selectedEnergy}-map` },
			placeholders: {
				regionName: effectiveRegion?.name || 'Deutschland',
				energyType: selectedEnergy,
				energyLabel: selectedEnergy === 'solar' ? 'Solar' : 'Wind',
				titleWind
			},
			meta: {
				updateDate: new Date().toISOString(),
				source: 'Marktstammdatenregister der Bundesnetzagentur',
				region: effectiveRegion
			},
			hasData: true // Map view is always considered to have data
		});
	}

	// Reactive: Reload turbines when energy type changes
	$: if (mounted && map && selectedEnergy) {
		loadTurbines();
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
				<Loader showText={true} />
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
						Keine {energyLabel} gefunden
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
				{#if loadingDetails}
					<div class="flex items-center gap-2">
						<div
							class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"
						></div>
						<span>Lade Details...</span>
					</div>
				{:else}
					<div class="font-bold mb-1" class:text-sky-600={isRegionOwned(hoveredTurbine)}>
						{hoveredTurbine.name || 'Anlage'}
					</div>
					{#if isRegionOwned(hoveredTurbine)}
						<div class="text-xs text-sky-600 mb-1">Anlage von {regionName}</div>
					{/if}
					<div class="space-y-1 text-xs">
						<div><strong>Leistung:</strong> {formatPowerValue(hoveredTurbine.net_power_kw)}</div>
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
						{#if hoveredTurbine.height}
							<div><strong>Nabenhöhe:</strong> {hoveredTurbine.height} m</div>
						{/if}
						{#if hoveredTurbine.rotor_diameter}
							<div><strong>Rotordurchmesser:</strong> {hoveredTurbine.rotor_diameter} m</div>
						{/if}
					</div>
				{/if}
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
			{#if regularTurbines.length > 0}
				<div class="flex items-center gap-2">
					<div
						class="w-4 h-4 rounded-full border-2 border-white shadow"
						style="background-color: {color}"
					></div>
					<span>{energyLabel} ({formatNumber(regularTurbines.length)})</span>
				</div>
			{/if}
			{#if highlightedTurbines.length > 0}
				<div class="flex items-center gap-2">
					<div
						class="w-5 h-5 rounded-full border-2 border-white shadow"
						style="background-color: {HIGHLIGHTED_COLOR}"
					></div>
					<span>Anlagen von {regionName} ({formatNumber(highlightedTurbines.length)})</span>
				</div>
			{/if}
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
