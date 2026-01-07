<!-- $lib/components/charts/custom/mobilityModalSplitStreet/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { scaleLinear } from 'd3-scale';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import TransportIcons from './TransportIcons.svelte';
	import {
		fetchData,
		buildChartData,
		processYearData,
		calculateProjection,
		getHistoricYears,
		getLatestDataYear,
		categoryMeta,
		categoryColors,
		categoryOrder,
		sustainableCategories,
		goalConfig,
		type ModalSplitRawData
	} from './config';

	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Layout configuration
	const SMALL_BAR_HEIGHT = 20;
	const LARGE_BAR_HEIGHT = 80;
	const CONNECTOR_HEIGHT = 40;
	const BAR_GAP = 3;
	const LABEL_WIDTH = 140;

	// State
	let containerEl: HTMLElement;
	let width = 0;
	let ready = false;
	let loading = true;
	let error: string | null = null;
	// Initialize showHistoric from URL parameter
	let showHistoric = $page.url.searchParams.get('historic') === 'true';

	let rawData: ModalSplitRawData[] = [];
	let historicYears: number[] = [];
	let latestDataYear: number = 0;

	// Computed dimensions
	$: chartWidth = Math.max(0, width - LABEL_WIDTH);
	$: xScale = scaleLinear().domain([0, 100]).range([0, chartWidth]);

	// Get years to display based on checkbox
	$: displayYears = showHistoric ? historicYears.filter((y) => y < latestDataYear) : [];

	// Process data for current and goal years
	$: currentYearData = processYearData(rawData, latestDataYear);
	$: goalYearData = (() => {
		// For goal year, we only show joint values for sustainable (Umweltverbund) and motorized (MIV)
		return [
			{
				category: 'umweltverbund',
				value: goalConfig.targetSustainablePercent,
				x0: 0,
				x1: goalConfig.targetSustainablePercent
			},
			{
				category: 'motorized',
				value: 100 - goalConfig.targetSustainablePercent,
				x0: goalConfig.targetSustainablePercent,
				x1: 100
			}
		];
	})();

	// Calculate sustainable totals
	$: currentSustainableTotal = currentYearData
		.filter((s) => sustainableCategories.includes(s.category))
		.reduce((sum, s) => sum + s.value, 0);
	$: goalSustainableTotal = goalYearData
		.filter((s) => sustainableCategories.includes(s.category))
		.reduce((sum, s) => sum + s.value, 0);

	// Calculate connector polygon coordinates
	$: sustainableX0 = xScale(
		currentYearData
			.filter((s) => sustainableCategories.includes(s.category))
			.reduce((min, s) => Math.min(min, s.x0), 100)
	);
	$: sustainableX1 = xScale(
		currentYearData
			.filter((s) => sustainableCategories.includes(s.category))
			.reduce((max, s) => Math.max(max, s.x1), 0)
	);
	$: goalSustainableX1 = xScale(goalConfig.targetSustainablePercent);
	$: motorizedX0 = xScale(
		currentYearData
			.filter((s) => !sustainableCategories.includes(s.category))
			.reduce((min, s) => Math.min(min, s.x0), 100)
	);
	$: motorizedX1 = xScale(100);
	$: goalMotorizedX0 = xScale(goalConfig.targetSustainablePercent);

	// Calculate widths for summary lines
	$: umweltverbundWidth = xScale(currentSustainableTotal);

	// Load data
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			const result = await fetchData(region, { regionId: region?.id });
			rawData = result.data;
			historicYears = getHistoricYears(rawData);
			latestDataYear = getLatestDataYear(rawData);

			const chartData = buildChartData(rawData, result.updateDate, result.source, region);
			onChartData?.(chartData);
		} catch (e) {
			console.error('[ModalSplitStreet] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Resize observer
	onMount(() => {
		const measure = () => {
			if (containerEl) {
				const newWidth = containerEl.clientWidth;
				if (newWidth > 0) {
					width = newWidth;
					ready = true;
				}
			}
		};

		measure();
		requestAnimationFrame(measure);

		const ro = new ResizeObserver(measure);
		if (containerEl) ro.observe(containerEl);

		return () => ro.disconnect();
	});

	function formatPercent(value: number): string {
		return `${Math.round(value)}%`;
	}
</script>

<!-- Snippet: Small bar segments -->
{#snippet smallBarSegments(segments: ReturnType<typeof processYearData>)}
	{#each segments as segment}
		{@const segmentWidth = xScale(segment.value)}
		{@const segmentX = xScale(segment.x0)}
		{@const colors = categoryColors[segment.category]}
		<div
			class="absolute top-0 bottom-0"
			style="left: {segmentX}px; width: {segmentWidth}px; background: {colors.main};"
		>
			{#if segmentWidth > 25}
				<span
					class="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white/80"
				>
					{Math.round(segment.value)}
				</span>
			{/if}
		</div>
	{/each}
{/snippet}

<!-- Snippet: Large bar segments with icons -->
{#snippet largeBarSegments(segments: ReturnType<typeof processYearData>)}
	{#each segments as segment}
		{@const segmentWidth = xScale(segment.value)}
		{@const segmentX = xScale(segment.x0)}
		{@const colors = categoryColors[segment.category]}
		{@const meta = categoryMeta[segment.category]}
		<div
			class="absolute top-0 bottom-0"
			style="left: {segmentX}px; width: {segmentWidth}px; background: {colors.main};"
		>
			<div class="absolute top-1.5 left-2 flex flex-col text-white">
				{#if segmentWidth > 45}
					<span class="text-base font-bold leading-tight">{formatPercent(segment.value)}</span>
					{#if segmentWidth > 70}
						<span class="leading-tight">{meta.shortLabel}</span>
					{/if}
				{/if}
			</div>
			{#if segmentWidth > 35}
				<div class="absolute bottom-1.5 left-2 text-white opacity-80">
					<TransportIcons category={segment.category} size={20} />
				</div>
			{/if}
		</div>
	{/each}
{/snippet}

<!-- Snippet: Goal bar segments (joint values only) -->
{#snippet goalBarSegments(
	segments: Array<{ category: string; value: number; x0: number; x1: number }>
)}
	{#each segments as segment}
		{@const segmentWidth = xScale(segment.value)}
		{@const segmentX = xScale(segment.x0)}
		{@const bgColor = segment.category === 'umweltverbund' ? '#059669' : '#475569'}
		{@const label =
			segment.category === 'umweltverbund' ? 'Umweltverbund' : 'Motorisierter Individualverkehr'}
		<div
			class="absolute top-0 bottom-0"
			style="left: {segmentX}px; width: {segmentWidth}px; background: {bgColor};"
		>
			<div class="absolute top-1.5 left-2 flex flex-col text-white">
				{#if segmentWidth > 45}
					<span class="text-base font-bold leading-tight">{formatPercent(segment.value)}</span>
					{#if segmentWidth > 120}
						<span class="leading-tight">{label}</span>
					{/if}
				{/if}
			</div>
		</div>
	{/each}
{/snippet}

<!-- Snippet: Legend group -->
{#snippet legendGroup(title: string, categories: string[])}
	<div class="flex items-center gap-3">
		<span class="font-medium text-gray-500 dark:text-gray-400">{title}:</span>
		{#each categories as cat}
			<div class="flex items-center gap-1.5">
				<span class="w-3 h-3 rounded-sm" style="background: {categoryColors[cat].main};"></span>
				<span class="text-gray-600 dark:text-gray-400">{categoryMeta[cat].label}</span>
			</div>
		{/each}
	</div>
{/snippet}

<div bind:this={containerEl} class="modal-split-street relative w-full select-none">
	{#if loading || regionLoading}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-64 flex items-center justify-center text-red-500">{error}</div>
	{:else if !ready || width === 0}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else}
		<!-- Historic toggle checkbox -->
		<label
			class="flex items-center gap-2 mb-4 cursor-pointer text-sm text-gray-600 dark:text-gray-400"
		>
			<input
				type="checkbox"
				bind:checked={showHistoric}
				class="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
			/>
			<span>Zeige historische Entwicklung</span>
		</label>

		<div class="flex flex-col">
			<!-- Historic years (small bars) -->
			{#if showHistoric}
				{#each displayYears as year}
					{@const segments = processYearData(rawData, year)}
					<div class="flex items-center my-0.5" style="height: {SMALL_BAR_HEIGHT}px;">
						<div
							class="flex-shrink-0 flex items-center justify-end pr-3 text-xs text-gray-400"
							style="width: {LABEL_WIDTH}px;"
						>
							{year}
						</div>
						<div
							class="flex-1 relative rounded overflow-hidden bg-gray-200 dark:bg-gray-700"
							style="height: {SMALL_BAR_HEIGHT}px;"
						>
							{@render smallBarSegments(segments)}
						</div>
					</div>
				{/each}
			{/if}

			<!-- Current year (LARGE bar) with Umweltverbund indicator -->
			<div class="flex flex-col">
				<!-- Umweltverbund indicator -->
				<div class="flex items-end mb-1">
					<div class="flex-shrink-0" style="width: {LABEL_WIDTH}px;"></div>
					<div class="flex flex-col items-start text-[#059669]">
						<span class="text-sm font-medium mb-0.5">
							{formatPercent(currentSustainableTotal)} Umweltverbund
						</span>
						<svg width={umweltverbundWidth} height="12" class="overflow-visible stroke-current">
							<line x1="0" y1="0" x2="0" y2="8" stroke-width="2" />
							<line x1="0" y1="8" x2={umweltverbundWidth} y2="8" stroke-width="2" />
							<line
								x1={umweltverbundWidth}
								y1="8"
								x2={umweltverbundWidth}
								y2="0"
								stroke-width="2"
							/>
						</svg>
					</div>
				</div>

				<!-- Current year bar -->
				<div class="flex items-stretch" style="height: {LARGE_BAR_HEIGHT}px;">
					<div
						class="flex-shrink-0 flex flex-col justify-center pr-4 opacity-70"
						style="width: {LABEL_WIDTH}px;"
					>
						<span class="text-xl font-bold">{latestDataYear}</span>
						<span class="text-sm">Modal Split aktuell</span>
					</div>
					<div class="flex-1 relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
						{@render largeBarSegments(currentYearData)}
					</div>
				</div>
			</div>

			<!-- Connector polygons -->
			<div class="relative flex" style="height: {CONNECTOR_HEIGHT}px;">
				<div class="flex-shrink-0" style="width: {LABEL_WIDTH}px;"></div>
				<svg
					class="flex-1 rounded-lg overflow-hidden"
					style="width: {chartWidth}px; height: {CONNECTOR_HEIGHT}px;"
				>
					<!-- Sustainable categories -> Umweltverbund -->
					<polygon
						points="{sustainableX0},0 {sustainableX1},0 {goalSustainableX1},{CONNECTOR_HEIGHT} 0,{CONNECTOR_HEIGHT}"
						fill="#059669"
						opacity="0.25"
					/>

					<!-- Motorized categories -> MIV -->
					<polygon
						points="{motorizedX0},0 {motorizedX1},0 {chartWidth},{CONNECTOR_HEIGHT} {goalMotorizedX0},{CONNECTOR_HEIGHT}"
						fill="#475569"
						opacity="0.25"
					/>
				</svg>
			</div>

			<!-- Goal year (LARGE bar) -->
			<div class="flex items-stretch" style="height: {LARGE_BAR_HEIGHT}px;">
				<div
					class="flex-shrink-0 flex flex-col justify-center pr-4 text-[#059669]"
					style="width: {LABEL_WIDTH}px;"
				>
					<span class="text-xl font-bold">{goalConfig.endYear}</span>
					<span class="text-sm">Zielsetzung</span>
				</div>
				<div class="flex-1 relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
					{@render goalBarSegments(goalYearData)}
				</div>
			</div>
		</div>

		<!-- Legend -->
		<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
			{@render legendGroup(
				'Umweltverbund',
				categoryOrder.filter((c) => sustainableCategories.includes(c))
			)}
			{@render legendGroup(
				'Motorisiert',
				categoryOrder.filter((c) => !sustainableCategories.includes(c))
			)}
		</div>
	{/if}
</div>
