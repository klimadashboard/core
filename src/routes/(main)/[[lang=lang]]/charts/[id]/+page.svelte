<script>
	/** @type {import('./$types').PageData} */
	import Chart from '$lib/components/charts/index.svelte';
	export let data;
</script>

<div class="">
	<div class="container my-16">
		<Chart id={data.id} />
	</div>
</div>
