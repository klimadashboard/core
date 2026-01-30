<script>
	import Chart from '$lib/components/charts/index.svelte';

	export let block;
</script>

<div class="my-4 space-y-4 container">
	{#each block.charts as chart}
		<Chart id={chart.chart} type="card" />
	{/each}
</div>
