<script>
	import SmallLine from './SmallLine.svelte';
	import { formatLabel } from '$lib/utils/format';

	export let data;
	export let chart;

	let chartWidth;
	let chartHeight;

	const margin = {
		left: 2,
		right: 28,
		top: 10,
		bottom: 20
	};

	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	// Calculate Y scale
	$: yValues = data.flatMap((d) => d.layers.map((layer) => layer.y));
	$: yMin = Math.min(...yValues);
	$: yMax = Math.max(...yValues);

	// Generate tick marks
	$: tickCount = 2; // Adjust number of ticks if needed
	$: yTicks = Array.from(
		{ length: tickCount },
		(_, i) => yMin + ((yMax - yMin) / (tickCount - 1)) * i
	);

	// Function to get y position in SVG coordinates
	function getYPosition(value) {
		return innerChartHeight - ((value - yMin) / (yMax - yMin)) * innerChartHeight;
	}
</script>

<div class="h-full w-full" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if innerChartWidth > 0 && innerChartHeight > 0}
		<svg class="h-full w-full">
			<g transform="translate({margin.left},{margin.top})">
				{#each chart.layers as layer, i}
					{#if layer.type == 'line'}
						<SmallLine
							data={data.map((d) => ({
								y: d.layers[i].y,
								...d
							}))}
							{innerChartWidth}
							{innerChartHeight}
						/>
					{/if}
				{/each}
			</g>

			<!-- Y-axis -->
			<g transform="translate({margin.left + innerChartWidth},{margin.top})">
				<line
					x1={0}
					x2={0}
					y1={0}
					y2={innerChartHeight}
					class="stroke-current stroke-2 opacity-50"
				/>
				<g transform="translate(5,0)">
					{#each yTicks as tick}
						<text y={getYPosition(tick)} dominant-baseline="middle" class="fill-current text-xs"
							>{Math.round(tick)}</text
						>
					{/each}
				</g>
			</g>

			<!-- X-axis -->
			<g transform="translate(0,{margin.top + innerChartHeight})" class="text-xs fill-current">
				<line x1={margin.left} x2={innerChartWidth} class="stroke-current stroke-2 opacity-50" />
				<text dominant-baseline="hanging" y={4}>{formatLabel(data[0].x)}</text>
				<text x={innerChartWidth} text-anchor="end" dominant-baseline="hanging" y={4}>
					{formatLabel(data[data.length - 1].x)}
				</text>
			</g>
		</svg>
	{/if}
</div>
