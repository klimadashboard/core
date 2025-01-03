<script>
	import { line, area } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let data;
	export let dataComparison;
	export let xLabels;

	let chartWidth;
	let chartHeight;

	$: xScale = scaleLinear()
		.domain([min(data, (d) => d.x), max(data, (d) => d.x)])
		.range([0, chartWidth]);

	$: if (dataComparison) {
		xScale = scaleLinear()
			.domain([min(dataComparison, (d) => d.x), max(dataComparison, (d) => d.x)])
			.range([0, chartWidth]);
	}

	$: yScale = scaleLinear()
		.domain([min(data, (d) => d.y), max(data, (d) => d.y)])
		.range([chartHeight - 16, 0]);

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
		<svg width="100%" height="100%" class="overflow-visible">
			<g>
				{#if dataComparison}
					<g>
						<path d={generateArea(dataComparison)} class="fill-current stroke-current opacity-0" />
						<path
							d={generateLine(dataComparison)}
							class="fill-none stroke-current stroke-2 opacity-50"
						/>
					</g>
				{/if}
				<g>
					<path d={generateArea(data)} class="fill-current stroke-current opacity-10" />
					<path d={generateLine(data)} class="fill-none stroke-current stroke-2" />
				</g>

				{#if xLabels}
					<g transform="translate(0,{chartHeight})" class="text-xs">
						<text x={2} y={-4} dominant-baseline="bottom" class="fill-current">{xLabels[0]}</text>
						<text
							x={chartWidth - 2}
							y={-4}
							dominant-baseline="bottom"
							text-anchor="end"
							class="fill-current">{xLabels[1]}</text
						>
					</g>
				{/if}

				<circle
					cx={xScale(data[data.length - 1].x)}
					cy={yScale(data[data.length - 1].y)}
					r="4"
					class="fill-current"
				/>
			</g>
		</svg>
	{/if}
</div>
