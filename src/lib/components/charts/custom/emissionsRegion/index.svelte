<!-- $lib/components/charts/custom/emissionsBySector/index.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { scaleLinear } from 'd3-scale';
	import { onMount } from 'svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import formatNumber from '$lib/stores/formatNumber';
	import type { ChartData } from '$lib/components/charts/types';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		fetchEmissionsData,
		buildChartData,
		transformForPerCapita,
		groupAndStack,
		getClimateTargets,
		getDisplayedCategories,
		type RegionResult,
		type YearGroup
	} from './config';

	// Props from Card slot
	export let region: any = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Additional props
	export let v: Record<string, string> = {};

	// Chart configuration
	const height = 320;
	const horizontalHeight = 96;
	const margin = { top: 20, right: 20, bottom: 30, left: 90 };

	// State
	let containerEl: HTMLElement;
	let width = 0;

	let views: { key: string; label: string }[] = [];
	let activeLayer: string | null = null;
	let results: RegionResult[] = [];
	let loading = true;
	let showPerCapita = false;
	let dataFetched = false;
	let populationByYear: Record<string, Record<number, number>> = {};
	let activeCategory = 'all';

	// Hover state
	let hoveredYear: number | null = null;
	let hoveredSector: string | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	// Layer hierarchy (smallest/most local first)
	const layerHierarchy = [
		'municipality',
		'gemeinde',
		'district',
		'bezirk',
		'kreis',
		'landkreis',
		'city',
		'stadt',
		'region',
		'regierungsbezirk',
		'bundesland',
		'state',
		'gruppe',
		'country',
		'land'
	];

	// Get priority for a layer (lower = more local = preferred)
	function getLayerPriority(layer: string): number {
		const lowerLayer = layer.toLowerCase();
		const index = layerHierarchy.findIndex((l) => lowerLayer.includes(l));
		return index === -1 ? 999 : index;
	}

	// Region candidates from page context
	$: currentId = page.data?.page?.id;
	$: parentIds = page.data?.page?.parents?.map((p: any) => p.id) || [];
	$: regionCandidates = [currentId, ...parentIds].filter(Boolean);

	// Fetch data when region candidates are available
	$: if (regionCandidates.length > 0 && !dataFetched) {
		dataFetched = true;
		loadData();
	}

	async function loadData() {
		loading = true;
		try {
			const { results: fetchedResults, populationByYear: fetchedPopulation } =
				await fetchEmissionsData(regionCandidates);

			results = fetchedResults;
			populationByYear = fetchedPopulation;

			// Sort views by layer hierarchy (smallest/most local first)
			views = results
				.map((r) => ({ key: r.key, label: r.label, priority: getLayerPriority(r.layer_label) }))
				.sort((a, b) => a.priority - b.priority)
				.map(({ key, label }) => ({ key, label }));

			// Select smallest available layer
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
		if (onChartData && results.length > 0 && activeLayer) {
			const selectedResult = results.find((r) => r.key === activeLayer);
			if (selectedResult) {
				const transformedData = showPerCapita
					? transformForPerCapita(
							selectedResult.data,
							getPopulationForRegion(selectedResult.id),
							selectedResult.population
						)
					: selectedResult.data;
				const chartData = buildChartData(
					transformedData,
					selectedResult,
					showPerCapita,
					PUBLIC_VERSION
				);
				onChartData(chartData);
			}
		}
	}

	// Filter views based on current page context (maintains sort order)
	$: filteredViews = (() => {
		if (results.length > 0) {
			const currentRegion = results.find((r) => r.name.includes('Hamburg'));
			if (currentRegion) {
				return views.filter((v) => v.label.includes('Stadtstaaten'));
			}
		}
		return views;
	})();

	// Auto-select appropriate view
	$: if (
		filteredViews.length > 0 &&
		(!activeLayer || !filteredViews.find((v) => v.key === activeLayer))
	) {
		activeLayer = filteredViews[0]?.key ?? null;
	}

	// Auto-enable per-capita for Bavaria
	$: if (results.length > 0 && activeLayer) {
		const selectedRegion = results.find((r) => r.key === activeLayer);
		if (selectedRegion?.layer_label === 'Bundesland' && selectedRegion.name.includes('Bayern')) {
			showPerCapita = true;
		}
	}

	// Update chart data when selection changes
	$: if (activeLayer && results.length > 0) {
		updateChartData();
	}

	// Helper to get population for a specific region
	function getPopulationForRegion(regionId: string): Record<number, number> {
		return populationByYear[regionId] || {};
	}

	// Current selected region
	$: selectedRegion = results.find((r) => r.key === activeLayer) || null;

	// Transformed and processed data for current selection
	$: currentData = selectedRegion
		? showPerCapita
			? transformForPerCapita(
					selectedRegion.data,
					getPopulationForRegion(selectedRegion.id),
					selectedRegion.population
				)
			: selectedRegion.data
		: [];

	$: grouped = selectedRegion ? groupAndStack(currentData, selectedRegion.categoryOrder) : [];
	$: climateTargets = selectedRegion
		? getClimateTargets(
				selectedRegion.data,
				getPopulationForRegion(selectedRegion.id),
				selectedRegion.population,
				showPerCapita
			)
		: [];
	$: displayedCategories = selectedRegion
		? getDisplayedCategories(selectedRegion.data, selectedRegion.categoryOrder)
		: [];

	// Determine chart mode
	$: barData = currentData.filter((d) => d.source !== 'climate-target');
	$: uniqueYears = new Set(barData.map((d) => d.year));
	$: isHorizontal = uniqueYears.size === 1 && barData.length > 1;
	$: singleYear = isHorizontal ? [...uniqueYears][0] : null;

	// Dimensions
	$: innerWidth = Math.max(0, width - margin.left - margin.right);
	$: innerHeight = Math.max(
		0,
		(isHorizontal ? horizontalHeight : height) - margin.top - margin.bottom
	);

	// Years and scales for vertical chart
	$: historicYears = grouped.map((g) => g.year);
	$: allYears = [...new Set([...historicYears, ...climateTargets.map((t) => t.year)])].sort(
		(a, b) => a - b
	);
	$: minYear = allYears.length > 0 ? Math.min(...allYears) : 2000;
	$: maxYear = allYears.length > 0 ? Math.max(...allYears) : 2030;
	$: barWidth =
		innerWidth > 0 ? Math.max(4, Math.round(innerWidth / (maxYear - minYear + 1)) - 4) : 10;

	// Y domain based on active category
	$: visibleMax = (() => {
		if (activeCategory === 'all') {
			return Math.max(...grouped.map((g) => g.total), 0) * 1.1;
		} else {
			return (
				Math.max(
					...grouped.map((g) => g.sectors.find((s) => s.sector === activeCategory)?.value ?? 0),
					0
				) * 1.1
			);
		}
	})();

	$: xScale = scaleLinear().domain([minYear, maxYear]).range([0, innerWidth]);
	$: yScale = scaleLinear().domain([0, visibleMax]).range([innerHeight, 0]);

	// Horizontal chart scales
	$: horizontalTotal = barData.reduce((sum, d) => sum + d.value, 0);
	$: horizontalXScale = scaleLinear().domain([0, horizontalTotal]).range([0, width]);
	$: horizontalStackedData = (() => {
		let offset = 0;
		return barData.map((d) => {
			const item = { ...d, xOffset: offset };
			offset += d.value;
			return item;
		});
	})();

	// Unit label
	$: unit = showPerCapita ? 't CO₂eq pro Kopf' : PUBLIC_VERSION === 'de' ? 'Mt CO₂eq' : 't CO₂eq';

	// Latest data
	$: latestYear = historicYears.length > 0 ? Math.max(...historicYears) : null;
	$: latestData = latestYear ? grouped.find((g) => g.year === latestYear) : null;
	$: latestTotal = latestData?.total ?? 0;
	$: lastTarget = climateTargets.length > 0 ? climateTargets[climateTargets.length - 1] : null;

	// Per-capita availability
	$: allowPerCapita = PUBLIC_VERSION === 'de';
	$: canShowPerCapita = results.some(
		(r) => r.population || Object.keys(getPopulationForRegion(r.id)).length > 0
	);

	// Switch options
	$: switchOptions = [{ key: 'all', label: 'Sektoren' }, ...displayedCategories];

	// Tooltip data
	$: tooltipData = (() => {
		if (isHorizontal) {
			if (hoveredSector === null) return null;
			const sector = horizontalStackedData.find((d) => d.category === hoveredSector);
			if (!sector) return null;
			return {
				title: sector.category_label || sector.category,
				items: [
					{
						label: String(singleYear),
						value: `${formatNumber(sector.value)} ${unit}`,
						color: sector.category_color
					}
				]
			};
		} else {
			if (hoveredYear === null) return null;
			const yearData = grouped.find((g) => g.year === hoveredYear);
			if (!yearData) return null;

			if (activeCategory === 'all') {
				return {
					title: `${hoveredYear}`,
					items: yearData.sectors
						.filter((s) => s.value > 0)
						.sort((a, b) => {
							const aIdx = selectedRegion?.categoryOrder.indexOf(a.sector) ?? 0;
							const bIdx = selectedRegion?.categoryOrder.indexOf(b.sector) ?? 0;
							return aIdx - bIdx;
						})
						.map((s) => ({
							label: s.label,
							value: `${formatNumber(s.value)} ${unit}`,
							color: s.color
						}))
				};
			} else {
				const sector = yearData.sectors.find((s) => s.sector === activeCategory);
				if (!sector || sector.value === 0) return null;
				return {
					title: `${hoveredYear}`,
					items: [
						{
							label: sector.label,
							value: `${formatNumber(sector.value)} ${unit}`,
							color: sector.color
						}
					]
				};
			}
		}
	})();

	// Mouse handlers
	function handleMouseMove(e: MouseEvent, year: number) {
		hoveredYear = year;
		hoverClientX = e.clientX;
		hoverClientY = e.clientY;
	}

	function handleHorizontalMouseMove(e: MouseEvent, category: string) {
		hoveredSector = category;
		hoverClientX = e.clientX;
		hoverClientY = e.clientY;
	}

	function handleMouseLeave() {
		hoveredYear = null;
		hoveredSector = null;
	}

	// Resize observer
	let ro: ResizeObserver | null = null;

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const newWidth = entry.contentRect.width;
				if (newWidth > 0) {
					width = newWidth;
				}
			}
		});

		return () => {
			ro?.disconnect();
		};
	});

	// Observe container when it becomes available
	$: if (containerEl && ro) {
		ro.observe(containerEl);
	}
