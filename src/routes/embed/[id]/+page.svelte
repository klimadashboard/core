<script>
	import { page } from '$app/stores';
	import Chart from '$lib/components/charts/index.svelte';

	const bgColor = $page.url.searchParams.get('bgcolor');
	const showText = $page.url.searchParams.get('showtext');
</script>

<main style="background: #{bgColor}" class="w-screen h-screen">
	<Chart id={$page.data.id} showText={showText == 'false' ? false : true} type="card" />
</main>
