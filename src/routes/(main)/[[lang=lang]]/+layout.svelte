<script>
	import Header from '$lib/components/sections/header/index.svelte';
	import Footer from '$lib/components/sections/footer/index.svelte';
	export let data;
</script>

<Header />
<slot />

<Footer />
