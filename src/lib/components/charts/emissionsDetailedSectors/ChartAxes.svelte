<script>
	import { scaleLinear } from 'd3-scale';
	import formatNumber from '$lib/stores/formatNumber';
	export let width;
	export let height;
	export let baseline;
	export let startline;
	export let dx;
	export let unit;
	export let xAxisValues;
	// export let xAxisInterval;
	export let yAxisMax;

	$: skipCount = Math.ceil(xAxisValues.length / ((width - startline) / 50));

	$: yScale = scaleLinear()
		.domain([0, yAxisMax])
		.range([5, baseline - 20]);
</script>

<g class="chart-y-axis pointer-events-none">
	{#each yScale.ticks(6) as tick, index}
		{@const tickLabel =
			tick > 999999
				? `${formatNumber(Math.round((tick / 1000000) * 100) / 100)} Mio`
				: formatNumber(tick)}
		<g transform={`translate(0, ${baseline - yScale(tick)})`} class="text-gray-500">
			<line x1="0" x2={width} y1="0" y2="0" stroke-width="2" class="stroke-current opacity-30" />
			<text class="text-xs fill-current bg-white" x="15" y="-3"
				>{tickLabel}
				<tspan dx="2">{index == yScale.ticks(6).length - 1 ? unit : ''}</tspan></text
			>
		</g>
	{/each}
</g>
<g class="chart-x-axis">
	{#each xAxisValues as year, i}
		{@const x = startline + i * dx}
		{#if (xAxisValues.length - 1 - i) % skipCount == 0}
			<text {x} y={baseline + 20} font-size="15" text-anchor="middle"><tspan>{year}</tspan></text>
		{/if}
	{/each}
</g>
