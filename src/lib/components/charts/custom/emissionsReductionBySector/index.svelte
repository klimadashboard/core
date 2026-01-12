<!-- $lib/components/charts/custom/emissionsReductionProgress/index.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import type { ChartData } from '$lib/components/charts/types';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import {
		fetchEmissionsData,
		calculateSectorProgress,
		buildChartData,
		getLayerPriority,
		shouldUseMegatons,
		TARGET_REDUCTION_PERCENT,
		TARGET_YEAR,
		type RegionResult,
		type SectorProgress,
		type ReductionSummary
	} from './config';

	// Props from Card slot
	export let region: any = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// State
	let containerEl: HTMLElement;
	let width = 0;

	let views: { key: string; label: string }[] = [];
	let activeLayer: string | null = null;
	let results: RegionResult[] = [];
	let loading = true;
	let dataFetched = false;

	// Processed data
	let sectorProgress: SectorProgress[] = [];
	let summaryStats: ReductionSummary | null = null;
	let hasNegativeProgress = false;

	// Hover state
	let hoveredSector: string | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	// Layout
	const trackHeight = 24;
	const arrowSize = 10;

	// Region candidates: prioritize region prop (from Card/RegionProvider, which handles URL params),
	// fall back to page context
	$: regionFromProp = region?.id;
	$: regionParentsFromProp = region?.parents?.map((p: any) => p.id) || [];
	$: currentId = regionFromProp || page.data?.page?.id;
	$: parentIds = regionFromProp
		? regionParentsFromProp
		: page.data?.page?.parents?.map((p: any) => p.id) || [];
	$: regionCandidates = [currentId, ...parentIds].filter(Boolean);

	// Fetch data when region candidates are available and region is done loading
	$: if (regionCandidates.length > 0 && !dataFetched && !regionLoading) {
		dataFetched = true;
		loadData();
	}

	async function loadData() {
		loading = true;
		try {
			const { results: fetchedResults } = await fetchEmissionsData(regionCandidates);
			results = fetchedResults;

			views = results
				.map((r) => ({ key: r.key, label: r.label, priority: getLayerPriority(r.layer_label) }))
				.sort((a, b) => a.priority - b.priority)
				.map(({ key, label }) => ({ key, label }));

			activeLayer = filteredViews[0]?.key ?? views[0]?.key ?? null;

			updateChartData();
		} catch (error) {
			console.error('Error fetching emissions data:', error);
			results = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	function updateChartData() {
		const selectedRegion = results.find((r) => r.key === activeLayer);
		if (!selectedRegion) {
			sectorProgress = [];
			summaryStats = null;
			hasNegativeProgress = false;
			onChartData?.(null);
			return;
		}

		// Determine if we should display in megatons based on data magnitude
		const useMegatons = shouldUseMegatons(selectedRegion.data);

		const {
			sectors,
			summary,
			hasNegativeProgress: hasNeg
		} = calculateSectorProgress(selectedRegion, useMegatons);
		sectorProgress = sectors;
		summaryStats = summary;
		hasNegativeProgress = hasNeg;

		if (onChartData) {
			// Get source from actual data
			const dataSource =
				selectedRegion.data.find((d) => d.source !== 'climate-target')?.source || 'Emissions data';
			const chartData = buildChartData(selectedRegion, sectors, summary, useMegatons, dataSource);
			onChartData(chartData);
		}
	}

	// Filter views
	$: filteredViews = views;

	// Auto-select view
	$: if (
		filteredViews.length > 0 &&
		(!activeLayer || !filteredViews.find((v) => v.key === activeLayer))
	) {
		activeLayer = filteredViews[0]?.key ?? null;
	}

	// Update chart data when selection changes
	$: if (activeLayer && results.length > 0) {
		updateChartData();
	}

	// Current selected region
	$: selectedRegion = results.find((r) => r.key === activeLayer) || null;

	// Determine if we should display in megatons based on data magnitude
	$: useMegatons = selectedRegion ? shouldUseMegatons(selectedRegion.data) : false;

	// Track dimensions
	$: trackWidth = Math.max(0, width - 180);

	// Unit
	$: unit = useMegatons ? 'Mt CO₂eq' : 't CO₂eq';

	// Data source (from actual data)
	$: dataSource = selectedRegion?.data.find((d) => d.source !== 'climate-target')?.source || null;

	// Tooltip data
	$: tooltipData = (() => {
		if (hoveredSector === null || !summaryStats) return null;
		const sector = sectorProgress.find((s) => s.sector === hoveredSector);
		if (!sector) return null;

		return {
			title: sector.label,
			items: [
				{
					label: `${summaryStats.firstYear}`,
					value: `${formatNumber(sector.firstYearValue)} ${unit}`,
					color: sector.color
				},
				{
					label: `${summaryStats.lastYear}`,
					value: `${formatNumber(sector.lastYearValue)} ${unit}`,
					color: sector.color
				},
				{
					label: 'Reduktion',
					value: `${sector.reduction >= 0 ? '-' : '+'}${formatNumber(Math.abs(sector.reduction))} ${unit} (${sector.reductionPercent >= 0 ? '-' : '+'}${formatNumber(Math.abs(sector.reductionPercent), 1)}%)`,
					color: sector.reduction >= 0 ? '#22c55e' : '#ef4444'
				},
				{
					label: `Fortschritt zum ${TARGET_REDUCTION_PERCENT}%-Ziel`,
					value: `${formatNumber(sector.contributionPercent, 1)}%`,
					color: sector.contributionPercent >= 0 ? '#22c55e' : '#ef4444'
				}
			]
		};
	})();

	// Mouse handlers
	function handleMouseEnter(e: MouseEvent, sector: string) {
		hoveredSector = sector;
		hoverClientX = e.clientX;
		hoverClientY = e.clientY;
	}

	function handleMouseMove(e: MouseEvent) {
		hoverClientX = e.clientX;
		hoverClientY = e.clientY;
	}

	function handleMouseLeave() {
		hoveredSector = null;
	}

	// Resize observer
	let ro: ResizeObserver | null = null;

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const newWidth = entry.contentRect.width;
				if (newWidth > 0) width = newWidth;
			}
		});
		return () => ro?.disconnect();
	});

	$: if (containerEl && ro) ro.observe(containerEl);
