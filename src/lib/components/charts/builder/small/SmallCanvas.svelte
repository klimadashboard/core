<script>
	import SmallLine from './SmallLine.svelte';
	import { formatLabel } from '$lib/utils/format';

	export let data;
	export let chart;

	let chartWidth;
	let chartHeight;

	const margin = {
		left: 2,
		right: 40,
		top: 10,
		bottom: 20
	};

	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
</script>

<div class="h-full w-full" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if innerChartWidth > 0 && innerChartHeight > 0}
		<svg class="h-full w-full">
			<g transform="translate({margin.left},{margin.top})">
				{#each chart.layers as layer, i}
					{#if layer.type == 'line'}
						<SmallLine
							data={data.map((d) => {
								return {
									y: d.layers[i].y,
									...d
								};
							})}
							{innerChartWidth}
							{innerChartHeight}
						/>
					{/if}
				{/each}
			</g>
			<!-- yaxis -->
			<g transform="translate({margin.left + innerChartWidth},{margin.top})">
				<line
					x1={0}
					x2={0}
					y1={0}
					y2={innerChartHeight}
					class="stroke-current stroke-2 opacity-50"
				/>
				<g transform="translate(5,0)">
					<text dominant-baseline="hanging" y={4} class="fill-current text-sm">XYZ</text>
					<text y={innerChartHeight} class="fill-current text-sm">0</text>
				</g>
			</g>
			<!-- xaxis -->
			<g transform="translate(0,{margin.top + innerChartHeight})" class="text-sm fill-current">
				<line x1={margin.left} x2={innerChartWidth} class="stroke-current stroke-2 opacity-50" />
				<text dominant-baseline="hanging" y={4}>{formatLabel(data[0].x)}</text>
				<text x={innerChartWidth} text-anchor="end" dominant-baseline="hanging" y={4}
					>{formatLabel(data[data.length - 1].x)}</text
				>
			</g>
		</svg>
	{/if}
</div>
