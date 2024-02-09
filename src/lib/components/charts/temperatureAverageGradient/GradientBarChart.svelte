<style>
	.hsl-colors {
		color: hsl(216, 86%, 23%);
		color: hsl(208, 69%, 42%);
		color: hsl(204, 54%, 52%);
		color: hsl(202, 57%, 63%);
		color: hsl(201, 53%, 75%);
		color: hsl(209, 56%, 86%);
		color: hsl(209, 61%, 92%);
		color: hsl(19, 96%, 91%);
		color: hsl(17, 94%, 81%);
		color: hsl(14, 96%, 72%);
		color: hsl(11, 96%, 64%);
		color: hsl(5, 86%, 55%);
	}
</style>

<script>
	import { max, min, extent, bisector } from 'd3-array';
	import { scaleLinear, scaleOrdinal } from 'd3-scale';
	import { fade, draw } from 'svelte/transition';

	export let data;
	export let averageTemperature;
	export let radius = 5;
	export let unit = '';
	export let yLabel = '';

	// geometry
	let chartHeight;
	let chartWidth;

	const margin = { top: 10, right: 50, bottom: 10, left: 0 };
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: innerChartWidth = chartWidth - margin.left - margin.right;

	// data
	$: console.log("averageTemperature", averageTemperature)

	// drawing preparation
	const colors = [
		'#08306b',
		'#2171b5',
		'#4292c6',
		'#6baed6',
		'#9ecae1',
		'#c6dbef',
		'#deebf7',
		'#fee0d2',
		'#fcbba1',
		'#fc9272',
		'#fb6a4a',
		'#ef3b2c',
	];

	$: xScale = scaleLinear()
		.rangeRound([0, innerChartWidth])
		.domain([min(data, (d) => d.year), max(data, (d) => d.year)]);

	$: yScale = scaleLinear()
		.rangeRound([innerChartHeight, 0])
		.domain([min(data, (d) => d.averageTemperature), max(data, (d) => d.averageTemperature)]);

	$: colorScale = scaleLinear()
		.range(colors)
		.domain([min(data, (d) => d.averageTemperature), max(data, (d) => d.averageTemperature)]);

	$: path = `M${[...data]
		.splice(30)
		.map((d) => `${xScale(d.year)},${yScale(d.path)}`)
		.join('L')}`;

	$: getColor = function (datapoint) {
		return colorScale(datapoint.averageTemperature);
	};

	$: selectedDatapoint = null;
</script>

<div
	class="relative h-full text-gray-100"
	bind:clientHeight={chartHeight}
	bind:clientWidth={chartWidth}
>
	{#if innerChartWidth && innerChartHeight}
		<svg width={'100%'} height={'100%'}>
			<rect
				class="text-transparent fill-current"
				width={chartWidth}
				height={chartHeight}
				on:mouseover={() => (selectedDatapoint = null)}
			/>

			<g transform={`translate(${margin.left}, ${margin.top})`}>
				{#each xScale.ticks(chartWidth > 1000 ? 10 : 5).slice(0, -1) as tick}
					<g transform={`translate(${xScale(tick)}, ${margin.top})`} class="text-xs text-gray-500">
						<text fill="currentColor">{tick}</text>
					</g>
				{/each}

				{#each yScale.ticks(10).slice(0, -1) as tick}
					<g transform={`translate(0, ${yScale(tick)})`} class="text-xs text-gray-500">
						<text
							fill="currentColor"
							x={margin.left + innerChartWidth + 5}
							dominant-baseline="middle">{tick} {unit}</text
						>
						<line
							x1="0"
							y1="0"
							x2={margin.left + innerChartWidth}
							y2="0"
							stroke="currentColor"
							stroke-width="2"
							stroke-opacity="0.1"
						/>
					</g>
				{/each}
			</g>

			<g
				id="visualisation"
				transform={`translate(${margin.left}, ${margin.top})`}
				class="text-gray-500 "
			>
				{#if path}
					<path d={path} transition:draw />
				{/if}

				{#each data as datapoint, i}
					{@const barOffset = yScale(datapoint.averageTemperature) - yScale(averageTemperature)}
					{@const barHeight = Math.abs(barOffset)}
					{@const barY = barOffset > 0 ? yScale(datapoint.averageTemperature) - barHeight : yScale(datapoint.averageTemperature)}
					<g
						transform={`translate(${xScale(datapoint.year)}, ${barY})`}
						in:fade={{ delay: i * 10 }}
						class=""
					>
						{#if i == data.length - 1}
							<circle cx={radius / 2} cy={radius / 2} r={radius} fill={getColor(datapoint)}>
								<animate
									attributeName="r"
									from={radius}
									to={radius * 2}
									dur="1.5s"
									begin="0s"
									repeatCount="indefinite"
								/>
								<animate
									attributeName="opacity"
									from="1"
									to="0.5"
									dur="1.5s"
									begin="0s"
									repeatCount="indefinite"
								/>
							</circle>
						{/if}
						<rect width={radius} height={barHeight} fill={getColor(datapoint)} class="cursor-help"
						on:mouseover={() => (selectedDatapoint = datapoint)}></rect>
					</g>
				{/each}

				{#if selectedDatapoint}
					<g
						transform="translate({xScale(selectedDatapoint.year) > chartWidth - 300
							? xScale(selectedDatapoint.year) - 280 + radius * 2
							: xScale(selectedDatapoint.year) - radius},{yScale(selectedDatapoint.averageTemperature) + radius})"
						class="text-white text-sm uppercase cursor-help"
						transition:fade
					>
						<rect
							fill={getColor(selectedDatapoint)}
							x="0"
							y={-2.5 * radius}
							width="280"
							rx={radius * 2}
							height={radius * 4}
						/>
						<text x="10" y="-1" fill="currentColor" class="font-thin" dominant-baseline="middle"
							>{selectedDatapoint.year}</text
						>
						<text x="45" y="-1" fill="currentColor" dominant-baseline="middle"
							>{selectedDatapoint.averageTemperature}{unit}</text
						>
						<text x="90" y="-1" fill="currentColor" dominant-baseline="middle" class="text-xs"
							>{yLabel}</text
						>
					</g>
				{/if}
			</g>
		</svg>
	{/if}
</div>
