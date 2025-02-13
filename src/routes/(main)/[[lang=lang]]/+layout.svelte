<script>
	import Header from '$lib/components/sections/header/index.svelte';
	import Footer from '$lib/components/sections/footer/index.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	$: description = page.data.content?.seo?.meta_description
		? page.data.content?.seo?.meta_description
		: page.data.content?.description;
	$: title = page.data.content?.seo?.title
		? page.data.content?.seo?.title
		: page.data.content?.title + ' Klimadashboard ' + PUBLIC_VERSION == 'de'
			? 'Deutschland'
			: 'Österreich';
	$: image = 'https://base.klimadashboard.org/assets/' + page.data.content?.seo?.og_image;

	$: hrefLangLinks = page.data.languages.map((language) => ({
		lang: language.code,
		url: page.url.href.replace(page.data.language.code, language.code)
	}));

	$: onMount(() => {
		document.documentElement.lang = page.data.language.code;
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	{#each hrefLangLinks as { lang, url }}
		<link rel="alternate" hreflang={lang} href={url} />
	{/each}

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content={page.url.href} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={page.url.href} />
	<meta property="twitter:site" content="@klimadashboard" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>

<Header />

<slot />

<Footer />
