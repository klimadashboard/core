<script>
	import { getScale } from '$lib/utils/scales';
	import { formatLabel } from '$lib/utils/format';

	export let chartWidth;
	export let chartHeight;
	export let data;
	export let options;

	$: xScale = getScale(data, 'x', [0, chartWidth - options.margin.left - options.margin.right]); // Ensures nice round numbers

	$: top = chartHeight - options.margin.bottom;

	// Dynamically adjust tick count based on chart width
	$: tickCount = Math.max(3, Math.floor(chartWidth / 200)); // Adjust 100px as needed
	$: ticks = xScale.ticks(tickCount).filter((d, i, arr) => {
		// Ensure even spacing, remove overlapping values
		if (i === 0 || i === arr.length - 1) return true;
		return xScale(arr[i + 1]) - xScale(d) > 40; // Ensure at least 40px spacing
	});
</script>

<g transform="translate({options.margin.left},{top})" class="text-sm">
	<line
		x1={0}
		x2={chartWidth - options.margin.right - options.margin.left}
		class="stroke-current opacity-20"
	/>
	{#each ticks as tick, i}
		<g transform="translate({xScale(tick)},0)">
			<text
				y={7}
				dominant-baseline="hanging"
				text-anchor={i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'}
				class="fill-current"
			>
				{formatLabel(tick)}
			</text>
			<line y1={0} y2={5} class="stroke-current opacity-20" />
		</g>
	{/each}
</g>
