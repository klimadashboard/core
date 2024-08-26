<script>
	import { scaleLinear } from 'd3-scale';

	export let historicalAverages;
	export let recentData;

	let chartWidth;
	let chartHeight;

	$: xScale = scaleLinear().domain([0, recentData.length]).range([0, chartWidth]);
	$: yScale = scaleLinear().domain([5, -5]).range([0, chartHeight]);
	$: barWidth = chartWidth / recentData.length - 20;
</script>

<div class="h-80 mt-4" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if chartWidth && chartHeight}
		<svg width={'100%'} height={'100%'}>
			{#each recentData as datapoint, i}
				<g transform="translate({xScale(i)},0)">
					<line x1={0} x2={barWidth} y1={yScale(0)} y2={yScale(0)} class="stroke-black" />
					<text
						x={barWidth / 2}
						y={yScale(0) + 10}
						class="fill-gray-700 text-sm"
						text-anchor="middle"
						dominant-baseline="hanging">{datapoint.period}</text
					>
					<rect x={0} y={yScale(0)} height={100} width={barWidth} class="fill-black" />
				</g>
			{/each}
		</svg>
	{/if}
</div>
