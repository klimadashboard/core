<script>
	import { line, curveMonotoneX } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let data;
	export let selectedPeriod;

	let chartWidth;
	let chartHeight;
	let margin = 16;

	$: xScale = scaleLinear()
		.domain([data[0].period, data[data.length - 1].period])
		.range([0, chartWidth]);

	$: yScale = scaleLinear()
		.domain([min(data, (d) => d.value), max(data, (d) => d.value)])
		.range([chartHeight - margin, margin]);

	$: generateLine = line()
		.x((d) => xScale(d.period))
		.y((d) => yScale(d.value))
		.curve(curveMonotoneX); // smooth line
</script>

<div class="w-full max-w-40 h-16 p-2">
	<div class="w-full h-full" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
		{#if chartWidth && chartHeight}
			<svg width={chartWidth} height={chartHeight} class="overflow-visible">
				<!-- Smoothed Line -->
				<path d={generateLine(data)} class="fill-none stroke-current opacity-50 stroke-2" />

				<!-- Circles for each data point -->
				{#each data as d}
					<circle
						cx={xScale(d.period)}
						cy={yScale(d.value)}
						r={d.period === selectedPeriod ? 4 : 3}
						class="{d.period == selectedPeriod ? 'opacity-100' : 'opacity-80'} fill-current"
					/>
					<text
						x={xScale(d.period)}
						y={yScale(d.value) - 7}
						text-anchor="middle"
						class="text-xs fill-current">{Math.round(d.value)}</text
					>
				{/each}
				<g class="text-xs opacity-70">
					{#each data as d}
						<g transform="translate({xScale(d.period)},{chartHeight})" class="dark:fill-white">
							<text text-anchor="middle" class={selectedPeriod == d.period ? 'font-bold' : ''}
								>{d.period}</text
							>
						</g>
					{/each}
				</g>
			</svg>
		{/if}
	</div>
</div>
