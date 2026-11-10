<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import { fetchData, buildChartData, type Co2PriceRawData } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let data: Co2PriceRawData[] = [];
	let loading = true;
	let error: string | null = null;
	let containerEl: HTMLElement;
	let containerWidth = 0;

	$: isMobile = containerWidth < 500;
	$: chartMargin = {
		top: 20,
		right: isMobile ? 20 : 30,
		bottom: 40,
		left: isMobile ? 40 : 50
	};

	$: chartData = data.map((d) => ({
		...d,
		timestamp: d.date.getTime()
	}));

	$: yMax = data.length > 0 ? Math.max(...data.map((d) => d.value)) * 1.1 : 100;
	$: xMin = data.length > 0 ? Math.min(...data.map((d) => d.date.getTime())) : Date.now();
	$: xMax = data.length > 0 ? Math.max(...data.map((d) => d.date.getTime())) : Date.now();

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		return date.getFullYear().toString();
	}

	function formatPrice(value: number): string {
		return `${Math.round(value)} €`;
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			const result = await fetchData();
			data = result.data;

			const builtChartData = buildChartData(data, result.updateDate, region);
			onChartData?.(builtChartData);
		} catch (e) {
			console.error('[Co2PriceHistory] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	loadData();
</script>

<div bind:this={containerEl} bind:clientWidth={containerWidth}>
	{#if loading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if data.length === 0}
		<div class="h-[300px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{:else}
		<Chart
			data={chartData}
			x="timestamp"
			y="value"
			xType="linear"
			height={300}
			yMin={0}
			{yMax}
			margin={chartMargin}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:innerWidth let:innerHeight let:hover>
				<AxisY
					{yScale}
					{innerWidth}
					{innerHeight}
					format={formatPrice}
					unit=""
					gridLines={true}
				/>
				<AxisX
					{xScale}
					xDomain={[xMin, xMax]}
					{innerWidth}
					{innerHeight}
					format={formatDate}
					tickCount={6}
				/>

				<Line
					data={chartData}
					x="timestamp"
					y="value"
					{xScale}
					{yScale}
					stroke="#10B981"
					strokeWidth={2}
					curve="monotone"
					fillGradient={true}
					fillOpacity={0.15}
					{hover}
				/>
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const timestamp = hover.x}
					{@const date = new Date(timestamp)}
					{@const point = chartData.find((d) => d.timestamp === timestamp)}

					<Tooltip
						visible={true}
						x={hover.clientX}
						y={hover.clientY}
						title={date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
						items={point
							? [
									{
										label: 'EU ETS',
										value: `${point.value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
										color: '#10B981'
									}
								]
							: []}
						container={containerEl}
					/>
				{/if}
			</svelte:fragment>
		</Chart>
	{/if}
</div>
