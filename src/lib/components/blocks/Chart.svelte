<script>
	import Chart from '$lib/components/charts/index.svelte';

	export let block;
	$: hideWrapper = block.hidewrapper;
</script>

<div class="my-4 space-y-4 {hideWrapper ? '' : 'container'}">
	{#each block.charts as chart}
		<Chart id={chart.chart} {hideWrapper} />
	{/each}
</div>
