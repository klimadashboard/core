<script>
	import { page } from '$app/stores';
	import Chart from '$lib/components/charts/index.svelte';

	$: id = $page.params.slug.replace('charts/', '');
	const bgColor = $page.url.searchParams.get('bgcolor');
	const showText = $page.url.searchParams.get('showtext');
</script>

<main style="background: #{bgColor}" class="w-screen h-screen">
	{#if $page.params.slug}
		<Chart {id} showText={showText == 'false' ? false : true} />
	{/if}
</main>
