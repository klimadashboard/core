<script>
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';

	export let data;
	export let colors;

	let chartHeight;

	$: yScale = scaleLinear()
		.domain([0, max(data, (d) => d.added_power_kw)])
		.range([0, chartHeight]);
</script>

<div class="flex gap-2 items-end h-64" style="color: {colors[1]}" bind:clientHeight={chartHeight}>
	{#each data as item}
		<div class="flex-1 bg-current relative" style="height: {yScale(item.added_power_kw)}px">
			{#if item.added_power_kw > 0}
			<p class="text-xs text-center absolute -top-6 left-1/2 -translate-x-1/2">
				{item.year}
			</p>
			{/if}
		</div>
	{/each}
</div>

