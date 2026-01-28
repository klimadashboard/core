<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Blocks from '$lib/components/blocks/index.svelte';
	import Chart from '$lib/components/charts/index.svelte';

	export let data;
</script>

<PageHeader />

<div class="container">
	<Chart id={data.chart.id} />
</div>
