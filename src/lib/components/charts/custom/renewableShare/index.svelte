<!-- $lib/components/charts/custom/renewableShare/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Switch from '$lib/components/Switch.svelte';
	import BarView from './BarView.svelte';
	import {
		fetchData,
		fetchYearlyStats,
		processData,
		getViewLabels,
		type CategoryType,
		type RenewableShareRawData,
		type ProcessedDataPoint
	} from './config';

	// Props from Card slot (passed through Custom/index.svelte)
	export let chart: any = {};
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let v: Record<string, string> = {}; // Variables from Directus

	// Configuration from Directus (chart.config)
	$: config = chart.config || {};
	$: initialCategory = (config.initialCategory as CategoryType) || 'day';
	$: showViewSwitcher = config.showViewSwitcher !== false; // defaults to true

	// State
	let currentCategory: CategoryType;
	let sharedData: Map<CategoryType, RenewableShareRawData[]> = new Map();
	let sharedYearlyStats: RenewableShareRawData[] = [];
	let sharedUpdateDate: string = '';
	let dataLoading = true;
	let dataFetched = false;

	// Initialize currentCategory from config
	$: if (initialCategory && !dataFetched) {
		currentCategory = initialCategory;
	}

	// View switching setup
	const availableViews: CategoryType[] = ['day', 'month', 'year'];
	$: viewLabels = getViewLabels();

	$: switchViews = availableViews.map((view) => ({
		key: view,
		label: viewLabels[view]
	}));

	// Processed data for current category
	$: processedData = (() => {
		const raw = sharedData.get(currentCategory) || [];
		return processData(raw, currentCategory);
	})();

	// Fetch data when category changes
	$: if (currentCategory && !regionLoading) {
		loadData(currentCategory);
	}

	async function loadData(category: CategoryType) {
		// Skip if we already have this data cached
		if (sharedData.has(category) && dataFetched) {
			dataLoading = false;
			return;
		}

		dataLoading = true;

		try {
			// Fetch category data and yearly stats in parallel (on first load)
			const promises: Promise<any>[] = [fetchData(category)];

			// Only fetch yearly stats once
			if (sharedYearlyStats.length === 0) {
				promises.push(fetchYearlyStats());
			}

			const results = await Promise.all(promises);

			const { data, updateDate } = results[0];
			sharedData.set(category, data);
			sharedData = sharedData; // Trigger reactivity

			if (results[1]) {
				sharedYearlyStats = results[1];
			}

			if (updateDate) {
				sharedUpdateDate = updateDate;
			}

			dataFetched = true;
		} catch (e) {
			console.error('[renewableShare] Error loading data:', e);
			sharedData.set(category, []);
			sharedData = sharedData;
		} finally {
			dataLoading = false;
		}
	}

	// Handle view switch
	function handleViewSwitch(event: CustomEvent) {
		currentCategory = event.detail.key ?? event.detail;
	}

	// Summary stats from yearly data
	$: daysAt100 = sharedYearlyStats.filter((d) => d.value >= 100).length;
	$: avgShare =
		sharedYearlyStats.length > 0
			? Math.round(
					sharedYearlyStats.reduce((sum, d) => sum + d.value, 0) / sharedYearlyStats.length
				)
			: 0;
</script>

<div class="renewable-share-chart">
	<!-- Summary headline -->
	{#if !dataLoading && sharedYearlyStats.length > 0}
		<h2 class="text-2xl max-w-2xl">
			An <span class="underline underline-offset-2 decoration-green-500">{daysAt100} Tagen</span>
			im letzten Jahr wurde der gesamte Strombedarf komplett aus erneuerbaren Energien gedeckt.
		</h2>
		<p class="max-w-lg text-lg text-balance leading-snug mt-1">
			Bilanziell wurde die Netzlast in den letzten 365 Tagen zu <span
				class="underline underline-offset-2 decoration-green-500">{avgShare}%</span
			> von Erneuerbaren Energien abgedeckt.
		</p>
	{:else if dataLoading}
		<div class="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-4"></div>
	{/if}

	<!-- View Switcher -->
	{#if showViewSwitcher && availableViews.length > 1}
		<div class="my-4">
			<Switch views={switchViews} activeView={currentCategory} on:itemClick={handleViewSwitch} />
		</div>
	{/if}

	<!-- Chart View -->
	<div class="chart-container">
		<BarView
			data={processedData}
			category={currentCategory}
			yearlyStats={sharedYearlyStats}
			updateDate={sharedUpdateDate}
			{dataLoading}
			{onChartData}
		/>
	</div>
</div>

<style>
	.renewable-share-chart {
		width: 100%;
	}

	.chart-container {
		min-height: 280px;
	}
</style>
