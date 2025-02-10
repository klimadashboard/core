<script>
	import { getScale } from '$lib/utils/scales';
	import { formatLabel } from '$lib/utils/format';

	export let chartWidth;
	export let chartHeight;
	export let data;
	export let options;

	$: xScale = getScale(data, 'x', [0, chartWidth - options.margin.left - options.margin.right]);
</script>

<g transform="translate(0,0)" class="text-sm">
	{#each xScale.ticks(10) as tick}
		<g transform="translate({xScale(tick)},0)">
			<text y={chartHeight - options.margin.bottom} text-anchor="middle" class="fill-current"
				>{formatLabel(tick)}</text
			>
			<line y1={chartHeight - 40} y2={chartHeight - 30} class="stroke-current opacity-20" />
		</g>
	{/each}
</g>
