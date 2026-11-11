<!-- $lib/components/charts/custom/modalSplit/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { scaleLinear } from 'd3-scale';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import TransportIcons from './TransportIcons.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import { RadioGroup } from '$lib/components/ui';
	import RegionSwitcher from '$lib/components/charts/RegionSwitcher.svelte';
	import { t } from '$lib/utils/t';
	import {
		fetchData,
		fetchGoal,
		resolveGoalConfig,
		buildChartData,
		processYearData,
		calculateProjection,
		getHistoricYears,
		getLatestDataYear,
		getCategoryMeta,
		categoryColors,
		categoryOrder,
		sustainableCategories,
		filterByType,
		getTypeLabel,
		getSourceInfo,
		DEFAULT_TYPE,
		type ModalSplitRawData,
		type ModalSplitGoal,
		type ResolvedGoalConfig
	} from './config';

	// Get categoryMeta reactively based on page translations
	$: categoryMeta = getCategoryMeta(page.data.translations);

	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Layout configuration
	const SMALL_BAR_HEIGHT = 20;
	const LARGE_BAR_HEIGHT = 80;
	const CONNECTOR_HEIGHT = 40;
	const BAR_GAP = 3;
	const LABEL_WIDTH_MAX = 140;
	const LABEL_WIDTH_MIN = 70;

	// State
	let containerEl: HTMLElement;
	let width = 0;
	let ready = false;
	let loading = true;
	let error: string | null = null;
	// Initialize showHistoric from URL parameter
	let showHistoric = page.url.searchParams.get('historic') === 'true';

	// Measurement basis (trips / passenger_km); ?type= preselects it in embeds
	let selectedType = page.url.searchParams.get('type') || DEFAULT_TYPE;
	let availableTypes: string[] = [];
	let allData: ModalSplitRawData[] = [];
	let goal: ModalSplitGoal | null = null;

	let rawData: ModalSplitRawData[] = [];
	let historicYears: number[] = [];
	let latestDataYear: number = 0;
	let goalConfig: ResolvedGoalConfig | null = null;
	let matchedRegionName: string | null = null;
	let matchedRegionLayerLabel: string | null = null;
	let usedFallback: boolean = false;

	// Computed dimensions - label width scales with container
	$: labelWidth = width < 500 ? LABEL_WIDTH_MIN : LABEL_WIDTH_MAX;
	$: chartWidth = Math.max(0, width - labelWidth);
	$: xScale = scaleLinear().domain([0, 100]).range([0, chartWidth]);

	// Compare mode: previous vs latest survey as two connected large bars (2+ years, no goal)
	$: compareMode = historicYears.length >= 2 && !goalConfig;
	$: previousYear = compareMode ? historicYears[historicYears.length - 2] : null;
	$: previousYearData = previousYear ? processYearData(rawData, previousYear) : [];
	$: previousSustainableTotal = previousYearData
		.filter((s) => sustainableCategories.includes(s.category))
		.reduce((sum, s) => sum + s.value, 0);

	// Small bars for the years before the first large bar (checkbox)
	$: olderYears = historicYears.filter((y) => y < (previousYear ?? latestDataYear));
	$: displayYears = showHistoric ? olderYears : [];

	// Process data for current and goal years
	$: currentYearData = processYearData(rawData, latestDataYear);
	$: goalYearData = (() => {
		if (!goalConfig) return [];
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

	// Get categories that exist in the data (for legend filtering)
	$: categoriesInData = new Set(rawData.map((d) => d.category));

	type Span = [number, number];
	/** Horizontal span (px) of the sustainable or the motorized segments of a bar, for the connectors */
	function groupSpan(segments: ReturnType<typeof processYearData>, sustainable: boolean): Span {
		const group = segments.filter((s) => sustainableCategories.includes(s.category) === sustainable);
		if (!group.length) return [0, 0];
		return [xScale(Math.min(...group.map((s) => s.x0))), xScale(Math.max(...group.map((s) => s.x1)))];
	}
	$: goalX = xScale(goalConfig?.targetSustainablePercent ?? 0);

	// Store metadata for rebuilding chartData when showHistoric changes
	let updateDate: string = '';
	let source: string = '';

	// Region shown in the chart: the card's region, or one picked in the RegionSwitcher
	let switchedRegion: Region | null = null;
	let switcherId: string | null = null;
	let switcherFor: string | null = null;
	$: if (region?.id !== switcherFor) {
		switcherFor = region?.id ?? null;
		switchedRegion = null;
		switcherId = region?.id ?? null;
	}
	$: activeRegion = switchedRegion ?? region;

	// Build region candidates: current region + parents
	// IMPORTANT: This must be declared BEFORE the loadData reactive statement
	$: regionCandidates = (() => {
		const candidates: string[] = [];
		if (activeRegion?.id) {
			candidates.push(activeRegion.id);
		}
		// Add parents in order (closest first)
		if (activeRegion?.parents && Array.isArray(activeRegion.parents)) {
			for (const parent of activeRegion.parents) {
				if (parent.id) {
					candidates.push(parent.id);
				}
			}
		}
		return candidates;
	})();

	// Load data when region is ready
	// IMPORTANT: Must be after regionCandidates is declared
	$: if (!regionLoading && activeRegion) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			// Fetch data with region candidates (supports parent fallback)
			const result = await fetchData(activeRegion, {
				regionId: activeRegion?.id,
				regionCandidates,
				type: selectedType
			});

			allData = result.allData;
			availableTypes = result.availableTypes;
			selectedType = result.type;
			matchedRegionName = result.matchedRegionName;
			matchedRegionLayerLabel = result.matchedRegionLayerLabel;
			usedFallback = result.usedFallback;

			// Fetch goal for the matched region (not the original region) if fallback was used
			const goalRegionId = result.matchedRegionId || activeRegion?.id;
			goal = goalRegionId
				? await fetchGoal(
						usedFallback && result.matchedRegionId
							? ({ id: result.matchedRegionId, name: result.matchedRegionName } as any)
							: activeRegion
					)
				: null;

			applyType(allData, selectedType, goal);

			const chartData = buildChartData(
				rawData,
				updateDate,
				source,
				activeRegion,
				showHistoric,
				page.data.translations,
				goalConfig,
				matchedRegionName,
				matchedRegionLayerLabel,
				allData
			);
			onChartData?.(chartData);
		} catch (e) {
			console.error('[ModalSplitStreet] Error:', e);
			error = e instanceof Error ? e.message : t(page.data.translations, 'status.error');
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	/** Show the rows of one measurement basis; goals are shares of trips, so only shown for those */
	function applyType(all: ModalSplitRawData[], type: string, g: ModalSplitGoal | null) {
		rawData = filterByType(all, type);
		historicYears = getHistoricYears(rawData);
		latestDataYear = getLatestDataYear(rawData);
		({ source, updateDate } = getSourceInfo(rawData));
		// Resolve goal config (derives startYear from data)
		goalConfig = type === DEFAULT_TYPE ? resolveGoalConfig(g, rawData) : null;
	}

	$: if (!loading && allData.length > 0) applyType(allData, selectedType, goal);

	$: typeOptions = availableTypes.map((type) => ({
		value: type,
		label: getTypeLabel(type, page.data.translations)
	}));

	// Update chartData when showHistoric or the type changes (for embed modal to reflect current state)
	$: if (rawData.length > 0 && !loading) {
		const chartData = buildChartData(
			rawData,
			updateDate,
			source,
			activeRegion,
			showHistoric,
			page.data.translations,
			goalConfig,
			matchedRegionName,
			matchedRegionLayerLabel,
			allData
		);
		onChartData?.(chartData);
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

	// Merge bicycle + e_bike into one segment for the large bar (same color, combined value is more readable)
	function mergeSegmentsForLargeBar(
		segments: ReturnType<typeof processYearData>
	): Array<{ category: string; value: number; x0: number; x1: number; merged?: boolean }> {
		const result: Array<{
			category: string;
			value: number;
			x0: number;
			x1: number;
			merged?: boolean;
		}> = [];
		let i = 0;
		while (i < segments.length) {
			const seg = segments[i];
			const next = segments[i + 1];
			if (seg.category === 'bicycle' && next?.category === 'e_bike') {
				result.push({ category: 'bicycle', value: seg.value + next.value, x0: seg.x0, x1: next.x1, merged: true });
				i += 2;
			} else {
				result.push(seg);
				i++;
			}
		}
		return result;
	}

	// Hover state for tooltip
	let hoveredYear: number | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	function handleBarMouseMove(e: MouseEvent, year: number) {
		hoveredYear = year;
		hoverClientX = e.clientX;
		hoverClientY = e.clientY;
	}

	function handleBarMouseLeave() {
		hoveredYear = null;
	}

	// Tooltip data
	$: tooltipData = (() => {
		if (hoveredYear === null) return null;

		// Handle goal year separately
		if (goalConfig && hoveredYear === goalConfig.endYear) {
			const items = goalYearData.map((s) => ({
				label:
					s.category === 'umweltverbund'
						? t(page.data.translations, 'domain.transport.sustainable')
						: t(page.data.translations, 'domain.transport.motorized'),
				value: `${(typeof s.value === 'number' ? s.value : Number(s.value) || 0).toFixed(1)}%`,
				color: s.category === 'umweltverbund' ? '#059669' : '#475569'
			}));

			return {
				title: `${hoveredYear} (${t(page.data.translations, 'ui.renewable.requiredForGoal')})`,
				items
			};
		}

		// Regular historic/current year data
		const segments = processYearData(rawData, hoveredYear);
		if (segments.length === 0) return null;

		const items = segments.map((s) => ({
			label: categoryMeta[s.category]?.label || s.category,
			value: `${(typeof s.value === 'number' ? s.value : Number(s.value) || 0).toFixed(1)}%`,
			color: categoryColors[s.category]?.main || '#6b7280'
		}));

		return {
			title: `${hoveredYear} · ${getTypeLabel(selectedType, page.data.translations)}`,
			items
		};
	})();
</script>

<!-- Snippet: Small bar segments -->
{#snippet smallBarSegments(segments: ReturnType<typeof processYearData>, year: number)}
	{#each segments as segment}
		{@const segmentWidth = xScale(segment.value)}
		{@const segmentX = xScale(segment.x0)}
		{@const colors = categoryColors[segment.category]}
		<div
			class="absolute top-0 bottom-0 cursor-pointer"
			style="left: {segmentX}px; width: {segmentWidth}px; background: {colors.main};"
			on:mouseenter={(e) => handleBarMouseMove(e, year)}
			on:mousemove={(e) => {
				hoverClientX = e.clientX;
				hoverClientY = e.clientY;
			}}
			on:mouseleave={handleBarMouseLeave}
			role="presentation"
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
{#snippet largeBarSegments(segments: ReturnType<typeof mergeSegmentsForLargeBar>, year: number)}
	{#each segments as segment}
		{@const segmentWidth = xScale(segment.value)}
		{@const segmentX = xScale(segment.x0)}
		{@const colors = categoryColors[segment.category]}
		{@const meta = categoryMeta[segment.category]}
		<div
			class="absolute top-0 bottom-0 cursor-pointer"
			style="left: {segmentX}px; width: {segmentWidth}px; background: {colors.main};"
			on:mouseenter={(e) => handleBarMouseMove(e, year)}
			on:mousemove={(e) => {
				hoverClientX = e.clientX;
				hoverClientY = e.clientY;
			}}
			on:mouseleave={handleBarMouseLeave}
			role="presentation"
		>
			<div class="absolute top-1.5 left-2 flex flex-col text-white">
				{#if segmentWidth > 45}
					<span class="text-base font-bold leading-tight">{formatPercent(segment.value)}</span>
					{#if segmentWidth > 70}
						<span class="leading-tight">{meta.shortLabel}</span>
					{/if}
				{/if}
			</div>
			{#if segmentWidth > 14}
				{@const iconSize = segmentWidth > 35 ? 20 : 14}
				<div class="absolute bottom-1.5 text-white opacity-80" style="left: {Math.min(8, (segmentWidth - iconSize) / 2)}px;">
					<TransportIcons category={segment.category} size={iconSize} />
				</div>
			{/if}
		</div>
	{/each}
{/snippet}

<!-- Snippet: Goal bar segments (joint values only) -->
{#snippet goalBarSegments(
	segments: Array<{ category: string; value: number; x0: number; x1: number }>,
	year: number
)}
	{#each segments as segment}
		{@const segmentWidth = xScale(segment.value)}
		{@const segmentX = xScale(segment.x0)}
		{@const bgColor = segment.category === 'umweltverbund' ? '#059669' : '#475569'}
		{@const label =
			segment.category === 'umweltverbund'
				? t(page.data.translations, 'domain.transport.sustainable')
				: t(page.data.translations, 'domain.transport.motorized')}
		<div
			class="absolute top-0 bottom-0 cursor-pointer"
			style="left: {segmentX}px; width: {segmentWidth}px; background: {bgColor};"
			on:mouseenter={(e) => handleBarMouseMove(e, year)}
			on:mousemove={(e) => {
				hoverClientX = e.clientX;
				hoverClientY = e.clientY;
			}}
			on:mouseleave={handleBarMouseLeave}
			role="presentation"
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

<!-- Snippet: Umweltverbund bracket over (or, below=true, under) a large bar -->
{#snippet umweltverbundIndicator(total: number, below: boolean = false)}
	{@const w = xScale(total)}
	<div class="flex {below ? 'items-start mt-1' : 'items-end mb-1'}">
		<div class="flex-shrink-0" style="width: {labelWidth}px;"></div>
		<div class="flex {below ? 'flex-col-reverse' : 'flex-col'} items-start text-[#059669]">
			<span class="text-sm font-medium {below ? 'mt-0.5' : 'mb-0.5'}">
				{formatPercent(total)}
				{t(page.data.translations, 'domain.transport.sustainable')}
			</span>
			<svg width={w} height="12" class="overflow-visible stroke-current {below ? '-scale-y-100' : ''}">
				<line x1="0" y1="0" x2="0" y2="8" stroke-width="2" />
				<line x1="0" y1="0" x2={w} y2="0" stroke-width="2" />
				<line x1={w} y1="8" x2={w} y2="0" stroke-width="2" />
			</svg>
		</div>
	</div>
{/snippet}

<!-- Snippet: Large bar of a survey year -->
{#snippet yearBar(year: number, label: string, segments: ReturnType<typeof processYearData>)}
	<div class="flex items-stretch" style="height: {LARGE_BAR_HEIGHT}px;">
		<div class="flex-shrink-0 flex flex-col justify-center pr-4 opacity-70" style="width: {labelWidth}px;">
			<span class="text-xl font-bold">{year}</span>
			<span class="text-sm">{label}</span>
		</div>
		<div class="flex-1 relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
			{@render largeBarSegments(mergeSegmentsForLargeBar(segments), year)}
		</div>
	</div>
{/snippet}

<!-- Snippet: Connector polygons from the sustainable/motorized spans of one bar to the next -->
{#snippet connector(fromSustainable: Span, fromMotorized: Span, toSustainable: Span, toMotorized: Span)}
	<div class="relative flex" style="height: {CONNECTOR_HEIGHT}px;">
		<div class="flex-shrink-0" style="width: {labelWidth}px;"></div>
		<svg class="flex-1 rounded-lg overflow-hidden" style="width: {chartWidth}px; height: {CONNECTOR_HEIGHT}px;">
			<polygon
				points="{fromSustainable[0]},0 {fromSustainable[1]},0 {toSustainable[1]},{CONNECTOR_HEIGHT} {toSustainable[0]},{CONNECTOR_HEIGHT}"
				fill="#059669"
				opacity="0.25"
			/>
			<polygon
				points="{fromMotorized[0]},0 {fromMotorized[1]},0 {toMotorized[1]},{CONNECTOR_HEIGHT} {toMotorized[0]},{CONNECTOR_HEIGHT}"
				fill="#475569"
				opacity="0.25"
			/>
		</svg>
	</div>
{/snippet}

<!-- Snippet: Legend group -->
{#snippet legendGroup(title: string, categories: string[])}
	<div class="flex items-center gap-3">
		<span class="font-bold text-gray-700 dark:text-gray-300">{title}:</span>
		{#each categories as cat}
			<div class="flex items-center gap-1.5">
				<span class="shrink-0" style="color: {categoryColors[cat].main};" aria-hidden="true">
					<TransportIcons category={cat} size={16} />
				</span>
				<span class="text-gray-600 dark:text-gray-400">{categoryMeta[cat].label}</span>
			</div>
		{/each}
	</div>
{/snippet}

<div bind:this={containerEl} class="modal-split-street relative w-full select-none">
	<!-- Spatial level (only in the context of an aggregate region); outside the loading state so focus stays -->
	{#if !regionLoading && region}
		<div class="mb-4">
			<RegionSwitcher
				{region}
				bind:selectedId={switcherId}
				on:change={(e) => (switchedRegion = e.detail.id === region?.id ? null : e.detail)}
			/>
		</div>
	{/if}

	{#if loading || regionLoading}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-64 flex items-center justify-center text-red-500">{error}</div>
	{:else if !rawData.length}
		<div class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
			{t(page.data.translations, 'status.noDataForRegion')}
		</div>
	{:else if !ready || width === 0}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else}
		<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 mb-4">
			<!-- Historic toggle checkbox (only when historical data exists) -->
			{#if olderYears.length > 0}
				<label
					class="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400"
				>
					<input
						type="checkbox"
						bind:checked={showHistoric}
						class="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
					/>
					<span>{t(page.data.translations, 'ui.renewable.showHistoric')}</span>
				</label>
			{/if}

			<!-- Measurement basis: switch only when the region has more than one -->
			{#if availableTypes.length > 1}
				<RadioGroup
					label={t(page.data.translations, 'domain.transport.modalSplitBasis')}
					bind:value={selectedType}
					options={typeOptions}
					hideLabel
				/>
			{:else}
				<span class="text-sm text-gray-500 dark:text-gray-400">
					{getTypeLabel(selectedType, page.data.translations)}
				</span>
			{/if}
		</div>

		<div class="flex flex-col">
			<!-- Historic years (small bars) -->
			{#if showHistoric}
				<div class="mb-4">
					{#each displayYears as year}
						{@const segments = processYearData(rawData, year)}
						<div class="flex items-center my-0.5" style="height: {SMALL_BAR_HEIGHT}px;">
							<div
								class="flex-shrink-0 flex items-center justify-end pr-3 text-xs text-gray-400"
								style="width: {labelWidth}px;"
							>
								{year}
							</div>
							<div
								class="flex-1 relative rounded overflow-hidden bg-gray-200 dark:bg-gray-700"
								style="height: {SMALL_BAR_HEIGHT}px;"
							>
								{@render smallBarSegments(segments, year)}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if previousYear}
				<!-- Compare mode: previous survey on top, latest below -->
				{@render umweltverbundIndicator(previousSustainableTotal)}
				{@render yearBar(previousYear, 'Modal Split', previousYearData)}
				{@render connector(
					groupSpan(previousYearData, true),
					groupSpan(previousYearData, false),
					groupSpan(currentYearData, true),
					groupSpan(currentYearData, false)
				)}
				{@render yearBar(latestDataYear, 'Modal Split aktuell', currentYearData)}
				{@render umweltverbundIndicator(currentSustainableTotal, true)}
			{:else}
				{@render umweltverbundIndicator(currentSustainableTotal)}
				{@render yearBar(latestDataYear, 'Modal Split aktuell', currentYearData)}
			{/if}

			{#if goalConfig}
				{@render connector(
					groupSpan(currentYearData, true),
					groupSpan(currentYearData, false),
					[0, goalX],
					[goalX, chartWidth]
				)}

				<!-- Goal year (LARGE bar) -->
				<div class="flex items-stretch" style="height: {LARGE_BAR_HEIGHT}px;">
					<div
						class="flex-shrink-0 flex flex-col justify-center pr-4 text-[#059669]"
						style="width: {labelWidth}px;"
					>
						<span class="text-xl font-bold">{goalConfig.endYear}</span>
						<span class="text-sm">Zielsetzung</span>
					</div>
					<div class="flex-1 relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
						{@render goalBarSegments(goalYearData, goalConfig.endYear)}
					</div>
				</div>
			{/if}
		</div>

		<!-- Legend -->
		<div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
			{@render legendGroup(
				t(page.data.translations, 'domain.transport.sustainable'),
				categoryOrder.filter((c) => sustainableCategories.includes(c) && categoriesInData.has(c))
			)}
			{@render legendGroup(
				t(page.data.translations, 'domain.transport.motorized'),
				categoryOrder.filter((c) => !sustainableCategories.includes(c) && categoriesInData.has(c))
			)}
		</div>

		<!-- Tooltip -->
		{#if tooltipData}
			<Tooltip
				visible={true}
				x={hoverClientX}
				y={hoverClientY}
				title={tooltipData.title}
				items={tooltipData.items}
				container={containerEl}
			/>
		{/if}
	{/if}
</div>
