<script>
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';

	export let data;

	let chartHeight;

	$: yScale = scaleLinear()
		.domain([0, max(data, (d) => d.added_power_kw)])
		.range([0, chartHeight]);
</script>

<div
	class="flex gap-2 items-end h-64 border-b pb-4 mb-4 border-current/20"
	bind:clientHeight={chartHeight}
>
	{#each data as item}
		<div class="flex-1 bg-[#E0A906] relative" style="height: {yScale(item.added_power_kw)}px">
			<p class="text-xs text-center absolute -top-6 left-1/2 -translate-x-1/2">{item.year}</p>
		</div>
	{/each}
</div>
