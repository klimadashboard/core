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
		getMetricField,
		LATE_REGISTRATION_MONTHS,
		formatNumber,
		formatPeriodLabel,
		periodToNumber,
		type MetricMode,
		type StoragePeriodData,
		type StorageCategory
	} from './config';
	import { formatCapacity } from '$lib/utils/formatters';

	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let data: StoragePeriodData[] = [];
	export let updateDate: string | null = null;
	export let dataLoading: boolean = true;
	export let metricMode: MetricMode = 'power';

	let containerEl: HTMLElement;

	$: activeCategories = getActiveCategories(data);

	let hiddenCategories = new Set<string>();
	let _prevData: StoragePeriodData[] = [];
	$: if (data !== _prevData) { _prevData = data; hiddenCategories = new Set(); }

	$: displayCategories = activeCategories.filter((c) => !hiddenCategories.has(c.key));

	function handleLegendClick(catKey: string) {
		const allKeys = activeCategories.map((c) => c.key);
		const visibleKeys = allKeys.filter((k) => !hiddenCategories.has(k));
		if (visibleKeys.length === allKeys.length) {
			hiddenCategories = new Set(allKeys.filter((k) => k !== catKey));
		} else if (visibleKeys.length === 1 && visibleKeys[0] === catKey) {
			hiddenCategories = new Set();
		} else {
			const next = new Set(hiddenCategories);
			if (next.has(catKey)) {
				next.delete(catKey);
			} else {
				if (visibleKeys.filter((k) => k !== catKey).length === 0) { hiddenCategories = new Set(); return; }
				next.add(catKey);
			}
			hiddenCategories = next;
		}
	}

	$: metricField = getMetricField('cumulative', metricMode);

	// Build stacked area data with numeric x values for linear scale
	$: stackedSeries = (() => {
		const series: Array<{
			category: StorageCategory;
			points: Array<{ xNum: number; period: number | string; y0: number; y1: number; value: number }>;
		}> = displayCategories.map((cat) => ({ category: cat, points: [] }));

		for (const row of data) {
			let y0 = 0;
			const xNum = periodToNumber(row.period);
			for (let i = 0; i < displayCategories.length; i++) {
				const cat = displayCategories[i]!;
				const value = getValue(row, cat.key, metricField);
				series[i]!.points.push({
					xNum,
					period: row.period,
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
			for (const cat of displayCategories) {
				total += getValue(row, cat.key, metricField);
			}
			if (total > max) max = total;
		}
		return max;
	})();

	$: divisor = yMax >= 1_000_000 ? 1_000_000 : yMax >= 5_000 ? 1_000 : 1;
	$: unit = metricMode === 'power'
		? (yMax >= 1_000_000 ? 'GWh' : yMax >= 5_000 ? 'MWh' : 'kWh')
		: divisor >= 1_000_000 ? 'Mio' : divisor >= 1_000 ? 'Tsd' : '';
	$: yFormat = (v: number) => formatNumber(v, v % 1 !== 0 ? 1 : 0);

	$: lateRegistrationXNum =
		data.length > LATE_REGISTRATION_MONTHS
			? periodToNumber(data[data.length - LATE_REGISTRATION_MONTHS].period)
			: null;

	// Explicit year-boundary ticks derived from the actual data, so they always
	// land on January 1st regardless of how the linear scale spaces its auto-ticks.
	$: xAxisTicks = (() => {
		const januaries = data
			.filter((row) => new Date(periodToNumber(row.period)).getMonth() === 0)
			.map((row) => periodToNumber(row.period));
		// Thin to every other year when there are many (avoids overlap on mobile)
		const thinned = januaries.length > 8
			? januaries.filter((_, i) => i % 2 === 0)
			: januaries;
		// Include last data point only when its year isn't already represented by a January tick
		// (avoids overlap on mobile when last point is a few months after the most recent Jan tick)
		const lastRow = data[data.length - 1];
		if (lastRow) {
			const lastXNum = periodToNumber(lastRow.period);
			const lastYear = new Date(lastXNum).getFullYear();
			const lastJanInSameYear = januaries.find((x) => new Date(x).getFullYear() === lastYear);
			if (!lastJanInSameYear) thinned.push(lastXNum);
		}
		return thinned;
	})();

	// Generate area path from stacked points
	function areaPath(
		points: Array<{ xNum: number; y0: number; y1: number }>,
		xScale: any,
		yScale: any
	): string {
		if (points.length === 0) return '';

		// Upper line (y1, left to right)
		let d = `M ${xScale(points[0]!.xNum)} ${yScale(points[0]!.y1 / divisor)}`;
		for (let i = 1; i < points.length; i++) {
			d += ` L ${xScale(points[i]!.xNum)} ${yScale(points[i]!.y1 / divisor)}`;
		}

		// Lower line (y0, right to left)
		for (let i = points.length - 1; i >= 0; i--) {
			d += ` L ${xScale(points[i]!.xNum)} ${yScale(points[i]!.y0 / divisor)}`;
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
			data={data.map((d) => ({ xNum: periodToNumber(d.period), value: 0 }))}
			x="xNum"
			y="value"
			xType="linear"
			yMax={yMax / divisor}
			height={280}
			margin={{ top: 48, right: 20, bottom: 40, left: 32 }}
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
				<AxisX
					{xScale}
					xDomain={[]}
					{innerWidth}
					{innerHeight}
					format={(v) => {
						const d = new Date(v);
						const m = d.getMonth();
						const year = d.getFullYear();
						if (m === 0) return String(year);
						const names = ['','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
						return `${names[m]} '${String(year).slice(2)}`;
					}}
					tickCount={0}
					forceTicks={xAxisTicks}
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
							d={`M ${pts.map((p) => `${xScale(p.xNum)} ${yScale(p.y1 / divisor)}`).join(' L ')}`}
							fill="none"
							stroke={series.category.color}
							stroke-width="1.5"
						/>
					{/if}
				{/each}

				<!-- Late registration overlay -->
				{#if lateRegistrationXNum !== null}
					{@const overlayX = xScale(lateRegistrationXNum) ?? 0}
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

				<!-- Hover indicator: vertical line + circles -->
				{#if hover.x !== null}
					{@const hx = hover.x}
					{@const closestIdx = data.reduce(
						(best, d, i) => {
							const dist = Math.abs(periodToNumber(d.period) - hx);
							return dist < best.dist ? { i, dist } : best;
						},
						{ i: 0, dist: Infinity }
					).i}
					{@const snapX = xScale(periodToNumber(data[closestIdx].period))}
					<line
						x1={snapX}
						x2={snapX}
						y1={0}
						y2={innerHeight}
						stroke="currentColor"
						stroke-width="1"
						stroke-dasharray="4 2"
						opacity="0.4"
						class="text-gray-500 pointer-events-none"
					/>
					{#each stackedSeries as series}
						{@const pt = series.points[closestIdx]}
						{#if pt && pt.value > 0}
							<circle
								cx={snapX}
								cy={yScale(pt.y1 / divisor)}
								r="4"
								fill={series.category.color}
								stroke="white"
								stroke-width="1.5"
								class="pointer-events-none"
							/>
						{/if}
					{/each}
				{/if}
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const hoverX = hover.x}
					{@const closestRow = data.reduce(
						(best, d) => {
							const dist = Math.abs(periodToNumber(d.period) - hoverX);
							return dist < best.dist ? { row: d, dist } : best;
						},
						{ row: data[0], dist: Infinity }
					).row}
					{@const items = closestRow
						? displayCategories
								.map((cat) => {
									const value = getValue(closestRow, cat.key, metricField);
									if (value === 0) return null;
									return {
										label: cat.label,
										value: metricMode === 'power'
											? formatCapacity(value)
											: formatNumber(value, 0),
										color: cat.color
									};
								})
								.filter(Boolean)
								.reverse()
						: []}
					{@const total = closestRow
						? displayCategories.reduce(
								(sum, cat) =>
									sum + getValue(closestRow, cat.key, metricField),
								0
							)
						: 0}
					<Tooltip
						visible={true}
						x={hover.clientX}
						y={hover.clientY}
						title={closestRow ? formatPeriodLabel(closestRow.period) : ''}
						items={[
							...items,
							...(total > 0
								? [{ label: 'Gesamt', value: metricMode === 'power'
									? formatCapacity(total)
									: formatNumber(total, 0) }]
								: [])
						]}
						container={containerEl}
					/>
				{/if}
			</svelte:fragment>
		</Chart>

		<!-- Legend -->
		<div class="flex flex-wrap gap-1 mt-4 text-sm">
			{#each activeCategories as cat}
				{@const isHidden = hiddenCategories.has(cat.key)}
				<button
					class="flex items-center gap-2 px-2 py-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 {isHidden ? 'opacity-40' : ''}"
					onclick={() => handleLegendClick(cat.key)}
				>
					<div class="w-4 h-3 rounded-sm flex-shrink-0" style="background: {cat.color}"></div>
					<span>{cat.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