</script>

{#if loading || regionLoading}
	<p class="text-sm text-gray-500">Lade Emissionsdaten…</p>
{:else if results.length === 0 || sectorProgress.length === 0}
	<p class="text-sm text-gray-500">Keine Reduktionsdaten für diese Region verfügbar.</p>
{:else if selectedRegion && summaryStats}
	<!-- Layer switch -->
	{#if filteredViews.length > 1}
		<div class="mb-4">
			<Switch
				views={filteredViews}
				activeView={activeLayer}
				on:itemClick={(e) => (activeLayer = e.detail)}
			/>
		</div>
	{/if}

	<!-- Summary -->
	<p class="text-xl max-w-xl mb-6">
		<strong>{selectedRegion.name}</strong> hat zwischen {summaryStats.firstYear} und {summaryStats.lastYear}
		insgesamt <strong>{formatNumber(summaryStats.totalReductionAchieved)} {unit}</strong> eingespart
		– das sind <strong>{Math.round(summaryStats.overallProgress)}%</strong> des Weges
		{#if summaryStats.targetYear}
			zum Ziel {summaryStats.targetYear}{summaryStats.targetValue === 0
				? ' (Klimaneutralität)'
				: ''}.
		{:else}
			zur Klimaneutralität.
		{/if}
	</p>

	<!-- Progress tracks -->
	<div bind:this={containerEl} class="relative select-none w-full">
		{#if width > 0}
			{@const scaleLabelZeroX = hasNegativeProgress ? (trackWidth * 20) / 140 : 0}
			{@const scaleLabelHundredX = hasNegativeProgress ? (trackWidth * 120) / 140 : trackWidth}
			<div class="space-y-1">
				<!-- Total progress arrow -->
				{#if summaryStats}
					{@const totalProgress = Math.max(0, Math.min(100, summaryStats.overallProgress))}
					{@const totalArrowX = hasNegativeProgress
						? (trackWidth * (totalProgress + 20)) / 140
						: (trackWidth * totalProgress) / 100}
					{@const totalHundredX = hasNegativeProgress ? (trackWidth * 120) / 140 : trackWidth}
					{@const totalZeroX = hasNegativeProgress ? (trackWidth * 20) / 140 : 0}

					<div class="flex items-center gap-3 py-3 border-b border-current/10 mb-2">
						<div class="w-40 flex-shrink-0 text-sm text-right pr-2">
							<span class="font-bold">Gesamt</span>
						</div>
						<div class="relative flex-1" style="height: {trackHeight}px;">
							<svg width="100%" height={trackHeight} class="overflow-visible">
								<!-- Background track -->
								<line
									x1="0"
									y1={trackHeight / 2}
									x2={trackWidth}
									y2={trackHeight / 2}
									stroke="currentColor"
									stroke-width="3"
									opacity="0.1"
								/>

								<!-- 100% marker -->
								<line
									x1={totalHundredX}
									y1={trackHeight / 2 - 10}
									x2={totalHundredX}
									y2={trackHeight / 2 + 10}
									stroke="currentColor"
									stroke-width="2"
									opacity="0.3"
								/>

								<!-- Progress line -->
								<line
									x1={totalZeroX}
									y1={trackHeight / 2}
									x2={totalArrowX}
									y2={trackHeight / 2}
									stroke="currentColor"
									stroke-width="4"
									stroke-linecap="round"
									opacity="0.7"
								/>

								<!-- Arrow head -->
								<g transform="translate({totalArrowX}, {trackHeight / 2})">
									<polygon
										points="0,-{arrowSize * 0.7} {arrowSize * 1.2},0 0,{arrowSize * 0.7}"
										fill="currentColor"
										opacity="0.7"
									/>
								</g>

								<!-- Percentage label -->
								<text
									x={totalArrowX + arrowSize + 6}
									y={trackHeight / 2}
									text-anchor="start"
									dominant-baseline="middle"
									fill="currentColor"
									font-size="14"
									font-weight="700"
								>
									{Math.round(summaryStats.overallProgress)}%
								</text>
							</svg>
						</div>
					</div>
				{/if}

				<!-- Sector progress arrows -->
				{#each sectorProgress as sector}
					{@const progressClamped = hasNegativeProgress
						? Math.max(-20, Math.min(120, sector.contributionPercent))
						: Math.max(0, Math.min(100, sector.contributionPercent))}
					{@const zeroX = hasNegativeProgress ? (trackWidth * 20) / 140 : 0}
					{@const hundredX = hasNegativeProgress ? (trackWidth * 120) / 140 : trackWidth}
					{@const arrowX = hasNegativeProgress
						? (trackWidth * (progressClamped + 20)) / 140
						: (trackWidth * progressClamped) / 100}
					{@const isNegative = sector.contributionPercent < 0}

					<div
						class="flex items-center gap-3 py-2 cursor-pointer transition-opacity {hoveredSector !==
							null && hoveredSector !== sector.sector
							? 'opacity-40'
							: ''}"
						on:mouseenter={(e) => handleMouseEnter(e, sector.sector)}
						on:mousemove={handleMouseMove}
						on:mouseleave={handleMouseLeave}
						role="button"
						tabindex="0"
					>
						<!-- Sector label -->
						<div class="w-40 flex-shrink-0 text-sm text-right pr-2">
							<span class="font-medium">{sector.label}</span>
						</div>

						<!-- Track -->
						<div class="relative flex-1" style="height: {trackHeight}px;">
							<svg width="100%" height={trackHeight} class="overflow-visible">
								<!-- Background track -->
								<line
									x1="0"
									y1={trackHeight / 2}
									x2={trackWidth}
									y2={trackHeight / 2}
									stroke="currentColor"
									stroke-width="2"
									opacity="0.1"
								/>

								<!-- Zero line (only if negative progress exists) -->
								{#if hasNegativeProgress}
									<line
										x1={zeroX}
										y1={trackHeight / 2 - 12}
										x2={zeroX}
										y2={trackHeight / 2 + 12}
										stroke="currentColor"
										stroke-width="2"
										opacity="0.3"
									/>
								{/if}

								<!-- 100% marker -->
								<line
									x1={hundredX}
									y1={trackHeight / 2 - 8}
									x2={hundredX}
									y2={trackHeight / 2 + 8}
									stroke="currentColor"
									stroke-width="1"
									opacity="0.2"
								/>

								<!-- Progress line from zero to arrow -->
								<line
									x1={zeroX}
									y1={trackHeight / 2}
									x2={arrowX}
									y2={trackHeight / 2}
									stroke={sector.color}
									stroke-width="3"
									stroke-linecap="round"
								/>

								<!-- Arrow head -->
								{#if isNegative}
									<g transform="translate({arrowX}, {trackHeight / 2})">
										<polygon
											points="-{arrowSize},-{arrowSize / 2} 0,0 -{arrowSize},{arrowSize / 2}"
											fill={sector.color}
										/>
									</g>
								{:else}
									<g transform="translate({arrowX}, {trackHeight / 2})">
										<polygon
											points="0,-{arrowSize / 2} {arrowSize},0 0,{arrowSize / 2}"
											fill={sector.color}
										/>
									</g>
								{/if}

								<!-- Percentage label -->
								<text
									x={arrowX + (isNegative ? -arrowSize - 4 : arrowSize + 4)}
									y={trackHeight / 2}
									text-anchor={isNegative ? 'end' : 'start'}
									dominant-baseline="middle"
									fill={sector.color}
									font-size="12"
									font-weight="600"
								>
									{Math.round(sector.contributionPercent)}%
								</text>
							</svg>
						</div>
					</div>
				{/each}
			</div>

			<!-- Scale labels -->
			<div class="flex items-center gap-3 mt-2 text-xs opacity-50">
				<div class="w-40 flex-shrink-0"></div>
				<div class="relative flex-1" style="height: 20px;">
					<span class="absolute" style="left: {scaleLabelZeroX}px; transform: translateX(-50%);"
						>0%</span
					>
					<span class="absolute" style="left: {scaleLabelHundredX}px; transform: translateX(-50%);"
						>100%</span
					>
				</div>
			</div>

			<!-- Tooltip -->
			{#if tooltipData}
				<Tooltip
					visible={true}
					x={hoverClientX}
					y={hoverClientY}
					title={tooltipData.title}
					items={tooltipData.items}
				/>
			{/if}
		{:else}
			<div class="h-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
		{/if}
	</div>

	<!-- Legend -->
	<div class="flex flex-wrap gap-4 mt-6 text-sm">
		<div class="flex items-center gap-2">
			<div class="w-8 h-0.5 bg-current opacity-30"></div>
			<span class="opacity-70">0% = Keine Reduktion seit {summaryStats.firstYear}</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-8 h-0.5 bg-current opacity-30"></div>
			<span class="opacity-70">100% = {TARGET_REDUCTION_PERCENT}% Reduktion erreicht</span>
		</div>
	</div>

	<!-- Source note -->
	<div class="text-sm leading-tight mt-4 opacity-70">
		<p class="mt-1">
			Zeigt den Fortschritt jedes Sektors auf dem Weg zur {TARGET_REDUCTION_PERCENT}%-Reduktion bis {TARGET_YEAR}.
			Basis: {summaryStats.firstYear} ({formatNumber(summaryStats.firstYearTotal)}
			{unit}).
		</p>
	</div>
{/if}
