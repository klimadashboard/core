<script>
	import { line, curveMonotoneX } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let data;
	export let selectedPeriod;

	let chartWidth;
	let chartHeight;
	let margin = 16;
	let yScale;

	$: xScale = scaleLinear()
		.domain([data[0].period, data[data.length - 1].period])
		.range([0, chartWidth]);

	$: {
		const minVal = min(data, (d) => d.percentage);
		const maxVal = max(data, (d) => d.percentage);
		const mid = (minVal + maxVal) / 2;
		const yMin = Math.max(0, mid - 10);
		const yMax = Math.min(100, mid + 10);

		yScale = scaleLinear()
			.domain([yMin, yMax])
			.range([chartHeight - margin, margin]);
	}

	$: generateLine = line()
		.x((d) => xScale(d.period))
		.y((d) => yScale(d.percentage))
		.curve(curveMonotoneX); // smooth line
</script>

<div class="w-full max-w-40 h-16 px-2">
	<div class="w-full h-full" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
		{#if chartWidth && chartHeight}
			<svg width={chartWidth} height={chartHeight} class="overflow-visible">
				<!-- Smoothed Line -->
				<path d={generateLine(data)} class="fill-none stroke-current opacity-50 stroke-2" />

				<!-- Circles for each data point -->
				{#each data as d}
					<circle
						cx={xScale(d.period)}
						cy={yScale(d.percentage)}
						r={d.period === selectedPeriod ? 4 : 3}
						class="{d.period == selectedPeriod ? 'opacity-100' : 'opacity-80'} fill-current"
					/>
				{/each}
				<g class="text-xs opacity-70">
					{#each data as d, i}
						{#if d.period % 2 === 0}
							<g transform="translate({xScale(d.period)},{chartHeight})" class="dark:fill-white">
								<text
									text-anchor={i == 0 ? 'start' : i == data.length - 1 ? 'end' : 'middle'}
									class={selectedPeriod == d.period ? 'font-bold' : ''}>{d.period}</text
								>
							</g>
						{/if}
					{/each}
				</g>
			</svg>
		{/if}
	</div>
</div>
