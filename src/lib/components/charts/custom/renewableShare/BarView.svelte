<!-- $lib/components/charts/custom/renewableShare/BarView.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import RuleY from '$lib/components/charts/primitives/marks/RuleY.svelte';
	import RuleX from '$lib/components/charts/primitives/marks/RuleX.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		buildChartData,
		getBarColor,
		GREEN_COLOR,
		type CategoryType,
		type ProcessedDataPoint,
		type RenewableShareRawData
	} from './config';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';

	// Purple color for 100% threshold line (divergent from green bars)
	const THRESHOLD_COLOR = '#004636';

	// Props
	export let data: ProcessedDataPoint[] = [];
	export let category: CategoryType = 'day';
	export let yearlyStats: RenewableShareRawData[] = [];
	export let updateDate: string = '';
	export let dataLoading: boolean = true;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// State
	let containerEl: HTMLElement;

	// X domain - using index for proper band scale with many bars
	$: chartData = data.map((d, i) => ({
		...d,
		index: i
	}));

	$: xDomain = chartData.map((d) => d.index);

	// Y-axis always 0-100+ (to show 100% line properly)
	$: yMax = Math.max(100, ...data.map((d) => d.value), 1);

	// Format functions
	$: yFormat = (v: number) => formatNumber(v, 0);

	// Calculate tick count based on number of bars to prevent overlap
	// For daily data (365+ bars), show fewer ticks
	$: tickCount = (() => {
		const count = data.length;
		if (count > 300) return 6; // Daily view
		if (count > 50) return 8; // Monthly view
		return Math.min(count, 10); // Yearly view
	})();

	// X-axis format - reactive function that uses current chartData and category
	$: xFormat = (index: number): string => {
		const point = chartData[index];
		if (!point || !point.period) return '';

		const date = new Date(point.period);
		if (isNaN(date.getTime())) return '';

		if (category === 'day' || category === 'month') {
			// For daily/monthly, show month.year
			return `${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
		}
		// Year
		return date.getFullYear().toString();
	};

	// Update chart data callback
	$: if (!dataLoading && data.length > 0) {
		const chartDataObj = buildChartData(data, category, yearlyStats, updateDate);
		onChartData?.(chartDataObj);
	} else if (!dataLoading && data.length === 0) {
		onChartData?.(null);
	}
</script>

<div bind:this={containerEl} class="bar-view">
	{#if dataLoading}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if data.length === 0}
		<div class="h-72 flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<Chart
			data={chartData}
			x="index"
			y="value"
			xType="band"
			{yMax}
			yMin={0}
			height={320}
			margin={{ top: 15, right: 15, bottom: 35, left: 20 }}
			padding={0.1}
		>
			<svelte:fragment
				slot="default"
				let:xScale
				let:yScale
				let:xDomain
				let:innerWidth
				let:innerHeight
				let:hover
			>
				<AxisY {yScale} {innerWidth} {innerHeight} format={yFormat} unit="%" />
				{@const lastIndex = xDomain.length > 0 ? xDomain[xDomain.length - 1] : null}
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={xFormat}
					{tickCount}
					forceTicks={lastIndex !== null ? [lastIndex] : []}
				/>

				<!-- 100% reference line (purple for contrast with green bars) -->
				{@const y100 = yScale(100)}
				<g class="rule-100">
					<line
						x1={10}
						x2={innerWidth}
						y1={y100}
						y2={y100}
						stroke={THRESHOLD_COLOR}
						stroke-width="2"
					/>
					<text
						x={6}
						y={y100 + 4}
						text-anchor="end"
						class="text-xs font-semibold"
						fill={THRESHOLD_COLOR}
					>
						100%
					</text>
				</g>

				<!-- Bars -->
				{#each chartData as d}
					{@const barX = xScale(d.index)}
					{@const barWidth = xScale.bandwidth ? xScale.bandwidth() : 2}
					{@const barY = yScale(d.value)}
					{@const zeroY = yScale(0)}
					{@const barHeight = Math.abs(zeroY - barY)}
					{@const barColor = getBarColor(d.value)}
					{#if barX !== undefined}
						<rect
							x={barX}
							y={barY}
							width={barWidth}
							height={barHeight}
							fill={barColor}
							class="transition-opacity"
							opacity={hover.x === d.index ? 1 : 0.85}
						/>
					{/if}
				{/each}

				<RuleX {xScale} {innerHeight} {hover} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{@const point = chartData.find((d) => d.index === hover.x)}
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={point ? point.label : ''}
					items={point
						? [
								{
									label: 'Erneuerbarer Anteil',
									value: formatPercent(point.value, 1),
									color: getBarColor(point.value)
								}
							]
						: []}
				/>
			</svelte:fragment>
		</Chart>

		<!-- Legend -->
		<div class="flex flex-wrap gap-4 mt-4 text-sm">
			<div class="flex items-center gap-2">
				<div class="w-4 h-3 rounded-sm" style="background: {GREEN_COLOR}"></div>
				<span>100% oder mehr</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-4 h-3 rounded-sm" style="background: #c1c1c1"></div>
				<span>Unter 100%</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-6 h-0.5 rounded" style="background: {THRESHOLD_COLOR}"></div>
				<span>100%-Schwelle</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.bar-view {
		width: 100%;
	}
</style>
