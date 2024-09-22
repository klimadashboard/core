<script>
	import { scaleLinear } from 'd3-scale';
	import { max, min } from 'd3-array';
	import { onMount } from 'svelte';
	import formatNumber from '$lib/stores/formatNumber';

	export let historicalAverages = [];
	export let recentData = [];
	export let selectedStation;

	$: selectedDatapoint = recentData[recentData.length - 1];

	const margin = { left: 50, right: 15, top: 10, bottom: 10 };
	$: barWidth = Math.max(5, wrapperWidth / recentData.length - 1);
	$: chartWidth = barWidth * recentData.length + margin.left + margin.right;

	let wrapperWidth;
	let chartHeight;

	// Set up scales for the x, y, and bar width dimensions
	$: xScale = scaleLinear()
		.domain([0, recentData.length - 1])
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
			.domain([-6, -3, 0, 3, 6]) // Adjust the domain for expected values
			.range(['#071B3A', '#08306b', '#fff', '#67000d', '#42061C']); // Blue to white to red gradient
		return colorScale(value);
	};

	let container;

	onMount(() => {
		// Wait for the DOM to be updated
		requestAnimationFrame(() => {
			if (container) {
				container.scrollTo({
					left: container.scrollWidth,
					behavior: 'smooth'
				});
			}
		});
	});
</script>

<h2 class="text-2xl mt-4">
	{#if selectedDatapoint}
		In {selectedStation.name}
		{#if selectedDatapoint.isOngoing}
			ist es bisher
		{:else}
			war es
		{/if}
		im {selectedDatapoint.selectedResolution == 'years' ? 'Jahr' : ''}
		<span class="font-bold">{selectedDatapoint.period}</span>

		<span
			class="underline underline-offset-4 font-bold"
			style="text-decoration-color: {getColor(selectedDatapoint.differenceFromHistorical)}"
			>{formatNumber(selectedDatapoint.differenceFromHistorical).replace('-', '')}°C
			{selectedDatapoint.differenceFromHistorical > 0 ? 'heißer' : 'kälter'}</span
		>
		als der historische Durchschnitt.
	{/if}
</h2>

<div class="h-80 mt-4 relative" bind:clientHeight={chartHeight} bind:clientWidth={wrapperWidth}>
	<div class="overflow-x-scroll h-full relative w-full" bind:this={container}>
		{#if chartWidth && chartHeight && recentData.length > 0}
			<svg width={chartWidth} height={'100%'}>
				{#each yScale.ticks(5) as tick}
					<g transform="translate(0,{yScale(tick)})">
						<line x1={0} x2={chartWidth} class="stroke-gray-200" />
					</g>
				{/each}
				<!-- X-Axis with ticks -->
				<g>
					{#each xScale.ticks(recentData.length / 50) as tick}
						<g transform="translate({xScale(tick)},{10})">
							<text class="text-xs fill-gray-600" text-anchor="middle">
								{recentData[tick]?.period}
							</text>
						</g>
					{/each}
				</g>

				<!-- Bars representing data -->
				{#each recentData as datapoint, i}
					<g
						transform="translate({xScale(i)},0)"
						style="color: {getColor(datapoint.differenceFromHistorical)}"
					>
						<rect
							width={barWidth}
							height={Math.abs(yScale(0) - yScale(datapoint.differenceFromHistorical))}
							y={datapoint.differenceFromHistorical > 0
								? yScale(datapoint.differenceFromHistorical)
								: yScale(0)}
							class={datapoint.isOngoing ? 'fill-white stroke-1 stroke-current' : 'fill-current'}
						/>
						<rect
							class="fill-transparent"
							width={barWidth}
							height={chartHeight}
							on:mouseover={() => (selectedDatapoint = datapoint)}
							on:focus={() => (selectedDatapoint = datapoint)}
						/>
					</g>
				{/each}
				<g style="color: {getColor(selectedDatapoint.differenceFromHistorical)}">
					<line
						x1={xScale(recentData.indexOf(selectedDatapoint)) + barWidth / 2}
						x2={xScale(recentData.indexOf(selectedDatapoint)) + barWidth / 2}
						y1={20}
						y2={innerHeight}
						class="stroke-current stroke-2 opacity-70"
						stroke-dasharray="5, 2, 10, 2"
					/>
				</g>
			</svg>
		{/if}
	</div>
	<div
		class="absolute w-32 pointer-events-none left-0 top-0 bottom-0 bg-gradient-to-r from-white to-transparent"
	/>
	<svg width={50} height={'100%'} class="absolute left-0 top-0 pointer-events-none">
		<!-- Y-Axis with ticks -->
		<g>
			{#each yScale.ticks(5) as tick}
				<g transform="translate(0,{yScale(tick)})">
					<text y={-5} class="text-xs fill-gray-600">
						{#if tick == 0}
							Ø
						{:else}
							{tick > 0 ? '+' : ''}
							{tick}°C
						{/if}
					</text>
				</g>
			{/each}
		</g>
	</svg>
</div>
