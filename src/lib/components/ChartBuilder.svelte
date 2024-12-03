<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { line, curveBasis } from 'd3-shape'; // Import curveBasis
	export let config;
	export let layers;

	let chartWidth;
	let chartHeight;

	$: maxX = Math.max(...layers.flatMap((layer) => layer.data.map((d) => d.x)));

	$: xScale = scaleLinear().domain([0, maxX]).range([0, chartWidth]);
	$: yScale = scaleLinear().domain([0, 100]).range([chartHeight, 0]);

	// Define the line generator
	$: lineGenerator = line()
		.curve(curveBasis) // Use curve instead of interpolate
		.x((d) => xScale(d.x))
		.y((d) => yScale(d.y));
</script>

<div class="h-full min-h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if chartWidth && chartHeight}
		<svg width={chartWidth} height={chartHeight}>
			<!-- axis -->
			<!-- layers -->
			{#each layers as layer}
				<g>
					{#if layer.type == 'bar'}
						{#each layer.data as d}
							<g
								transform="translate({xScale(d.x)},{yScale(d.y)})"
								style="color: {d.color ? d.color : layer.color}"
							>
								<rect
									width={chartWidth / layer.data.length - config.barGap}
									height={chartHeight - yScale(d.y)}
									class="fill-current"
								/>
							</g>
						{/each}
					{:else if layer.type == 'line'}
						<g style="color: {layer.color}">
							<path d={lineGenerator(layer.data)} class="stroke-current stroke-2 fill-none" />
						</g>
					{/if}
				</g>
			{/each}
		</svg>
	{/if}
</div>
