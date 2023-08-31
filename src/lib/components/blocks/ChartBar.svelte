<script>
	import { scaleLinear } from 'd3-scale';

	let chartWidth;
	let chartHeight;

	$: maxSumOfValues = block.content.charts
		.map((e) => e.values.reduce((a, b) => a + b.value, 0))
		.sort((a, b) => b - a)[0];
	$: xScale = scaleLinear().range([0, chartWidth]).domain([0, maxSumOfValues]);

	export let block;
</script>

<div class="container my-8">
	<div class="max-w-4xl">
		<h2 class="text-2xl">{block.content.heading}</h2>

		{#each block.content.charts as chart}
			<div class="my-4">
				<div
					class="w-full h-8 relative bg-gray-100"
					bind:clientWidth={chartWidth}
					bind:clientHeight={chartHeight}
				>
					{#if chartWidth}
						{#each chart.values as value}
							<div
								style="left: {xScale(
									chart.values
										.slice(0, chart.values.indexOf(value))
										.reduce((a, b) => a + b.value, 0)
								)}px; width: {xScale(value.value)}px; background: {block.content.keys.find(
									(d) => d.key == value.key
								).color}"
								class="h-full absolute"
							/>
						{/each}
					{/if}
				</div>
				<p class="text-lg mt-2">{chart.text}</p>
			</div>
		{/each}
		{#if block.content.source}
			<p class="text-sm text-gray-700">{block.content.source}</p>
		{/if}
	</div>
</div>
