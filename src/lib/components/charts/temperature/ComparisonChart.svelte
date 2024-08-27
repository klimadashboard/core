<script>
	import { scaleLinear } from 'd3-scale';
	import formatNumber from '$lib/stores/formatNumber';

	export let historicalAverages;
	export let recentData;

	let chartWidth;
	let chartHeight;

	$: xScale = scaleLinear()
		.domain([0, recentData.length])
		.range([25, chartWidth - 25]);
	$: yScale = scaleLinear().domain([7, -7]).range([0, chartHeight]);
	$: barScale = scaleLinear().domain([0, 14]).range([0, chartHeight]);
	$: barWidth = chartWidth / recentData.length - 40;

	const colors = ['#2489B8', '#7148CF', '#BE2D43']; // from green to blue

	$: getColor = function (value) {
		const colorScale = scaleLinear().range(colors).domain([-6, 0, 6]);
		return colorScale(value);
	};
</script>

<div class="h-80 mt-4" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	{#if chartWidth && chartHeight}
		<svg width={'100%'} height={'100%'}>
			{#each recentData as datapoint, i}
				{@const diff =
					datapoint.averageTemperature -
					historicalAverages.find((d) => d.period.slice(0, 3) == datapoint.period.slice(0, 3))
						.averageTemperature}
				<g transform="translate({xScale(i)},0)">
					<g transform="translate({barWidth / 2},{diff > 0 ? yScale(0) + 10 : yScale(0) - 25})">
						<text class="fill-gray-700 text-xs" text-anchor="middle" dominant-baseline="hanging"
							>{datapoint.period}</text
						>
						{#if datapoint.ongoing}
							<text
								y={12}
								class="fill-gray-600 text-xs"
								text-anchor="middle"
								dominant-baseline="hanging">Unvollständige Daten</text
							>
						{/if}
					</g>
					<rect
						x={0}
						y={yScale(diff > 0 ? diff : 0)}
						height={barScale(Math.abs(diff))}
						width={barWidth}
						fill={getColor(diff)}
					/>
					<text
						x={4}
						y={yScale(diff) + (diff > 0 ? 4 : -6)}
						class="fill-white text-xs font-bold opacity-50"
						dominant-baseline={diff > 0 ? 'hanging' : 'baseline'}
						>{diff > 0 ? '+' : ''}{formatNumber(diff)}°C</text
					>
					<line x1={-10} x2={barWidth + 10} y1={yScale(0)} y2={yScale(0)} class="stroke-gray-400" />
				</g>
			{/each}
			<!--
			<g>
				{#each yScale.ticks(5) as tick}
					<g transform="translate(0,{yScale(tick)})">
						<line x1={0} x2={5} y1={0} y2={0} class="stroke-gray-400" />
						<text x={7} dominant-baseline="middle" class="fill-gray-400 text-xs">{tick}°C</text>
					</g>
				{/each}
			</g>
            -->
		</svg>
	{/if}
</div>
