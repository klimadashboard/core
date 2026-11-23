<!-- $lib/components/charts/custom/renewablesChart/index.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Switch from '$lib/components/Switch.svelte';
	import YearlyBarView from './YearlyBarView.svelte';
	import CumulativeLineView from './CumulativeLineView.svelte';
	import RegionDrilldown from '$lib/components/charts/RegionDrilldown.svelte';
	import { fetchRegion } from '$lib/utils/getRegion';
	import { RadioGroup } from '$lib/components/ui';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import type { ContextRegion } from '$lib/utils/regionContext';
	import { MAX_COMPARISONS } from './comparison';
	import {
		getAvailableViews,
		getViewLabels,
		getViewIcons,
		getMetricLabels,
		getMetricIcons,
		fetchData,
		fetchGoal,
		fetchPlanned,
		showsPlanned,
		type EnergyType,
		type ViewMode,
		type MetricMode,
		type RenewablesRawData,
		type RenewableGoal,
		type PlannedData
	} from './config';

	// Props from Card slot (passed through Custom/index.svelte)
	export let chart: any = {};
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export const v: Record<string, string> = {}; // Variables from Directus

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

	// Shared data state (fetched once, shared across views)
	let sharedData: RenewablesRawData[] = [];
	let sharedGoal: RenewableGoal | null = null;
	let sharedUpdateDate: string = '';
	let sharedGridOperatorCheckedRatio: number | null = null;
	let sharedPlanned: PlannedData | null = null;
	let dataLoading = true;
	let dataFetched = false;

	/**
	 * Configuration from Directus (chart.config)
	 *
	 * Expected config structure in Directus:
	 * {
	 *   "component": "renewablesChart",
	 *   "energy": "solar" | "wind" | "biomass" | "hydro",
	 *   "initialView": "yearly" | "cumulative" | "map",  // optional, defaults to "yearly"
	 *   "showViewSwitcher": true | false                  // optional, defaults to true
	 * }
	 */
	$: config = chart.config || {};

	// Extract configuration with defaults
	$: selectedEnergy = (config.energy as EnergyType) || 'solar';
	$: initialView = (config.initialView as ViewMode) || 'yearly';
	$: showViewSwitcher = config.showViewSwitcher !== false; // defaults to true
	// Units "In Planung": wind by default, others via config `showPlanned: true`
	$: withPlanned = showsPlanned(selectedEnergy, config);

	// State
	let currentView: ViewMode;
	let currentMetric: MetricMode = 'power';

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

	$: metricLabels = getMetricLabels();
	$: metricIcons = getMetricIcons();
	$: switchMetrics = (['power', 'units'] as MetricMode[]).map((metric) => ({
		key: metric,
		label: metricLabels[metric],
		icon: metricIcons[metric]
	}));

	// Reset to yearly view if current view is not available for selected energy
	$: if (currentView && !availableViews.includes(currentView)) {
		currentView = 'yearly';
	}


	// ------------------------------------------------------------------ drill-down
	// Region shown in the chart: the card's region, or a Kreis / Gemeinde inside it
	// picked in the RegionDrilldown
	let switchedRegion: Region | null = null;
	let switchedFor: string | null | undefined = undefined;
	$: if (region?.id !== switchedFor) {
		switchedFor = region?.id;
		switchedRegion = null;
	}
	$: activeRegion = switchedRegion ?? region;

	async function selectRegion(r: ContextRegion) {
		if (r.id === region?.id) {
			switchedRegion = null;
		} else {
			const next = await fetchRegion(r.id);
			if (next) switchedRegion = next;
		}
		// The region now shown is no comparison of itself
		comparisons = comparisons.filter((c) => c.id !== r.id);
	}

	function toggleComparison(r: ContextRegion) {
		if (comparisonIds.includes(r.id)) removeComparison(r.id);
		else addComparisons([r]);
	}

	// Fetch shared data when the shown region or energy changes
	$: if (!regionLoading && selectedEnergy) {
		loadSharedData(activeRegion);
	}

	let loadToken = 0;
	async function loadSharedData(target: Region | null) {
		// Reset on region/energy change
		dataLoading = true;
		dataFetched = false;
		const token = ++loadToken;

		try {
			const params = { energy: selectedEnergy };
			const [result, goalResult, plannedResult] = await Promise.all([
				fetchData(target, params),
				fetchGoal(target, params),
				withPlanned ? fetchPlanned(target, params) : null
			]);
			if (token !== loadToken) return;

			sharedData = result.data;
			sharedGoal = goalResult;
			sharedPlanned = plannedResult;
			sharedUpdateDate = result.updateDate;
			sharedGridOperatorCheckedRatio = result.gridOperatorCheckedRatio;
			dataFetched = true;
		} catch (e) {
			console.error('[renewablesExplorer] Error loading shared data:', e);
			sharedData = [];
			sharedGoal = null;
			sharedPlanned = null;
			sharedUpdateDate = '';
			sharedGridOperatorCheckedRatio = null;
		} finally {
			if (token === loadToken) dataLoading = false;
		}
	}

	// Handle view switch
	// ------------------------------------------------------------------ comparison
	// Chart-wide: the picker sits above all views, the lines show in "Kumulativ"
	let comparisons: ContextRegion[] = [];
	let selectedUnit: 'absolute' | 'perArea' = 'absolute';
	/** The user picked a unit themselves: don't switch to pro km² automatically */
	let unitTouched = false;
	let comparisonRegionId: string | null | undefined = undefined;

	$: if (region?.id !== comparisonRegionId) {
		comparisonRegionId = region?.id;
		comparisons = [];
		unitTouched = false;
		selectedUnit = 'absolute';
	}
	$: comparisonIds = comparisons.map((r) => r.id);
	$: showsComparison = currentView === 'cumulative';
	$: canCompare = availableViews.includes('cumulative');

	function addComparisons(list: ContextRegion[]) {
		const fresh = list.filter((r) => !comparisonIds.includes(r.id));
		comparisons = [...comparisons, ...fresh].slice(0, MAX_COMPARISONS);
		// Comparisons are lines: show them
		if (!showsComparison) currentView = 'cumulative';
		// Regions of different size only compare fairly per area (workshop: "Fläche verwenden")
		if (!unitTouched) selectedUnit = 'perArea';
	}

	function removeComparison(id: string) {
		comparisons = comparisons.filter((r) => r.id !== id);
	}

	function handleViewSwitch(event: CustomEvent) {
		currentView = event.detail.key ?? event.detail;
	}

	function handleMetricSwitch(event: CustomEvent) {
		currentMetric = event.detail.key ?? event.detail;
	}

