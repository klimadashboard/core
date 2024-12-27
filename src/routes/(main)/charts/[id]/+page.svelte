<script>
	/** @type {import('./$types').PageData} */
	import Chart from '$lib/components/charts/index.svelte';
	export let data;
	console.log(data);
</script>

<div class="grid lg:grid-cols-4 py-8">
	<div />
	<div class="col-span-2">
		<Chart chart={data.content} />
	</div>
</div>
