<!-- $lib/components/charts/custom/emissionsReductionProgress/index.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
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
		computeInfoTextPlaceholders,
		type RegionResult,
		type SectorProgress,
		type ReductionSummary,
		type PageRegionContext
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
	const trackHeight = 20;

	// Animation state
	let animationProgress = 0;
	let hasAnimated = false;

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

	// Page region context for info text placeholders (stable, based on page region prop)
	$: pageRegionContext = (region
		? {
				name: region.name,
				layer: region.layer,
				parents: region.parents
			}
		: page.data?.page
			? {
					name: page.data.page.name,
					layer: page.data.page.layer,
					parents: page.data.page.parents
				}
			: null) as PageRegionContext | null;

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
			// Compute info text placeholders from page region context
			const infoTextPlaceholders = computeInfoTextPlaceholders(results, pageRegionContext);
			const chartData = buildChartData(selectedRegion, sectors, summary, useMegatons, dataSource, PUBLIC_VERSION, infoTextPlaceholders);
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
	$: trackWidth = Math.max(0, width - 220);

	// Calculate linear progress (how far we should be based on time elapsed)
	$: linearProgress = (() => {
		if (!summaryStats || !summaryStats.targetYear) return 0;
		const startYear = summaryStats.baseYear;
		const targetYear = summaryStats.targetYear;
		const currentYear = summaryStats.lastYear;
		const totalYears = targetYear - startYear;
		const elapsedYears = currentYear - startYear;
		if (totalYears <= 0) return 0;
		return Math.min(100, (elapsedYears / totalYears) * 100);
	})();

	// Trigger animation when data is ready and component is visible
	$: if (width > 0 && sectorProgress.length > 0 && !hasAnimated) {
		hasAnimated = true;
		animationProgress = 0;
		// Use requestAnimationFrame for smooth animation
		const startTime = performance.now();
		const duration = 800; // 800ms animation
		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			animationProgress = Math.min(1, elapsed / duration);
			if (animationProgress < 1) {
				requestAnimationFrame(animate);
			}
		};
		requestAnimationFrame(animate);
	}

	// Reset animation when data changes
	$: if (activeLayer) {
		hasAnimated = false;
	}

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
					label: `${summaryStats.baseYear}`,
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
					label: 'Fortschritt zum Klimaziel',
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

	<!-- Progress tracks -->
	<div bind:this={containerEl} class="relative select-none w-full">
		{#if width > 0}
			{@const linearProgressX = (trackWidth * linearProgress) / 100}
			<div class="space-y-1">
				<!-- Total progress bar -->
				{#if summaryStats}
					{@const totalProgress = Math.max(0, Math.min(100, summaryStats.overallProgress))}
					{@const animatedTotalProgress = totalProgress * animationProgress}
					{@const progressWidth = (animatedTotalProgress / 100) * trackWidth}

					<div class="flex items-center gap-3 py-2 border-b border-current/10 mb-1">
						<div class="w-32 flex-shrink-0 text-sm text-right pr-2">
							<span class="font-bold">Gesamt</span>
						</div>
						<div class="relative flex-1" style="height: {trackHeight}px;">
							<!-- Background track (gray rounded bar) -->
							<div
								class="absolute inset-0 bg-current/10 rounded-full"
								style="height: {trackHeight}px;"
							></div>

							<!-- Progress fill (animated) -->
							<div
								class="absolute left-0 top-0 bg-current/70 rounded-full transition-none"
								style="height: {trackHeight}px; width: {progressWidth}px;"
							></div>

							<!-- Percentage label inside bar -->
							<span
								class="absolute top-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap"
								style="left: {Math.max(progressWidth + 6, 6)}px;"
							>
								{Math.round(summaryStats.overallProgress)}%
							</span>

							<!-- Linear progress marker (where we should be) -->
							<div
								class="absolute top-1/2 -translate-y-1/2 w-0.5 bg-current/10"
								style="left: {linearProgressX}px; height: {trackHeight}px;"
							></div>
						</div>
					</div>
				{/if}

				<!-- Sector progress bars -->
				{#each sectorProgress as sector}
					{@const progressClamped = Math.max(0, Math.min(100, sector.contributionPercent))}
					{@const animatedProgress = progressClamped * animationProgress}
					{@const sectorProgressWidth = (animatedProgress / 100) * trackWidth}
					{@const isNegative = sector.contributionPercent < 0}

					<div
						class="flex items-center gap-3 py-1.5 cursor-pointer transition-opacity {hoveredSector !==
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
						<div class="w-32 flex-shrink-0 text-sm leading-none text-right pr-2">
							<span class="font-medium">{sector.label}</span>
						</div>

						<!-- Track -->
						<div class="relative flex-1" style="height: {trackHeight}px;">
							<!-- Background track (gray rounded bar) -->
							<div
								class="absolute inset-0 bg-current/10 rounded-full"
								style="height: {trackHeight}px;"
							></div>

							<!-- Progress fill (animated) -->
							{#if !isNegative}
								<div
									class="absolute left-0 top-0 rounded-full transition-none"
									style="height: {trackHeight}px; width: {sectorProgressWidth}px; background-color: {sector.color};"
								></div>
							{:else}
								<!-- For negative progress, show a red indicator -->
								<div
									class="absolute left-0 top-0 rounded-full bg-red-500/30"
									style="height: {trackHeight}px; width: {Math.min(
										20,
										Math.abs(sector.contributionPercent)
									) * animationProgress}px;"
								></div>
							{/if}

							<!-- Percentage label inside bar -->
							<span
								class="absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold whitespace-nowrap"
								style="left: {Math.max(sectorProgressWidth + 6, 6)}px; color: {isNegative
									? '#ef4444'
									: sector.color};"
							>
								{Math.round(sector.contributionPercent)}%
							</span>

							<!-- Linear progress marker (where we should be) -->
							<div
								class="absolute top-1/2 -translate-y-1/2 w-0.5 bg-current/10"
								style="left: {linearProgressX}px; height: {trackHeight}px;"
							></div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Scale labels -->
			<div class="flex items-center gap-3 mt-2 text-xs">
				<div class="w-32 flex-shrink-0"></div>
				<div class="relative flex-1 flex justify-between gap-2">
					<span>{summaryStats.baseYear}</span>
					<span class="border-t flex-1 translate-y-2 border-current"></span>
					<span>Ziel</span>
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
	<div class="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-xs">
		<div class="flex items-center gap-2">
			<div class="w-0.5 h-3 bg-current/40"></div>
			<span class="opacity-70">Linearer Fortschritt</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-6 h-2 bg-current/70 rounded-full"></div>
			<span class="opacity-70">Ziel: Klimaneutralität bis {summaryStats.targetYear}</span>
		</div>
	</div>

	<!-- Source note -->
	<div class="text-sm leading-tight mt-4 opacity-70">
		<p class="mt-1">
			Zeigt den Fortschritt jedes Sektors auf dem Weg zur Klimaneutralität bis {summaryStats.targetYear}.
			Basis: {summaryStats.baseYear} ({formatNumber(summaryStats.baseYearTotal)}
			{unit}).
		</p>
	</div>
{/if}
