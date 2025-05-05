<script>
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import formatNumber from '$lib/stores/formatNumber';

	export let data; // expects the whole API result
	export let colors;

	let chartHeight;
	let chartWidth;
	let selectedVariable = 'net_power_kw';

	let margin = { top: 0, right: 30, bottom: 20, left: 50 };

	$: console.log(data);

	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: barWidth =
		chartWidth > 600 ? innerChartWidth / data.length - 5 : innerChartWidth / data.length - 2;

	$: yScale = scaleLinear()
		.domain([0, max(data, (d) => d[selectedVariable])])
		.range([innerChartHeight, 0]);

	$: xScale = scaleLinear()
		.domain([data[0]?.year || 2000, data[data.length - 1]?.year])
		.range([margin.left, chartWidth - margin.right]);
</script>

{#if data.length > 0}
	<div
		class="flex gap-2 items-end h-64"
		style="color: {colors[1]}"
		bind:clientHeight={chartHeight}
		bind:clientWidth={chartWidth}
	>
		<svg width="100%" height="100%">
			<g>
				{#each xScale.ticks(chartWidth > 600 ? 10 : 5) as year}
					<g
						transform="translate({xScale(year) + barWidth / 2},{chartHeight})"
						class="text-xs opacity-70"
					>
						<text text-anchor="middle">{year}</text>
						<line x1={0} x2={0} y1={-20} y2={-12} stroke="currentColor" />
					</g>
				{/each}
			</g>
			<g>
				{#each yScale.ticks() as tick}
					<g transform="translate(0,{yScale(tick)})" class="text-xs opacity-70">
						<line x1="40" x2={chartWidth} y1="0" y2="0" class="stroke-current opacity-20" />
						<text dominant-baseline="middle">{formatNumber(tick)}</text>
					</g>
				{/each}
			</g>
			<!-- bars -->
			<g>
				{#each data as item}
					<rect
						x={xScale(item.year)}
						y={yScale(item[selectedVariable])}
						width={barWidth}
						height={innerChartHeight - yScale(item[selectedVariable])}
						fill={colors[1]}
					/>
				{/each}
			</g>
		</svg>
	</div>
{/if}
