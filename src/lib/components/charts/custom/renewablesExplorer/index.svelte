<!-- $lib/components/charts/custom/renewablesChart/index.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Switch from '$lib/components/Switch.svelte';
	import YearlyBarView from './YearlyBarView.svelte';
	import CumulativeLineView from './CumulativeLineView.svelte';
	import MapView from './MapView.svelte';
	import {
		getAvailableViews,
		getViewLabels,
		getViewIcons,
		type EnergyType,
		type ViewMode
	} from './config';

	// Props from Card slot (passed through Custom/index.svelte)
	export let chart: any = {};
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let v: Record<string, string> = {}; // Variables from Directus

	// Optional: regions list for comparison feature in cumulative view
	export let regions: Array<{
		code: string;
		codeShort?: string;
		name: string;
		center?: [number, number];
		area_km2?: number;
		layer?: string;
		visible?: boolean;
	}> = [];

	const dispatch = createEventDispatcher();

	/**
	 * Configuration from Directus (chart.config)
	 *
	 * Expected config structure in Directus:
	 * {
	 *   "component": "renewablesChart",
	 *   "energy": "solar" | "wind",
	 *   "initialView": "yearly" | "cumulative" | "map",  // optional, defaults to "yearly"
	 *   "showViewSwitcher": true | false                  // optional, defaults to true
	 * }
	 */
	$: config = chart.config || {};

	// Extract configuration with defaults
	$: selectedEnergy = (config.energy as EnergyType) || 'solar';
	$: initialView = (config.initialView as ViewMode) || 'yearly';
	$: showViewSwitcher = config.showViewSwitcher !== false; // defaults to true

	// State
	let currentView: ViewMode;

	// Initialize currentView from initialView (only on first load or when config changes)
	$: if (initialView) {
		currentView = initialView;
	}

	// Derived
	$: availableViews = getAvailableViews(selectedEnergy);
	$: viewLabels = getViewLabels(selectedEnergy);
	$: viewIcons = getViewIcons();

	// Build views array for Switch component
	$: switchViews = availableViews.map((view) => ({
		key: view,
		label: viewLabels[view],
		icon: viewIcons[view]
	}));

	// Reset to yearly view if current view is not available for selected energy
	$: if (currentView && !availableViews.includes(currentView)) {
		currentView = 'yearly';
	}

	// Get regionId from the region prop if available
	$: regionId = region?.id || null;

	// Handle view switch
	function handleViewSwitch(event: CustomEvent) {
		currentView = event.detail.key ?? event.detail;
	}

	// Handle map overlay event
	function handleMapOverlay(event: CustomEvent) {
		dispatch('openMapOverlay', event.detail);
	}
</script>

<div class="renewables-chart">
	<!-- View Switcher (optional based on config) -->
	{#if showViewSwitcher && availableViews.length > 1}
		<div class="mb-4">
			<Switch views={switchViews} activeView={currentView} on:itemClick={handleViewSwitch} />
		</div>
	{/if}

	<!-- Chart Views -->
	<div class="chart-container">
		{#if currentView === 'yearly'}
			<YearlyBarView {selectedEnergy} {region} {regionLoading} {onChartData} />
		{:else if currentView === 'cumulative'}
			<CumulativeLineView {selectedEnergy} {region} {regionLoading} {onChartData} {regions} />
		{:else if currentView === 'map'}
			<MapView
				{selectedEnergy}
				{region}
				{regionLoading}
				{regionId}
				{onChartData}
				on:openMapOverlay={handleMapOverlay}
			/>
		{/if}
	</div>
</div>

<style>
	.renewables-chart {
		width: 100%;
	}

	.chart-container {
		min-height: 280px;
	}
</style>
