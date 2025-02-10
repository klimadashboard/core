<script>
	import { bisector } from 'd3-array';
	import { getScale } from '$lib/utils/scales.js';

	export let chartWidth;
	export let chartHeight;
	export let data;
	export let options;

	// Compute scales based on data
	$: xScale = getScale(data, 'x', [0, chartWidth - options.margin.left - options.margin.right]);
	$: yScale = getScale(
		data.flatMap((d) => d.layers),
		'y',
		[chartHeight, 0]
	);

	// Initialize state variables
	let selectedDataPoint = null;
	let x = 0;
	let y = 0;

	// Helper function to normalize x values to numbers (timestamps for dates)
	const convertX = (value) => {
		if (value instanceof Date) {
			return value.getTime();
		} else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
			return new Date(value).getTime();
		}
		return +value;
	};

	// Create bisector using the conversion helper
	const bisectX = bisector((d) => convertX(d.x)).left;

	function processTooltip(event) {
		const mouseX = event.layerX - options.margin.left;
		const mouseY = event.layerY - options.margin.top;

		// Find the closest data point using bisector
		if (data.length > 0) {
			const mouseValue = xScale.invert(mouseX);
			const comparableMouseValue = convertX(mouseValue);

			const index = bisectX(data, comparableMouseValue);
			const nearestPoint = data[Math.max(0, Math.min(index, data.length - 1))];

			// Update selected data point and coordinates
			selectedDataPoint = nearestPoint;
			x = xScale(nearestPoint.x);
			y = mouseY;
		}
	}
</script>

<div class="absolute inset-0 h-full w-full">
	<svg width="100%" height="100%">
		<g transform="translate({options.margin.left}, {options.margin.top})">
			<!-- Mouse interaction area -->
			<rect
				x={0}
				y={0}
				width={chartWidth}
				height={chartHeight}
				on:mousemove={processTooltip}
				on:mouseover={processTooltip}
				on:mouseleave={() => (selectedDataPoint = null)}
				class="fill-transparent cursor-crosshair"
			/>

			{#if selectedDataPoint}
				<!-- Circles for each layer -->
				{#each selectedDataPoint.layers as layer}
					<circle cx={x} cy={yScale(layer.y)} r="5" class="fill-blue-500 stroke-white" />
				{/each}
			{/if}
		</g>
	</svg>

	{#if selectedDataPoint}
		<!-- Tooltip box -->
		<div
			class="absolute bg-gray-100 dark:bg-gray-900 p-2 rounded-sm shadow-lg"
			style="left: {x}px; top: {y}px; transform: translateX(10px);"
		>
			<p class="font-semibold">X: {selectedDataPoint.x}</p>
			{#each selectedDataPoint.layers as layer}
				<p>{layer.label}: {layer.y}</p>
			{/each}
		</div>
	{/if}
</div>
