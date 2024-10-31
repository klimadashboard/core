<script>
	import Blocks from '$lib/components/blocks/index.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { fade } from 'svelte/transition';
	import { goto, invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/stores';
	import { locale } from '$lib/stores/i18n';

	/** @type {import('./$types').PageData} */
	export let data = [];

	$: if (browser && data.redirecturl) {
		goto(data.redirecturl);
	}

	$: itemtype = data.pagelayout
		? data.pagelayout.includes('"type":"toggle"')
			? 'https://schema.org/FAQPage'
			: ''
		: '';

	$: if ($locale && browser) {
		invalidateAll();
	}
</script>

<svelte:head>
	<title
		>{data.title} – Klimadashboard {PUBLIC_VERSION == 'de' ? 'Deutschland' : 'Österreich'}</title
	>
	<meta name="description" content={data.meta_description} />

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content={$page.url.href} />
	<meta property="og:type" content="website" />
	<meta
		property="og:title"
		content="{data.title} – Klimadashboard {PUBLIC_VERSION == 'de' ? 'Deutschland' : 'Österreich'}"
	/>
	<meta property="og:description" content={data.meta_description} />
	<meta
		property="og:image"
		content="{$page.url.origin}/image/social/{$page.params.slug
			? $page.params.slug
			: 'home'}/social.jpg"
	/>

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={$page.url.href} />
	<meta property="twitter:site" content="@klimadashboard" />
	<meta
		name="twitter:title"
		content="{data.title} – Klimadashboard {PUBLIC_VERSION == 'de' ? 'Deutschland' : 'Österreich'}"
	/>
	<meta name="twitter:description" content={data.meta_description} />
	<meta
		name="twitter:image"
		content="{$page.url.origin}/image/social/{$page.params.slug
			? $page.params.slug
			: 'home'}/social.jpg"
	/>
</svelte:head>

{#key data}
	{#if data.redirecturl}
		<Loader />
	{:else}
		<main class="mb-24 min-h-screen pt-16" itemscope {itemtype}>
			{#if data.showpageheader !== 'false'}
				<PageHeader {data} />
			{/if}
			{#if data.pagelayout}
				{#each JSON.parse(data.pagelayout) as layout}
					<section id={layout.id} class="{layout.attrs.class} my-8" transition:fade>
						{#if layout.attrs.headline}
							<SectionHeader attrs={layout.attrs} />
						{/if}
						{#each layout.columns as column}
							<Blocks content={column.blocks} />
						{/each}
					</section>
				{/each}
			{:else}
				<Loader />
				Content not found.
			{/if}
		</main>
	{/if}
{/key}
