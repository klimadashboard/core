<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Blocks from '$lib/components/blocks/index.svelte';
    import Chart from '$lib/components/charts/index.svelte';

	export let data;
    console.log(data);
</script>


<PageHeader />

<div class="container">
<Chart chart={data.chart} />
</div>