</script>

{#if loading || regionLoading}
	<p class="text-sm text-gray-500">Lade Emissionsdaten…</p>
{:else if results.length === 0}
	<p class="text-sm text-gray-500">Keine Emissionsdaten für diese Region verfügbar.</p>
{:else if selectedRegion}
	<!-- Layer switch -->
	{#if filteredViews.length > 1}
		<div class="flex flex-wrap gap-2 mb-4">
			{#each filteredViews as view}
				<button
					class="px-3 py-1.5 text-sm rounded-full transition-colors
						{activeLayer === view.key
						? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
						: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}"
					on:click={() => (activeLayer = view.key)}
				>
					{view.label}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Per-capita toggle -->
	{#if allowPerCapita && canShowPerCapita}
		<label
			class="flex gap-2 text-sm items-center mb-4 cursor-pointer {showPerCapita
				? 'text-gray-700 dark:text-gray-300'
				: 'text-gray-400'}"
			transition:fade
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path
					d="M16 3.13a4 4 0 0 1 0 7.75"
				/><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
			</svg>
			<span>Pro-Kopf Emissionen?</span>
			<input type="checkbox" bind:checked={showPerCapita} class="ml-1" />
		</label>
	{/if}

	<!-- Summary text -->
	<p class="text-xl max-w-xl mb-4">
		<strong>{selectedRegion.name}</strong>: {isHorizontal ? singleYear : latestYear} entfielen die meisten
		Emissionen
		{#if showPerCapita}pro Kopf{/if}
		auf die Sektoren
		{#each (isHorizontal ? horizontalStackedData : latestData?.sectors || [])
			.slice()
			.sort((a, b) => b.value - a.value)
			.slice(0, 3) as s, i}
			<span
				class="inline-block px-1 py-0.5 rounded text-white"
				style="background-color: {s.category_color || s.color}">{s.category_label || s.label}</span
			>{i < 2 ? ', ' : ''}
		{/each}
		{#if lastTarget && activeCategory === 'all' && !isHorizontal}
			Bis {lastTarget.year} möchte {selectedRegion.name}
			{lastTarget.value === 0 ? 'Klimaneutralität' : formatNumber(lastTarget.value) + ' ' + unit} erreichen.
		{/if}
	</p>

	<!-- Chart container -->
	<div
		bind:this={containerEl}
		class="relative select-none w-full"
		style="height: {isHorizontal ? horizontalHeight : height}px;"
	>
		{#if width > 0}
			{#if isHorizontal}
				<!-- Horizontal stacked bar -->
				<svg {width} height={horizontalHeight}>
					{#each horizontalStackedData as d}
						<rect
							x={horizontalXScale(d.xOffset)}
							y={0}
							width={Math.max(0, horizontalXScale(d.value))}
							height={horizontalHeight}
							fill={d.category_color}
							opacity={hoveredSector === null || hoveredSector === d.category ? 1 : 0.4}
							class="transition-opacity cursor-pointer"
							on:mouseenter={(e) => handleHorizontalMouseMove(e, d.category)}
							on:mousemove={(e) => {
								hoverClientX = e.clientX;
								hoverClientY = e.clientY;
							}}
							on:mouseleave={handleMouseLeave}
						/>
					{/each}
				</svg>
			{:else}
				<!-- Vertical stacked bars -->
				<svg {width} {height}>
					<!-- X axis -->
					<g transform="translate({margin.left},{margin.top + innerHeight})">
						{#each xScale.ticks(width > 600 ? 10 : 5) as tick}
							<g transform="translate({xScale(tick)}, 0)" class="text-xs">
								<line y2={5} class="stroke-current opacity-10" />
								<text y={18} text-anchor="middle" fill="currentColor" class="opacity-70"
									>{tick}</text
								>
							</g>
						{/each}
					</g>

					<!-- Y axis -->
					<g transform="translate(0,{margin.top})">
						{#each yScale.ticks() as tick, i}
							<g transform="translate(0, {yScale(tick)})" class="text-xs">
								<line x1={margin.left} x2={width} class="stroke-current opacity-10" />
								<text x={4} dominant-baseline="middle" fill="currentColor" class="opacity-70">
									{tick}{i === yScale.ticks().length - 1 ? ` ${unit}` : ''}
								</text>
							</g>
						{/each}
					</g>

					<!-- Bars -->
					<g transform="translate({margin.left},{margin.top})">
						{#each grouped as yearData}
							<g transform="translate({xScale(yearData.year)}, 0)">
								{#if activeCategory === 'all'}
									{#each yearData.stackedSectors as s}
										{#if s.value > 0}
											<rect
												x={-barWidth / 2}
												y={yScale(s.end)}
												width={barWidth}
												height={Math.max(0, yScale(s.start) - yScale(s.end))}
												fill={s.color}
												opacity={hoveredYear === null || hoveredYear === yearData.year ? 1 : 0.4}
												class="transition-opacity cursor-pointer"
												on:mouseenter={(e) => handleMouseMove(e, yearData.year)}
												on:mousemove={(e) => handleMouseMove(e, yearData.year)}
												on:mouseleave={handleMouseLeave}
											/>
										{/if}
									{/each}
								{:else}
									{#each yearData.sectors.filter((s) => s.sector === activeCategory) as s}
										{#if s.value > 0}
											<rect
												x={-barWidth / 2}
												y={yScale(s.value)}
												width={barWidth}
												height={Math.max(0, innerHeight - yScale(s.value))}
												fill={s.color}
												opacity={hoveredYear === null || hoveredYear === yearData.year ? 1 : 0.4}
												class="transition-opacity cursor-pointer"
												on:mouseenter={(e) => handleMouseMove(e, yearData.year)}
												on:mousemove={(e) => handleMouseMove(e, yearData.year)}
												on:mouseleave={handleMouseLeave}
											/>
										{/if}
									{/each}
								{/if}
							</g>
						{/each}
					</g>

					<!-- Climate targets -->
					{#if climateTargets.length > 0 && activeCategory === 'all'}
						<g transform="translate({margin.left},{margin.top})">
							{#each climateTargets as target}
								<rect
									x={xScale(target.year) - barWidth / 2}
									y={yScale(target.value)}
									width={barWidth}
									height={Math.max(0, innerHeight - yScale(target.value))}
									fill="currentColor"
									opacity={0.1}
								/>
							{/each}
							{#if latestYear && latestTotal > 0}
								<path
									d={[
										`M ${xScale(latestYear)},${yScale(latestTotal)}`,
										...climateTargets.map((t) => `L ${xScale(t.year)},${yScale(t.value)}`)
									].join(' ')}
									fill="none"
									stroke="currentColor"
									stroke-width={2}
									stroke-dasharray="4 4"
									opacity={0.5}
								/>
							{/if}
						</g>
					{/if}
				</svg>
			{/if}

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
			<div class="h-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
		{/if}
	</div>

	<!-- Category switch (only for vertical chart) -->
	{#if !isHorizontal}
		<div class="flex flex-wrap gap-2 mt-4">
			{#each switchOptions as option}
				<button
					class="px-3 py-1.5 text-sm rounded-full transition-colors
						{activeCategory === option.key
						? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
						: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}"
					on:click={() => (activeCategory = option.key)}
				>
					{#if option.key !== 'all'}
						<span
							class="inline-block w-2 h-2 rounded-full mr-1.5"
							style="background-color: {option.color}"
						></span>
					{/if}
					{option.label}
				</button>
			{/each}
		</div>
	{:else}
		<!-- Legend for horizontal chart -->
		<div class="flex flex-wrap gap-3 mt-4">
			{#each horizontalStackedData.sort((a, b) => b.value - a.value) as sector}
				<div
					class="flex items-center gap-1.5 text-sm cursor-pointer transition-opacity {hoveredSector !==
						null && hoveredSector !== sector.category
						? 'opacity-40'
						: ''}"
					on:mouseenter={(e) => handleHorizontalMouseMove(e, sector.category)}
					on:mouseleave={handleMouseLeave}
				>
					<span class="w-3 h-3 rounded-sm" style="background-color: {sector.category_color}"></span>
					<span>{sector.category_label}</span>
					<span class="text-gray-500">({formatNumber(sector.value)} {unit})</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Source note -->
	<div class="text-sm leading-tight mt-4 opacity-70">
		{#if PUBLIC_VERSION === 'de'}
			<p>Datenquelle: Statistische Ämter des Bundes und der Länder (Tabelle 86431-Z-04)</p>
		{:else}
			<p>Datenquelle: {currentData[0]?.source}</p>
		{/if}
		{#if showPerCapita && Object.keys(getPopulationForRegion(selectedRegion.id)).length > 0}
			<p class="mt-1">Pro-Kopf-Werte basieren auf jahresspezifischen Bevölkerungsdaten.</p>
		{:else if showPerCapita && selectedRegion.population}
			<p class="mt-1">
				Pro-Kopf-Werte basieren auf einer Bevölkerung von {selectedRegion.population.toLocaleString(
					'de-DE'
				)} Einwohnern.
			</p>
		{/if}
	</div>
{/if}
