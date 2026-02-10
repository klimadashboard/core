<!-- $lib/components/charts/custom/storageExplorer/CumulativeAreaView.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
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

	// Build stacked area data
	$: stackedSeries = (() => {
		const series: Array<{
			category: StorageCategory;
			points: Array<{ year: number; y0: number; y1: number; value: number }>;
		}> = activeCategories.map((cat) => ({ category: cat, points: [] }));

		for (const row of data) {
			let y0 = 0;
			for (let i = 0; i < activeCategories.length; i++) {
				const cat = activeCategories[i]!;
				const value = getValue(row, cat.key, 'cumulative_power_kw');
				series[i]!.points.push({
					year: row.period as number,
					y0,
					y1: y0 + value,
					value
				});
				y0 += value;
			}
		}

		return series;
	})();

	$: yMax = (() => {
		let max = 1;
		for (const row of data) {
			let total = 0;
			for (const cat of activeCategories) {
				total += getValue(row, cat.key, 'cumulative_power_kw');
			}
			if (total > max) max = total;
		}
		return max;
	})();

	$: unit = getPowerUnit(yMax, 'solar');
	$: divisor = yMax >= 1_000_000 ? 1_000_000 : yMax >= 1_000 ? 1_000 : 1;
	$: yFormat = (v: number) => formatNumber(v, 0);

	// Generate area path from stacked points
	function areaPath(
		points: Array<{ year: number; y0: number; y1: number }>,
		xScale: any,
		yScale: any
	): string {
		if (points.length === 0) return '';

		// Upper line (y1, left to right)
		let d = `M ${xScale(points[0]!.year)} ${yScale(points[0]!.y1 / divisor)}`;
		for (let i = 1; i < points.length; i++) {
			d += ` L ${xScale(points[i]!.year)} ${yScale(points[i]!.y1 / divisor)}`;
		}

		// Lower line (y0, right to left)
		for (let i = points.length - 1; i >= 0; i--) {
			d += ` L ${xScale(points[i]!.year)} ${yScale(points[i]!.y0 / divisor)}`;
		}

		d += ' Z';
		return d;
	}

	$: if (!dataLoading && data.length > 0) {
		const chartData = buildChartData(data, region, activeCategories, updateDate, 'cumulative');
		onChartData?.(chartData);
	} else if (!dataLoading && data.length === 0) {
		onChartData?.(null);
	}
</script>

<div bind:this={containerEl} class="cumulative-area-view">
	{#if dataLoading || regionLoading}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if data.length === 0}
		<div class="h-72 flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<Chart
			data={data.map((d) => ({ year: d.period, value: 0 }))}
			x="year"
			y="value"
			xType="linear"
			yMax={yMax / divisor}
			height={280}
			margin={{ top: 10, right: 20, bottom: 40, left: 32 }}
		>
			<svelte:fragment
				slot="default"
				let:xScale
				let:yScale
				let:innerWidth
				let:innerHeight
				let:hover
			>
				<AxisY {yScale} {innerWidth} {innerHeight} format={yFormat} {unit} />
				{@const lastYear = data.length > 0 ? data[data.length - 1]?.period : null}
				<AxisX
					{xScale}
					xDomain={[]}
					{innerWidth}
					{innerHeight}
					format={(v) => String(Math.round(v))}
					tickCount={10}
					forceTicks={lastYear ? [lastYear] : []}
				/>

				<!-- Stacked areas (render bottom-up, so first category is at bottom) -->
				{#each stackedSeries as series}
					<path
						d={areaPath(series.points, xScale, yScale)}
						fill={series.category.color}
						opacity="0.75"
					/>
				{/each}

				<!-- Upper edge lines -->
				{#each stackedSeries as series}
					{@const pts = series.points}
					{#if pts.length > 1}
						<path
							d={`M ${pts.map((p) => `${xScale(p.year)} ${yScale(p.y1 / divisor)}`).join(' L ')}`}
							fill="none"
							stroke={series.category.color}
							stroke-width="1.5"
						/>
					{/if}
				{/each}
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const year = Math.round(hover.x)}
					{@const row = data.find((d) => d.period === year)}
					{@const items = row
						? activeCategories
								.map((cat) => {
									const value = getValue(row, cat.key, 'cumulative_power_kw');
									if (value === 0) return null;
									return {
										label: cat.label,
										value: formatPower(value, 'solar'),
										color: cat.color
									};
								})
								.filter(Boolean)
								.reverse()
						: []}
					{@const total = row
						? activeCategories.reduce(
								(sum, cat) => sum + getValue(row, cat.key, 'cumulative_power_kw'),
								0
							)
						: 0}
					<Tooltip
						visible={true}
						x={hover.clientX}
						y={hover.clientY}
						title={String(year)}
						items={[
							...items,
							...(total > 0
								? [{ label: 'Gesamt', value: formatPower(total, 'solar') }]
								: [])
						]}
						container={containerEl}
					/>
				{/if}
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
