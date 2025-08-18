<script>
	import { line, curveMonotoneX } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let data;
	export let selectedPeriod;

	let chartWidth;
	let chartHeight;
	let yScale;

	$: xScale = scaleLinear()
		.domain([data[0].period, data[data.length - 1].period])
		.range([0, chartWidth]);

	$: {
		const minVal = min(data, (d) => d.percentage);
		const maxVal = max(data, (d) => d.percentage);
		const mid = (minVal + maxVal) / 2;
		const yMin = Math.max(0, mid - 5);
		const yMax = Math.min(100, mid + 5);

		yScale = scaleLinear().domain([yMin, yMax]).range([chartHeight, 0]);
	}

	$: generateLine = line()
		.x((d) => xScale(d.period))
		.y((d) => yScale(d.percentage))
		.curve(curveMonotoneX); // smooth line
</script>

<div class="w-full max-w-40 h-10 p-4 pb-0">
	<div class="w-full h-full" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
		{#if chartWidth && chartHeight}
			<svg width={chartWidth} height={chartHeight} class="overflow-visible">
				<!-- Smoothed Line -->
				<path d={generateLine(data)} class="fill-none stroke-current opacity-50 stroke-2" />

				<!-- Circles for each data point -->
				{#each data as d, i}
					<circle
						cx={xScale(d.period)}
						cy={yScale(d.percentage)}
						r={d.period === selectedPeriod ? 4 : 3}
						class="{d.period == selectedPeriod ? 'opacity-100' : 'opacity-80'} fill-current"
					/>
					<text
						x={xScale(d.period)}
						y={yScale(d.percentage) - 7}
						text-anchor="middle"
						class="text-xs fill-current">{Math.round(d.percentage)}%</text
					>

					{#if data.length < 4 || i == 0 || i == data.length - 1}
						<text
							x={xScale(d.period)}
							y={yScale(d.percentage) + 5}
							text-anchor="middle"
							dominant-baseline="hanging"
							class="text-xs fill-current opacity-80">{d.period}</text
						>
					{/if}
				{/each}
				<!-- old -->
				<!--
				<g class="text-xs opacity-70">
					{#each data as d, i}
						{#if data.length < 4 || i == 0 || i == data.length - 1}
							<g transform="translate({xScale(d.period)},0)" class="dark:fill-white">
								<text
									text-anchor={i == 0 ? 'start' : i == data.length - 1 ? 'end' : 'middle'}
									class="{selectedPeriod == d.period ? 'font-bold' : ''} fill-current"
									>{d.period}</text
								>
							</g>
						{/if}
					{/each}
				</g>
				-->
			</svg>
		{/if}
	</div>
</div>
