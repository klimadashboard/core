<script>
	import { scaleLinear } from 'd3-scale';
	import { max, min } from 'd3-array';
	import { onMount } from 'svelte';

	export let historicalAverages = [];
	export let recentData = [];

	console.log(recentData);

	let chartWidth;
	let chartHeight;

	const margin = { left: 30, right: 0, top: 0, bottom: 0 };

	// Set up scales for the x, y, and bar width dimensions
	$: xScale = scaleLinear()
		.domain([0, recentData.length])
		.range([margin.left, chartWidth - margin.right]);

	// Ensure the yScale runs from largest positive to largest negative
	$: yScale = scaleLinear()
		.domain([
			max(recentData, (d) => Math.max(d.differenceFromHistorical, 0)) * 1.2, // Largest positive value at the top
			min(recentData, (d) => Math.min(d.differenceFromHistorical, 0)) * 1.2 // Largest negative value at the bottom
		])
		.range([margin.top, chartHeight - margin.bottom]);

	// Correct the warming stripes color scale
	$: getColor = function (value) {
		const colorScale = scaleLinear()
			.domain([-5, 0, 5]) // Adjust the domain for expected values
			.range(['#08306b', '#ffffff', '#67000d']); // Blue to white to red gradient
		return colorScale(value);
	};

	// Tooltip logic
	$: tooltip = false;

	// Adjust barWidth to remove gaps (fit stripes as close as possible)
	$: barWidth = chartWidth / recentData.length;
</script>

<div class="h-80 mt-4 min-w-[1000px]" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if chartWidth && chartHeight && recentData.length > 0}
		<svg width={'100%'} height={'100%'}>
			<!-- Y-Axis with ticks -->
			<g>
				{#each yScale.ticks(5) as tick}
					<g transform="translate(0,{yScale(tick)})">
						<text y={-5} class="text-xs font-bold fill-gray-600">
							{#if tick == 0}
								Ø
							{:else}
								{tick > 0 ? '+' : ''}
								{tick}°C
							{/if}
						</text>
						<line x1={0} x2={chartWidth} class="stroke-gray-200" />
					</g>
				{/each}
			</g>

			<!-- Bars representing data -->
			{#each recentData as datapoint, i}
				<g
					transform="translate({xScale(i)},0)"
					style="color: {getColor(datapoint.differenceFromHistorical)}"
					on:mouseover={() => (tooltip = datapoint)}
					on:focus={() => (tooltip = datapoint)}
					on:mouseout={() => (tooltip = false)}
					on:blur={() => (tooltip = false)}
				>
					<rect
						width={barWidth}
						height={Math.abs(yScale(0) - yScale(datapoint.differenceFromHistorical))}
						y={datapoint.differenceFromHistorical > 0
							? yScale(datapoint.differenceFromHistorical)
							: yScale(0)}
						class="fill-current"
					/>
					{#if tooltip == datapoint}
						<g>
							<rect class="fill-current" width={40} height={40} />
							<text class="fill-white">{datapoint.differenceFromHistorical}°C</text>
						</g>
					{/if}
				</g>
			{/each}
		</svg>
	{/if}
</div>

<style>
	.tooltip {
		background-color: rgba(0, 0, 0, 0.75);
		color: white;
		padding: 8px;
		border-radius: 4px;
		font-size: 0.875rem;
		pointer-events: none;
	}
</style>
