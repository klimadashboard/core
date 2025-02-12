<script>
	import { bisector } from 'd3-array';
	import { getScale } from '$lib/utils/scales.js';
	import { formatLabel } from '$lib/utils/format.js';

	export let chartWidth;
	export let chartHeight;
	export let data;
	export let options;

	// Reference to the chart container element.
	let chartContainer;

	// Compute scales based on data.
	$: xScale = getScale(data, 'x', [0, chartWidth - options.margin.left - options.margin.right]);
	$: yScale = getScale(
		data.flatMap((d) => d.layers),
		'y',
		[chartHeight, 0]
	);

	// Initialize state variables.
	let selectedDataPoint = null;
	let tooltipX = 0;
	let tooltipY = 0;

	// Helper: normalize x values to numbers (e.g. timestamps for dates).
	const convertX = (value) => {
		if (value instanceof Date) {
			return value.getTime();
		} else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
			return new Date(value).getTime();
		}
		return +value;
	};

	// Create a bisector based on our conversion helper.
	const bisectX = bisector((d) => convertX(d.x)).left;

	// Handler for both mouse and touch events.
	function processTooltip(event) {
		// Prevent default (especially for touch events).
		event.preventDefault();

		// Get the client coordinates depending on whether it’s a mouse or touch event.
		let clientX, clientY;
		if (event.touches && event.touches.length > 0) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else {
			clientX = event.clientX;
			clientY = event.clientY;
		}

		// Get the bounding rectangle of the chart container.
		const rect = chartContainer.getBoundingClientRect();

		// Calculate coordinates relative to the inner drawing area.
		const mouseX = clientX - rect.left - options.margin.left;
		const mouseY = clientY - rect.top - options.margin.top;

		if (data.length > 0) {
			// Use the scale’s invert method to map the mouse position back to a data value.
			const mouseValue = xScale.invert(mouseX);
			const comparableMouseValue = convertX(mouseValue);

			// Find the closest data point.
			const index = bisectX(data, comparableMouseValue);
			const nearestPoint = data[Math.max(0, Math.min(index, data.length - 1))];

			// Update state.
			selectedDataPoint = nearestPoint;
			tooltipX = xScale(nearestPoint.x);
			tooltipY = mouseY;
		}
	}
</script>

<!-- Bind the outer container so we can compute its bounding rect -->
<div bind:this={chartContainer} class="absolute inset-0 h-full w-full">
	<svg width="100%" height="100%">
		<g transform="translate({options.margin.left}, {options.margin.top})">
			<!-- Interaction area: supports mouse and touch events -->
			<rect
				x={0}
				y={0}
				width={chartWidth}
				height={chartHeight}
				on:mousemove={processTooltip}
				on:touchmove|preventDefault={processTooltip}
				on:touchstart|preventDefault={processTooltip}
				on:mouseleave={() => (selectedDataPoint = null)}
				on:touchend={() => (selectedDataPoint = null)}
				on:touchcancel={() => (selectedDataPoint = null)}
				class="fill-transparent cursor-crosshair"
			/>

			{#if selectedDataPoint}
				<!-- Vertical line indicating the selected data point -->
				<line
					x1={xScale(selectedDataPoint.x)}
					x2={xScale(selectedDataPoint.x)}
					y1={0}
					y2={chartHeight}
					class="stroke-current stroke-2 opacity-50"
				/>
				<!-- A circle for each layer at the tooltip's x position -->
				{#each selectedDataPoint.layers as layer}
					<circle cx={tooltipX} cy={yScale(layer.y)} r="5" class="fill-current stroke-white" />
				{/each}
			{/if}
		</g>
	</svg>

	{#if selectedDataPoint}
		<!-- Tooltip box:
		     Note the added "pointer-events: none;" in the inline style so that it doesn't capture mouse events -->
		<div
			class="absolute bg-gray-100 dark:bg-gray-900 p-2 rounded-sm leading-tight"
			style="left: {tooltipX}px; top: {tooltipY}px; transform: translateX(10px); pointer-events: none;"
		>
			<p class="font-semibold">{formatLabel(selectedDataPoint.x)}</p>
			{#each selectedDataPoint.layers as layer}
				<div class="flex items-center gap-1">
					<div class="w-2 h-2 rounded-full" style="background: {layer.color}"></div>
					<p>
						{layer.label}: {formatLabel(layer.y)}{layer.unit}
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
