<script>
	import { page } from '$app/stores';
	import Chart from '$lib/components/charts/index.svelte';

	$: id = $page.params.slug.replace('charts/', '');
	const bgColor = $page.url.searchParams.get('bgcolor');
</script>

<main style="background: #{bgColor}" class="w-screen h-screen">
	{#if $page.params.slug}
		<Chart {id} />
	{/if}
</main>