</script>

<div class="renewables-chart">
	<ChartSettings>
		<!-- Row 1: view and metric (optional based on config) -->
		{#if showViewSwitcher && availableViews.length > 1}
			<Switch views={switchViews} activeView={currentView} on:itemClick={handleViewSwitch} />
			{#if currentView === 'yearly' || currentView === 'cumulative'}
				<Switch views={switchMetrics} activeView={currentMetric} on:itemClick={handleMetricSwitch} />
			{/if}
		{/if}
		<!-- Row 2: region (drill down to any Kreis / Gemeinde, ＋ adds a comparison line) and unit -->
		<div class="flex w-full flex-wrap items-center gap-x-4 gap-y-2 empty:hidden">
			<RegionDrilldown
				{region}
				activeId={activeRegion?.id ?? null}
				onSelect={selectRegion}
				compareIds={canCompare ? comparisonIds : []}
				onToggleCompare={canCompare ? toggleComparison : null}
				compareMax={MAX_COMPARISONS}
			/>
			{#if showsComparison && currentMetric === 'power'}
				<RadioGroup
					label="Einheit"
					hideLabel
					small
					bind:value={selectedUnit}
					options={[
						{ value: 'absolute', label: 'absolut' },
						{ value: 'perArea', label: 'pro km²' }
					]}
					on:change={() => (unitTouched = true)}
				/>
			{:else if !showsComparison && comparisons.length}
				<button
					type="button"
					class="cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium text-blue-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300"
					on:click={() => (currentView = 'cumulative')}
				>
					{comparisons.length === 1 ? 'Vergleich' : `${comparisons.length} Vergleiche`} in „Kumulativ“ anzeigen
				</button>
			{/if}
		</div>
	</ChartSettings>

	<!-- Chart Views -->
	<div class="chart-container">
		{#if currentView === 'yearly'}
			<YearlyBarView
				{selectedEnergy}
				region={activeRegion}
				{regionLoading}
				{onChartData}
				data={sharedData}
				goal={sharedGoal}
				planned={sharedPlanned}
				updateDate={sharedUpdateDate}
				gridOperatorCheckedRatio={sharedGridOperatorCheckedRatio}
				{dataLoading}
				metricMode={currentMetric}
			/>
		{:else if currentView === 'cumulative'}
			<CumulativeLineView
				{selectedEnergy}
				region={activeRegion}
				{regionLoading}
				{onChartData}
				{regions}
				data={sharedData}
				goal={sharedGoal}
				planned={sharedPlanned}
				updateDate={sharedUpdateDate}
				gridOperatorCheckedRatio={sharedGridOperatorCheckedRatio}
				{dataLoading}
				metricMode={currentMetric}
				{comparisons}
				{selectedUnit}
				onRemoveComparison={removeComparison}
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
