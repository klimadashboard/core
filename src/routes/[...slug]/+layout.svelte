<script>
	import Header from '$lib/components/header.svelte';
	import Footer from '$lib/components/footer.svelte';
</script>

<Header />

<main class="min-h-screen pt-16" itemscope itemtype="https://schema.org/FAQPage">
	<slot />
</main>

<Footer />
