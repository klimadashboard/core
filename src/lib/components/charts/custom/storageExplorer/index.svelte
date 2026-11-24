<!-- $lib/components/charts/custom/storageExplorer/index.svelte -->
<script lang="ts">
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Switch from '$lib/components/Switch.svelte';
	import RegionDrilldown from '$lib/components/charts/RegionDrilldown.svelte';
	import { fetchRegion } from '$lib/utils/getRegion';
	import type { ContextRegion } from '$lib/utils/regionContext';
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
	export const v: Record<string, string> = {};

	// Shared state
	let sharedData: StoragePeriodData[] = [];
	let sharedUpdateDate: string | null = null;
	let dataLoading = true;

	// Config from Directus
	$: config = chart.config || {};
	$: initialView = (config.initialView as ViewMode) || 'cumulative';
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

	// Region shown in the chart: the card's region, or a Kreis / Gemeinde inside it
	let switchedRegion: Region | null = null;
	let switchedFor: string | null | undefined = undefined;
	$: if (region?.id !== switchedFor) {
		switchedFor = region?.id;
		switchedRegion = null;
	}
	$: activeRegion = switchedRegion ?? region;

	async function selectRegion(r: ContextRegion) {
		if (r.id === region?.id) switchedRegion = null;
		else switchedRegion = (await fetchRegion(r.id)) ?? switchedRegion;
	}

	// Fetch data when the shown region changes
	$: if (!regionLoading) {
		loadData(activeRegion);
	}

	let loadToken = 0;
	async function loadData(target: Region | null) {
		dataLoading = true;
		const token = ++loadToken;
		try {
			const result = await fetchStorageData(target, 'month');
			if (token !== loadToken) return;
			sharedData = (result.by_period || []).filter(
				(d) => String(d.period) >= MONTHLY_START
			);
			sharedUpdateDate = result.update_date;
		} catch (e) {
			console.error('[storageExplorer] Error loading data:', e);
			sharedData = [];
			sharedUpdateDate = null;
		} finally {
			if (token === loadToken) dataLoading = false;
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
	<ChartSettings>
		{#if showViewSwitcher}
			<Switch views={switchViews} activeView={currentView} on:itemClick={handleViewSwitch} />
			<Switch views={switchMetrics} activeView={currentMetric} on:itemClick={handleMetricSwitch} />
		{/if}
		<!-- Row 2: region (drill down to any Kreis / Gemeinde) -->
		<div class="flex w-full flex-wrap items-center gap-x-4 gap-y-2 empty:hidden">
			<RegionDrilldown {region} activeId={activeRegion?.id ?? null} onSelect={selectRegion} />
		</div>
	</ChartSettings>

	<div class="chart-container">
		{#if currentView === 'yearly'}
			<YearlyBarView
				region={activeRegion}
				{regionLoading}
				{onChartData}
				data={sharedData}
				updateDate={sharedUpdateDate}
				{dataLoading}
				metricMode={currentMetric}
			/>
		{:else if currentView === 'cumulative'}
			<CumulativeAreaView
				region={activeRegion}
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
