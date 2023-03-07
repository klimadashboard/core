<script>
	import { scaleLinear } from 'd3-scale';
	import formatNumber from '$lib/stores/formatNumber';
	export let width;
	export let height;
	export let unit;
	export let xAxisValues;
	export let xAxisInterval;
	export let yAxisMax;

	$: yAxisScale = ksgSelection == null ? total1990 * 2 : total1990 * 0.5;

	$: yScale = scaleLinear().domain([0, yAxisMax]).range([0, height]);
</script>

<g class="chart-y-axis">
	{#each yScale.ticks(6) as tick, index}
		{@const tickLabel =
			tick > 999999
				? `${formatNumber(Math.round((tick / 1000000) * 100) / 100)} Mio`
				: formatNumber(tick)}
		<g transform={`translate(0, ${yScale(tick)})`} class="text-gray-500">
			<line x1="0" x2={width} y1="0" y2="0" stroke-width="1" class="stroke-current opacity-30" />
			<text class="text-xs fill-current bg-white" x="2" y="-3"
				>{tickLabel}
				<tspan dx="2">{index == yScale.ticks(6).length - 1 ? unit : ''}</tspan></text
			>
		</g>
	{/each}
</g>
<g class="chart-x-axis">
	{#each xAxisValues as year, i}
		{@const x = 15 + i * 30}
		<text x={14 + x} y={height - 20} font-size="10" text-anchor="middle"><tspan>{year}</tspan></text
		>
	{/each}
</g>
