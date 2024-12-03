<script>
	import { scaleLinear } from 'd3-scale';
	import { line, curveBasis } from 'd3-shape';
	export let config;
	export let layers;

	let chartWidth;
	let chartHeight;

	// Calculate the maximum x value across all layers
	$: maxX =
		layers.length > 0 ? Math.max(...layers.flatMap((layer) => layer.data.map((d) => d.x))) : 0;

	$: xScale = scaleLinear()
		.domain([0, maxX]) // Use the calculated maxX
		.range([0, chartWidth]);

	// Create a separate yScale for each layer
	$: yScales = layers.map((layer) => {
		const yValues = layer.data.map((d) => d.y);
		const minY = yValues.length > 0 ? Math.min(...yValues) : 0;
		const maxY = yValues.length > 0 ? Math.max(...yValues) : 100; // Default maxY to 100 if no data
		return scaleLinear().domain([minY, maxY]).range([chartHeight, 0]);
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
</script>

<div class="h-full min-h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if chartWidth && chartHeight}
		<svg width={chartWidth} height={chartHeight}>
			<!-- axis (optional: customize if needed) -->
			<g>
				{#each yScales as yScale, i}
					<g>
						{#each yScale.ticks(5) as tick}
							<g transform={`translate(0, ${yScale(tick)})`} style="color: {layers[i].color}">
								<text class="fill-current">{tick} {layers[i].unit}</text>
								<line class="stroke-current" x1={0} x2={chartWidth} />
							</g>
						{/each}
					</g>
				{/each}
			</g>
			<!-- layers -->
			{#each layers as layer, index}
				<g>
					{#if layer.type === 'bar'}
						{#each layer.data as d}
							<g
								transform="translate({xScale(d.x)},{yScales[index](d.y)})"
								style="color: {d.color ? d.color : layer.color}"
							>
								<rect
									width={chartWidth / layer.data.length - config.barGap}
									height={chartHeight - yScales[index](d.y)}
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
		</svg>
	{/if}
</div>
