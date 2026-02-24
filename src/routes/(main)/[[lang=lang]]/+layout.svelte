<script>
	import Header from '$lib/components/sections/header/index.svelte';
	import Footer from '$lib/components/sections/footer/index.svelte';
	export let data;
</script>

{#if data.site?.id !== 'org'}
	<Header />
{/if}
<slot />

<Footer />
