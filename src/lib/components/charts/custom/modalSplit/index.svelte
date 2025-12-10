<!-- $lib/components/charts/custom/mobilityModalSplit/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { scaleBand, scaleLinear } from 'd3-scale';
	import { onMount } from 'svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		fetchData,
		buildChartData,
		processHistoricData,
		calculateGhostRows,
		calculateLabelRows,
		categoryMeta,
		categoryColors,
		ghostColors,
		goalConfig,
		type ModalSplitRawData
	} from './config';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Chart configuration
	const height = 400;
	const margin = { top: 30, right: 16, bottom: 40, left: 50 };

	// State
	let containerEl: HTMLElement;
	let width = 0;
	let ready = false;
	let loading = true;
	let error: string | null = null;

	let rawData: ModalSplitRawData[] = [];
	let historicRows: ModalSplitRawData[] = [];
	let ghostRows: ModalSplitRawData[] = [];
	let labelRows: Array<ModalSplitRawData & { yMid: number }> = [];
	let allYears: number[] = [];

	// Hover state
	let hoverYear: number | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	// Dimensions
	$: innerWidth = Math.max(0, width - margin.left - margin.right);
	$: innerHeight = Math.max(0, height - margin.top - margin.bottom);

	// Scales
	$: xScale = scaleBand<number>().domain(allYears).range([0, innerWidth]).padding(0.15);

	$: yScale = scaleLinear().domain([0, 100]).range([innerHeight, 0]);

	$: bandwidth = xScale.bandwidth();

	// Stack data for rendering
	$: stackedHistoric = computeStacks(historicRows);
	$: stackedGhost = computeStacks(ghostRows);

	function computeStacks(
		rows: ModalSplitRawData[]
	): Array<ModalSplitRawData & { y0: number; y1: number }> {
		const result: Array<ModalSplitRawData & { y0: number; y1: number }> = [];
		let currentYear: number | null = null;
		let acc = 0;

		for (const row of rows) {
			if (row.year !== currentYear) {
				currentYear = row.year;
				acc = 0;
			}

			const y0 = acc;
			const y1 = acc + row.value;
			result.push({ ...row, y0, y1 });
			acc = y1;
		}

		return result;
	}

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

			// Process data
			historicRows = processHistoricData(rawData);
			ghostRows = calculateGhostRows(rawData);
			labelRows = calculateLabelRows(historicRows);

			// Combine all years for x-axis
			const historicYears = Array.from(new Set(rawData.map((d) => d.year)));
			const ghostYears = Array.from(new Set(ghostRows.map((d) => d.year)));
			allYears = Array.from(new Set([...historicYears, ...ghostYears])).sort((a, b) => a - b);

			const chartData = buildChartData(rawData, result.updateDate, region);
			onChartData?.(chartData);
		} catch (e) {
			console.error('[ModalSplit] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Mouse handling
	function handleMouseMove(e: MouseEvent) {
		if (!containerEl || !xScale) return;
		const rect = containerEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left - margin.left;

		// Find which band we're over
		const step = xScale.step();
		if (step > 0) {
			const index = Math.floor(mouseX / step);
			const domain = xScale.domain();
			if (index >= 0 && index < domain.length) {
				hoverYear = domain[index];
				hoverClientX = e.clientX;
				hoverClientY = e.clientY;
				return;
			}
		}
		hoverYear = null;
	}

	function handleMouseLeave() {
		hoverYear = null;
	}

	// Format helper with null safety
	function formatPercent(value: number | null | undefined): string {
		if (value == null || isNaN(value)) return '–';
		return `${value.toFixed(1)}%`;
	}

	// Tooltip data with null safety
	$: tooltipData = (() => {
		if (hoverYear === null) return null;

		// Check if it's a historic or ghost year
		const isGhost = ghostRows.some((d) => d.year === hoverYear);
		const isHistoric = historicRows.some((d) => d.year === hoverYear);

		if (isHistoric) {
			const yearData = historicRows.filter((d) => d.year === hoverYear);
			return {
				title: `${hoverYear}`,
				items: yearData
					.filter((d) => d.value != null)
					.map((d) => ({
						label: `${categoryMeta[d.category]?.icon || ''} ${categoryMeta[d.category]?.label || d.category}`,
						value: formatPercent(d.value),
						color: categoryColors[d.category]
					}))
			};
		} else if (isGhost) {
			const yearData = ghostRows.filter((d) => d.year === hoverYear);
			const renewable = yearData.find((d) => d.category === 'renewable_target');
			const renewableValue = renewable?.value ?? 0;
			return {
				title: `${hoverYear} (Ziel)`,
				items: [
					{
						label: 'Umweltverbund',
						value: formatPercent(renewableValue),
						color: ghostColors.renewable
					},
					{
						label: 'Motorisiert',
						value: formatPercent(100 - renewableValue),
						color: ghostColors.nonRenewable
					}
				]
			};
		}

		return null;
	})();

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
</script>

<div
	bind:this={containerEl}
	class="modal-split-chart relative w-full select-none"
	style="height: {height}px;"
>
	{#if loading || regionLoading}
		<div class="h-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-full flex items-center justify-center text-red-500">{error}</div>
	{:else if !ready || width === 0}
		<div class="h-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else}
		<svg {width} {height} class="overflow-visible">
			<g transform="translate({margin.left},{margin.top})">
				<!-- Grid lines -->
				{#each [0, 25, 50, 75, 100] as tick}
					<line
						x1={0}
						x2={innerWidth}
						y1={yScale(tick)}
						y2={yScale(tick)}
						stroke="currentColor"
						stroke-opacity={0.1}
					/>
				{/each}

				<!-- Y axis -->
				<g class="text-xs text-gray-500">
					{#each [0, 25, 50, 75, 100] as tick}
						<text
							x={-8}
							y={yScale(tick)}
							text-anchor="end"
							dominant-baseline="middle"
							fill="currentColor"
						>
							{tick}%
						</text>
					{/each}
				</g>

				<!-- X axis (top) -->
				<g class="text-xs text-gray-500">
					{#each allYears as year}
						{@const x = (xScale(year) ?? 0) + bandwidth / 2}
						<text {x} y={-8} text-anchor="middle" fill="currentColor">
							{year}
						</text>
					{/each}
				</g>

				<!-- Ghost/goal bars (background) -->
				{#each stackedGhost as bar}
					{@const x = xScale(bar.year) ?? 0}
					{@const y = yScale(bar.y1)}
					{@const h = yScale(bar.y0) - yScale(bar.y1)}
					<rect
						{x}
						{y}
						width={bandwidth}
						height={h}
						fill={bar.category === 'renewable_target'
							? ghostColors.renewable
							: ghostColors.nonRenewable}
						fill-opacity={0.25}
						rx={2}
					/>
				{/each}

				<!-- Historic stacked bars -->
				{#each stackedHistoric as bar}
					{@const x = xScale(bar.year) ?? 0}
					{@const y = yScale(bar.y1)}
					{@const h = yScale(bar.y0) - yScale(bar.y1)}
					<rect
						{x}
						{y}
						width={bandwidth}
						height={h}
						fill={categoryColors[bar.category] || '#6b7280'}
						stroke="#ffffff"
						stroke-width={1}
						rx={2}
						opacity={hoverYear === null || hoverYear === bar.year ? 1 : 0.4}
						class="transition-opacity"
					/>
				{/each}

				<!-- Labels inside bars (only if bar is tall enough) -->
				{#each labelRows as row}
					{@const x = (xScale(row.year) ?? 0) + bandwidth / 2}
					{@const y = yScale(row.yMid)}
					{@const barHeight = yScale(0) - yScale(row.value)}
					{#if barHeight > 35}
						<!-- Icon -->
						<text
							{x}
							y={y - 6}
							text-anchor="middle"
							font-size="14"
							dominant-baseline="middle"
							opacity={hoverYear === null || hoverYear === row.year ? 1 : 0.4}
							class="transition-opacity pointer-events-none"
						>
							{categoryMeta[row.category]?.icon ?? ''}
						</text>
						<!-- Label -->
						<text
							{x}
							y={y + 8}
							text-anchor="middle"
							font-size="9"
							fill="white"
							dominant-baseline="middle"
							opacity={hoverYear === null || hoverYear === row.year ? 1 : 0.4}
							class="transition-opacity pointer-events-none"
						>
							{categoryMeta[row.category]?.label ?? row.category}
						</text>
					{/if}
				{/each}

				<!-- 50% reference line -->
				<line
					x1={0}
					x2={innerWidth}
					y1={yScale(50)}
					y2={yScale(50)}
					stroke="currentColor"
					stroke-dasharray="4 2"
					stroke-width={1.5}
					opacity={0.5}
				/>

				<!-- Goal label -->
				<text
					x={innerWidth - 4}
					y={yScale(goalConfig.targetRenewablePercent) - 6}
					text-anchor="end"
					font-size="10"
					fill="currentColor"
					opacity={0.6}
				>
					Ziel {goalConfig.endYear}: {goalConfig.targetRenewablePercent}%
				</text>

				<!-- Invisible rect for mouse events -->
				<rect
					width={innerWidth}
					height={innerHeight}
					fill="transparent"
					on:mousemove={handleMouseMove}
					on:mouseleave={handleMouseLeave}
					style="cursor: crosshair;"
				/>
			</g>
		</svg>

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
	{/if}
</div>

<!-- Legend -->
{#if !loading && !error && ready}
	<div class="flex flex-wrap gap-4 mt-4 text-sm">
		<div class="flex flex-wrap gap-3">
			{#each [...Object.entries(categoryMeta).filter(([_, m]) => m.renewable)] as [key, meta]}
				<div class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded-full" style="background: {categoryColors[key]}"></span>
					<span>{meta.icon}</span>
					<span class="text-gray-600 dark:text-gray-400">{meta.label}</span>
				</div>
			{/each}
		</div>
		<div class="flex flex-wrap gap-3">
			{#each [...Object.entries(categoryMeta).filter(([_, m]) => !m.renewable)] as [key, meta]}
				<div class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded-full" style="background: {categoryColors[key]}"></span>
					<span>{meta.icon}</span>
					<span class="text-gray-600 dark:text-gray-400">{meta.label}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
