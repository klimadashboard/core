<script>
	import Chart from '$lib/components/charts/index.svelte';

	export let block;
	console.log(block);
	$: hideWrapper = block.hidewrapper;
	$: multipleCharts = block.content.chart.length > 1;
</script>

<div
	class="my-4 {hideWrapper ? '' : 'container'} {multipleCharts ? 'grid gap-4 md:grid-cols-2' : ''}"
>
	<!--
	{#each block.content.chart as chart}
		<Chart id={chart.replace('page://', '')} {hideWrapper} />
	{/each}
	-->
</div>
