<script>
	import Header from '$lib/components/sections/header/index.svelte';
	import Footer from '$lib/components/sections/footer/index.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/stores';

	export let data;
</script>

<svelte:head>
	<title
		>{$page.data.content?.title} – Klimadashboard {PUBLIC_VERSION == 'de'
			? 'Deutschland'
			: 'Österreich'}</title
	>
	<meta name="description" content={'TODO'} />

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content={$page.url.href} />
	<meta property="og:type" content="website" />
	<meta
		property="og:title"
		content="{$page.data.content?.title} – Klimadashboard {PUBLIC_VERSION == 'de'
			? 'Deutschland'
			: 'Österreich'}"
	/>
	<meta property="og:description" content={'TODO'} />
	<meta property="og:image" content="{$page.url}social.jpg" />

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={$page.url.href} />
	<meta property="twitter:site" content="@klimadashboard" />
	<meta
		name="twitter:title"
		content="{$page.data.content?.title} – Klimadashboard {PUBLIC_VERSION == 'de'
			? 'Deutschland'
			: 'Österreich'}"
	/>
	<meta name="twitter:description" content={'TODO'} />
	<meta name="twitter:image" content="{$page.url}social.jpg" />
</svelte:head>

<Header />

<slot />

<Footer />
