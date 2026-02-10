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
		formatNumber,
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

	let containerEl: HTMLElement;

	$: activeCategories = getActiveCategories(data);

	// Build stacked data: for each year, compute y0 and y1 for each category
	$: stackedData = data.map((row) => {
		let y0 = 0;
		const stacks: Array<{
			category: StorageCategory;
			y0: number;
			y1: number;
			value: number;
			year: number;
		}> = [];

		for (const cat of activeCategories) {
			const value = getValue(row, cat.key, 'added_power_kw');
			if (value > 0) {
				stacks.push({
					category: cat,
					y0,
					y1: y0 + value,
					value,
					year: row.period as number
				});
				y0 += value;
			}
		}
		return { year: row.period as number, total: y0, stacks };
	});

	$: xDomain = data.map((d) => d.period as number);
	$: yMax = Math.max(...stackedData.map((d) => d.total), 1);
	$: unit = getPowerUnit(yMax, 'solar');
	$: yFormat = (v: number) => formatNumber(convertPowerUnit(v, yMax), 0);

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
			x="year"
			y="total"
			xType="band"
			{xDomain}
			{yMax}
			height={280}
			margin={{ top: 15, right: 15, bottom: 35, left: 32 }}
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
				{@const lastYear = xDomain.length > 0 ? xDomain[xDomain.length - 1] : null}
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={String}
					tickCount={Math.ceil(xDomain.length / 3)}
					forceTicks={lastYear ? [lastYear] : []}
				/>
				<RuleY y={0} {yScale} {innerWidth} />

				<!-- Stacked bars -->
				{#each stackedData as yearData}
					{@const barX = xScale(yearData.year)}
					{@const barWidth = xScale.bandwidth ? xScale.bandwidth() : 20}
					{#if barX !== undefined}
						{#each yearData.stacks as stack}
							<rect
								x={barX}
								y={yScale(stack.y1)}
								width={barWidth}
								height={Math.abs(yScale(stack.y0) - yScale(stack.y1))}
								fill={stack.category.color}
								class="transition-opacity"
								opacity={hover.x === yearData.year ? 1 : 0.85}
							/>
						{/each}
					{/if}
				{/each}

				<RuleX {xScale} {innerHeight} {hover} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{@const yearData = stackedData.find((d) => d.year === hover.x)}
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={hover.x !== null ? String(hover.x) : ''}
					items={yearData
						? [
								...yearData.stacks
									.filter((s) => s.value > 0)
									.reverse()
									.map((s) => ({
										label: s.category.label,
										value: formatPower(s.value, 'solar'),
										color: s.category.color
									})),
								...(yearData.total > 0
									? [
											{
												label: 'Gesamt',
												value: formatPower(yearData.total, 'solar')
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
