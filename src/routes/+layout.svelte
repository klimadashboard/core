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
	import 'dayjs/locale/de'; // Import necessary locales
	import 'dayjs/locale/en';

	const fathom_ids = [
		{
			version: 'de',
			fathom: 'BKRABNNN'
		},
		{
			version: 'at',
			fathom: 'RDBKIXJL'
		}
	];

	$: description = page.data.content?.seo?.meta_description
		? page.data.content?.seo?.meta_description
		: page.data.content?.description;
	$: title = page.data.content?.seo?.title
		? page.data.content?.seo?.title
		: page.data.content?.title + ' | ' + page.data.site.translations[0]?.title;
	$: image = 'https://base.klimadashboard.org/assets/' + page.data.content?.seo?.og_image;

	onMount(() => {
		document.documentElement.lang = page.data.language.code;
		dayjs.locale(page.data.language.code);

		function handleGlobalClick(event) {
			const button = event.target.closest('button[data-key]');
			if (button) {
				glossaryItem.set(button.dataset.key);
			}
		}

		if (page.data?.language?.code) {
			dayjs.locale(page.data.language.code);
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
		<link
			rel="alternate"
			hreflang={languages_code}
			href={page.url.href + languages_code + '/' + slug}
		/>
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
