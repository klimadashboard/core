<script>
	import { line, area } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let data;

	let chartWidth;
	let chartHeight;

	$: xScale = scaleLinear()
		.domain([min(data, (d) => d.x), max(data, (d) => d.x)])
		.range([0, chartWidth]);

	$: yScale = scaleLinear()
		.domain([min(data, (d) => d.y), max(data, (d) => d.y)])
		.range([chartHeight - 12, 0]);

	$: generateLine = (data) => {
		return line()
			.x((d) => xScale(d.x))
			.y((d) => yScale(d.y))(data);
	};

	$: generateArea = (data) => {
		return area()
			.x((d) => xScale(d.x))
			.y0(chartHeight) // Baseline for the area
			.y1((d) => yScale(d.y))(data);
	};
</script>

<div class="w-full h-full relative" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if chartWidth && chartHeight}
		<svg width={chartWidth} height={chartHeight} class="overflow-visible">
			<g>
				<path d={generateArea(data)} class="fill-current stroke-current opacity-20" />
				<path d={generateLine(data)} class="fill-none stroke-current stroke-2" />
				<circle
					cx={xScale(data[data.length - 1].x)}
					cy={yScale(data[data.length - 1].y)}
					r="4"
					class="fill-current"
				/>
			</g>
		</svg>
	{/if}
	<div class="absolute left-0 bottom-0 right-0 h-4 bg-gradient-to-b from-transparent to-white" />
</div>
