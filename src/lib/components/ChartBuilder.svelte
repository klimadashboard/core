<script>
	import { scaleLinear } from 'd3-scale';
	import { line, curveBasis } from 'd3-shape';
	export let config;
	export let layers;

	let chartWidth;
	let chartHeight;
	let margin = { left: 50, top: 0, right: 10, bottom: 20 };
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	// Calculate the maximum x value across all layers
	$: maxX =
		layers.length > 0 ? Math.max(...layers.flatMap((layer) => layer.data.map((d) => d.x))) : 0;

	$: xScale = scaleLinear()
		.domain([0, maxX]) // Use the calculated maxX
		.range([0, innerChartWidth]);

	// Create a separate yScale for each layer
	$: yScales = layers.map((layer) => {
		const yValues = layer.data.map((d) => d.y);
		const minY = yValues.length > 0 ? Math.min(...yValues) : 0;
		const maxY = yValues.length > 0 ? Math.max(...yValues) : 100; // Default maxY to 100 if no data
		return scaleLinear()
			.domain([minY, maxY * 1.1])
			.range([innerChartHeight, 0]);
	});

	// Define the line generator using individual yScales
	$: lineGenerators = layers.map((layer, index) => {
		if (layer.type === 'line') {
			return line()
				.curve(curveBasis)
				.x((d) => xScale(d.x))
				.y((d) => yScales[index](d.y));
		}
		return null;
	});

	let selectedIndex;
</script>

<div class="flex items-center gap-2">
	{#each layers as layer}
		<div class="flex items-center gap-1">
			<div class="w-3 h-3" style="background: {layer.color}" />
			<p>{layer.label}</p>
			<p>{layer.data[selectedIndex]?.y} {layer.unit}</p>
		</div>
	{/each}
</div>
<div class="h-full min-h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if chartWidth && chartHeight}
		<svg width={chartWidth} height={chartHeight}>
			<!-- axis (optional: customize if needed) -->
			<g class="text-sm font-medium text-gray-700">
				<g>
					{#each xScale.ticks() as tick}
						<g transform={`translate(${xScale(tick)}, ${chartHeight - margin.bottom})`}>
							<text class="fill-current" dominant-baseline="hanging" y={5} text-anchor="middle"
								>{tick}</text
							>
							<line class="stroke-current" y1={0} y2={4} />
						</g>
					{/each}
				</g>
				<g>
					{#each yScales as yScale, i}
						<g>
							{#each yScale.ticks(5) as tick}
								<g transform={`translate(0, ${yScale(tick)})`} style="color: {layers[i].color}">
									<text class="fill-current" dominant-baseline="middle"
										>{tick} {layers[i].unit}</text
									>
									<line class="stroke-current" x1={margin.left - 2} x2={chartWidth} />
								</g>
							{/each}
						</g>
					{/each}
				</g>
			</g>
			<!-- layers -->
			<g transform="translate({margin.left},{margin.top})">
				{#each layers as layer, index}
					<g>
						{#if layer.type === 'bar'}
							{#each layer.data as d}
								{@const barWidth = chartWidth / layer.data.length - config.barGap}
								<g
									transform="translate({xScale(d.x)},{yScales[index](d.y)})"
									style="color: {d.color ? d.color : layer.color}"
								>
									<rect
										x={-barWidth / 2}
										width={barWidth}
										height={innerChartHeight - yScales[index](d.y)}
										class="fill-current"
									/>
								</g>
							{/each}
						{:else if layer.type === 'line' && lineGenerators[index]}
							<g style="color: {layer.color}">
								<path
									d={lineGenerators[index](layer.data)}
									class="stroke-current stroke-2 fill-none"
								/>
							</g>
						{/if}
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>
