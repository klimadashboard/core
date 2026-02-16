<!-- $lib/components/charts/custom/storageExplorer/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Switch from '$lib/components/Switch.svelte';
	import YearlyBarView from './YearlyBarView.svelte';
	import CumulativeAreaView from './CumulativeAreaView.svelte';
	import {
		fetchStorageData,
		getViewLabels,
		getViewIcons,
		getMetricLabels,
		getMetricIcons,
		MONTHLY_START,
		type ViewMode,
		type MetricMode,
		type StoragePeriodData
	} from './config';

	// Props from Card slot
	export let chart: any = {};
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let v: Record<string, string> = {};

	// Shared state
	let sharedData: StoragePeriodData[] = [];
	let sharedUpdateDate: string | null = null;
	let dataLoading = true;

	// Config from Directus
	$: config = chart.config || {};
	$: initialView = (config.initialView as ViewMode) || 'yearly';
	$: showViewSwitcher = config.showViewSwitcher !== false;

	// State
	let currentView: ViewMode;
	$: if (initialView) {
		currentView = initialView;
	}

	let currentMetric: MetricMode = 'power';

	$: viewLabels = getViewLabels();
	$: viewIcons = getViewIcons();
	$: switchViews = (['yearly', 'cumulative'] as ViewMode[]).map((view) => ({
		key: view,
		label: viewLabels[view],
		icon: viewIcons[view]
	}));

	$: metricLabels = getMetricLabels();
	$: metricIcons = getMetricIcons();
	$: switchMetrics = (['power', 'units'] as MetricMode[]).map((metric) => ({
		key: metric,
		label: metricLabels[metric],
		icon: metricIcons[metric]
	}));

	// Fetch data when region changes
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		dataLoading = true;
		try {
			const result = await fetchStorageData(region, 'month');
			sharedData = (result.by_period || []).filter(
				(d) => String(d.period) >= MONTHLY_START
			);
			sharedUpdateDate = result.update_date;
		} catch (e) {
			console.error('[storageExplorer] Error loading data:', e);
			sharedData = [];
			sharedUpdateDate = null;
		} finally {
			dataLoading = false;
		}
	}

	function handleViewSwitch(event: CustomEvent) {
		currentView = event.detail.key ?? event.detail;
	}

	function handleMetricSwitch(event: CustomEvent) {
		currentMetric = event.detail.key ?? event.detail;
	}
</script>

<div class="storage-explorer">
	{#if showViewSwitcher}
		<div class="mb-4 flex flex-wrap gap-2">
			<Switch views={switchViews} activeView={currentView} on:itemClick={handleViewSwitch} />
			<Switch views={switchMetrics} activeView={currentMetric} on:itemClick={handleMetricSwitch} />
		</div>
	{/if}

	<div class="chart-container">
		{#if currentView === 'yearly'}
			<YearlyBarView
				{region}
				{regionLoading}
				{onChartData}
				data={sharedData}
				updateDate={sharedUpdateDate}
				{dataLoading}
				metricMode={currentMetric}
			/>
		{:else if currentView === 'cumulative'}
			<CumulativeAreaView
				{region}
				{regionLoading}
				{onChartData}
				data={sharedData}
				updateDate={sharedUpdateDate}
				{dataLoading}
				metricMode={currentMetric}
			/>
		{/if}
	</div>
</div>

<style>
	.storage-explorer {
		width: 100%;
	}
	.chart-container {
		min-height: 280px;
	}
</style>
