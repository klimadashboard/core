<script>
	import '$lib/app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { glossaryItem } from '$lib/stores/glossary';
	import Glossary from '$lib/components/Glossary.svelte';
	import { onMount } from 'svelte';
	import * as Fathom from 'fathom-client';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { afterNavigate } from '$app/navigation';
	import dayjs from 'dayjs';
	import 'dayjs/locale/de';
	import 'dayjs/locale/en';

	const fathom_ids = [
		{ version: 'de', fathom: 'BKRABNNN' },
		{ version: 'at', fathom: 'RDBKIXJL' }
	];

	let description = $state(
		page.data.content?.seo?.meta_description || page.data.content?.description
	);
	let title = $state(
		page.data.content?.seo?.title ||
			page.data.content?.title + ' | ' + page.data.site.translations[0]?.title
	);
	let image = $state(`https://base.klimadashboard.org/assets/${page.data.content?.seo?.og_image}`);

	onMount(() => {
		document.documentElement.lang = page.data.language.code;
		dayjs.locale(page.data.language.code);

		function handleGlobalClick(event) {
			const button = event.target.closest('button[data-key]');
			if (button) {
				glossaryItem.set(button.dataset.key);
			}
		}

		document.addEventListener('click', handleGlobalClick);

		Fathom.load(fathom_ids.find((d) => d.version == PUBLIC_VERSION).fathom, {
			url: 'https://cdn-eu.usefathom.com/script.js'
		});

		return () => {
			document.removeEventListener('click', handleGlobalClick);
		};
	});

	afterNavigate(() => {
		if (browser) {
			Fathom.trackPageview();
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	{#each page.data.page?.slugs as { languages_code, slug }}
		{#if languages_code}
			<link
				rel="alternate"
				hreflang={languages_code}
				href={(
					page.url.origin +
					'/' +
					languages_code.replace('de', '') +
					(slug === 'home' ? '' : '/' + slug)
				).replace(/\/+/g, '/')}
			/>
		{/if}
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

<div>
	<div class="dark:bg-gray-950 dark:text-white transition duration-1000">
		{#if $glossaryItem}
			<Glossary />
		{/if}
		<slot />
	</div>
</div>
