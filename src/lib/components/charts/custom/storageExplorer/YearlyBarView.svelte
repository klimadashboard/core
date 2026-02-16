<!-- $lib/components/charts/custom/storageExplorer/YearlyBarView.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import RuleX from '$lib/components/charts/primitives/marks/RuleX.svelte';
	import RuleY from '$lib/components/charts/primitives/marks/RuleY.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		buildChartData,
		getActiveCategories,
		getValue,
		getMetricField,
		LATE_REGISTRATION_MONTHS,
		formatNumber,
		formatPeriodLabel,
		type MetricMode,
		type StoragePeriodData,
		type StorageCategory
	} from './config';
	import { formatPower, getPowerUnit, convertPowerUnit } from '$lib/utils/formatters';

	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let data: StoragePeriodData[] = [];
	export let updateDate: string | null = null;
	export let dataLoading: boolean = true;
	export let metricMode: MetricMode = 'power';

	let containerEl: HTMLElement;

	$: activeCategories = getActiveCategories(data);

	$: metricField = getMetricField('yearly', metricMode);

	// Build stacked data: for each period, compute y0 and y1 for each category
	$: stackedData = data.map((row) => {
		let y0 = 0;
		const stacks: Array<{
			category: StorageCategory;
			y0: number;
			y1: number;
			value: number;
			period: number | string;
		}> = [];

		for (const cat of activeCategories) {
			const value = getValue(row, cat.key, metricField);
			if (value > 0) {
				stacks.push({
					category: cat,
					y0,
					y1: y0 + value,
					value,
					period: row.period
				});
				y0 += value;
			}
		}
		return { period: row.period, total: y0, stacks };
	});

	$: xDomain = data.map((d) => d.period);
	$: yMax = Math.max(...stackedData.map((d) => d.total), 1);
	$: unit = metricMode === 'power' ? getPowerUnit(yMax, 'solar') : '';
	$: yFormat = metricMode === 'power'
		? (v: number) => formatNumber(convertPowerUnit(v, yMax), 0)
		: (v: number) => formatNumber(v, 0);

	$: lateRegistrationStart =
		xDomain.length > LATE_REGISTRATION_MONTHS
			? xDomain[xDomain.length - LATE_REGISTRATION_MONTHS]
			: undefined;

	$: if (!dataLoading && data.length > 0) {
		const chartData = buildChartData(data, region, activeCategories, updateDate, 'yearly');
		onChartData?.(chartData);
	} else if (!dataLoading && data.length === 0) {
		onChartData?.(null);
	}
</script>

<div bind:this={containerEl} class="yearly-bar-view">
	{#if dataLoading || regionLoading}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if data.length === 0}
		<div class="h-72 flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<Chart
			data={stackedData}
			x="period"
			y="total"
			xType="band"
			{xDomain}
			{yMax}
			height={280}
			margin={{ top: 48, right: 15, bottom: 35, left: 32 }}
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
				<AxisY {yScale} {innerWidth} {innerHeight} format={yFormat} {unit} />
				{@const lastPeriod = xDomain.length > 0 ? xDomain[xDomain.length - 1] : null}
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={formatPeriodLabel}
					tickCount={Math.ceil(xDomain.length / 6)}
					forceTicks={lastPeriod ? [lastPeriod] : []}
				/>
				<RuleY y={0} {yScale} {innerWidth} />

				<!-- Stacked bars -->
				{#each stackedData as periodData}
					{@const barX = xScale(periodData.period)}
					{@const barWidth = xScale.bandwidth ? xScale.bandwidth() : 20}
					{#if barX !== undefined}
						{#each periodData.stacks as stack}
							<rect
								x={barX}
								y={yScale(stack.y1)}
								width={barWidth}
								height={Math.abs(yScale(stack.y0) - yScale(stack.y1))}
								fill={stack.category.color}
								class="transition-opacity"
								opacity={hover.x === periodData.period ? 1 : 0.85}
							/>
						{/each}
					{/if}
				{/each}

				<RuleX {xScale} {innerHeight} {hover} />

				<!-- Late registration overlay -->
				{#if lateRegistrationStart !== undefined}
					{@const overlayX = xScale(lateRegistrationStart) ?? 0}
					<rect
						x={overlayX}
						y={-48}
						width={innerWidth - overlayX}
						height={innerHeight + 48}
						fill="currentColor"
						opacity="0.06"
						class="pointer-events-none"
					/>
					<text
						text-anchor="end"
						class="fill-gray-400 dark:fill-gray-500 pointer-events-none"
						font-size="10"
					>
						<tspan x={innerWidth - 4} y={-26}>Nach-</tspan>
						<tspan x={innerWidth - 4} dy="12">meldungen</tspan>
						<tspan x={innerWidth - 4} dy="12">erwartet</tspan>
					</text>
				{/if}
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{@const periodData = stackedData.find((d) => d.period === hover.x)}
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={hover.x !== null ? formatPeriodLabel(hover.x) : ''}
					items={periodData
						? [
								...periodData.stacks
									.filter((s) => s.value > 0)
									.reverse()
									.map((s) => ({
										label: s.category.label,
										value: metricMode === 'power'
											? formatPower(s.value, 'solar')
											: formatNumber(s.value, 0),
										color: s.category.color
									})),
								...(periodData.total > 0
									? [
											{
												label: 'Gesamt',
												value: metricMode === 'power'
													? formatPower(periodData.total, 'solar')
													: formatNumber(periodData.total, 0)
											}
										]
									: [])
							]
						: []}
					container={containerEl}
				/>
			</svelte:fragment>
		</Chart>

		<!-- Legend -->
		<div class="flex flex-wrap gap-4 mt-4 text-sm">
			{#each activeCategories as cat}
				<div class="flex items-center gap-2">
					<div class="w-4 h-3 rounded-sm" style="background: {cat.color}"></div>
					<span>{cat.label}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
