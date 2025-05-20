<script lang="ts">
	type BoxPlotData = {
		q90: number;
		q50: number;
		q10: number;
		delta: number;
	};

	let {
		data,
		tint = 'gray',
		...attributes
	}: { data: { current: number } & Record<string, BoxPlotData>; tint: string } = $props();

	let chartHeight = $state(0);
	let chartWidth = $state(0);
	import { scaleLinear } from 'd3-scale';
	import formatNumber from '$lib/stores/formatNumber';
	import RoundedRect from './RoundedRect.svelte';
	import Gradient from './Gradient.svelte';

	// let convertedMax = $derived(() => data ? max(data) : 0);
	let axisWidth = 40;
	let paddingTop = 20;
	let paddingBottom = 20;

	let innerChartHeight = $derived(chartHeight - paddingTop - paddingBottom);
	let innerChartWidth = $derived(chartWidth - axisWidth);

	let maxDays = $derived(
		Math.max(
			...Object.entries(data)
				.filter(([key]) => key != 'current')
				.map(([key, value]) => (value as BoxPlotData).q90),
			10
		)
	);
	let yScale = $derived(scaleLinear().domain([0, maxDays]).range([innerChartHeight, 0]));

	let warmingLevels = $derived(
		Object.entries(data)
			.filter(([key]) => key != 'current')
			.map(([key, value]) => ({ label: key, ...(value as BoxPlotData) }))
	);

	let current = $derived(data.current);

	let columnWidth = $derived(innerChartWidth / warmingLevels.length);
	let columnPadding = 10;

	let boxWidth = $derived(Math.min(80, columnWidth - columnPadding * 2));

	$effect(() => {
		console.log('aaaa', yScale.ticks(), yScale(10), innerChartHeight);
		console.log(warmingLevels);
	});
</script>

<svg
	class="h-100"
	width="100%"
	bind:clientWidth={chartWidth}
	bind:clientHeight={chartHeight}
	{...attributes}
>
	<g style:color={tint}>
		<Gradient direction="top" id="box-plot-gradient-top" fromOpacity="0.4" toOpacity="0.15" />
		<Gradient direction="bottom" id="box-plot-gradient-bottom" fromOpacity="0.4" toOpacity="0.15" />
	</g>
	<!-- y-axis -->
	<g transform="translate(0,{paddingTop})">
		{#each yScale.ticks() as tick}
			<g transform="translate(0,{yScale(tick)})" class="text-xs opacity-70">
				<line x1={axisWidth} x2={chartWidth} y1="0" y2="0" class="stroke-current opacity-20" />
				<text x="" text-anchor="start" dominant-baseline="middle" class="fill-current">
					{formatNumber(tick)}
					<!-- {#if tick === yScale.ticks().at(-1)}{powerUnit}{/if} -->
				</text>
			</g>
		{/each}
	</g>

	<!-- boxes -->
	<g transform="translate({axisWidth},{paddingTop})">
		{#each warmingLevels as warmingLevel, index}
			<g transform="translate({columnWidth * index + (columnWidth - boxWidth) / 2},0)">
				<text
					class="text-xs opacity-70"
					fill="currentColor"
					transform="translate({boxWidth / 2},{innerChartHeight + paddingBottom})"
					text-anchor="middle">{warmingLevel.label}</text
				>
				{#if warmingLevel.q10 != null && warmingLevel.q90 != null}
					<RoundedRect
						fill="url(#box-plot-gradient-top)"
						x={0}
						y={yScale(warmingLevel.q90)}
						height={yScale(warmingLevel.q50) - yScale(warmingLevel.q90)}
						width={boxWidth}
						corners={[5, 5, 0, 0]}
					/>
					<RoundedRect
						fill="url(#box-plot-gradient-bottom)"
						x={0}
						y={yScale(warmingLevel.q50)}
						height={yScale(warmingLevel.q10) - yScale(warmingLevel.q50)}
						width={boxWidth}
						corners={[0, 0, 5, 5]}
					/>

					<line transform="translate(0,{yScale(warmingLevel.q50)})" stroke={tint} x2={boxWidth} />
				{/if}
			</g>
		{/each}
	</g>

	<!-- reference -->
	{#if current != null}
		<g transform="translate(0,{paddingTop})">
			<g transform="translate(0,{yScale(current)})">
				<line stroke="blue" stroke-dasharray="8,4" x2={chartWidth} />
				<text class="text-xs" y="12" fill="blue">Heute {formatNumber(current)}</text>
			</g>
		</g>
	{/if}
</svg>

<style>
</style>
