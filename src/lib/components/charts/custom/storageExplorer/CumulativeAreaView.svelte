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
	$: metricField = getMetricField('cumulative', metricMode);

	// Build stacked area data with numeric x values for linear scale
	$: stackedSeries = (() => {
		const series: Array<{
			category: StorageCategory;
			points: Array<{ xNum: number; period: number | string; y0: number; y1: number; value: number }>;
		}> = activeCategories.map((cat) => ({ category: cat, points: [] }));

		for (const row of data) {
			let y0 = 0;
			const xNum = periodToNumber(row.period);
			for (let i = 0; i < activeCategories.length; i++) {
				const cat = activeCategories[i]!;
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
			for (const cat of activeCategories) {
				total += getValue(row, cat.key, metricField);
			}
			if (total > max) max = total;
		}
		return max;
	})();

	$: unit = metricMode === 'power' ? getPowerUnit(yMax, 'solar') : '';
	$: divisor = yMax >= 1_000_000 ? 1_000_000 : yMax >= 1_000 ? 1_000 : 1;
	$: yFormat = (v: number) => formatNumber(v, 0);

	$: lateRegistrationXNum =
		data.length > LATE_REGISTRATION_MONTHS
			? periodToNumber(data[data.length - LATE_REGISTRATION_MONTHS].period)
			: null;

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
				{@const lastXNum =
					data.length > 0 ? periodToNumber(data[data.length - 1]?.period) : null}
				<AxisX
					{xScale}
					xDomain={[]}
					{innerWidth}
					{innerHeight}
					format={(v) => {
						const d = new Date(v);
						const monthNames = ['Jan', 'Apr', 'Jul', 'Okt'];
						const m = d.getMonth();
						if (m === 0) return String(d.getFullYear());
						if (monthNames[Math.floor(m / 3)] && m % 3 === 0)
							return monthNames[Math.floor(m / 3)];
						return '';
					}}
					tickCount={10}
					forceTicks={lastXNum ? [lastXNum] : []}
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
						? activeCategories
								.map((cat) => {
									const value = getValue(closestRow, cat.key, metricField);
									if (value === 0) return null;
									return {
										label: cat.label,
										value: metricMode === 'power'
											? formatPower(value, 'solar')
											: formatNumber(value, 0),
										color: cat.color
									};
								})
								.filter(Boolean)
								.reverse()
						: []}
					{@const total = closestRow
						? activeCategories.reduce(
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
									? formatPower(total, 'solar')
									: formatNumber(total, 0) }]
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
