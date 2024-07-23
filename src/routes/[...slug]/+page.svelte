<script>
	import { onMount } from 'svelte';
	import Blocks from '$lib/components/blocks/index.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/stores';

	export let data;
</script>

<svelte:head>
	<title
		>{data.page.title} – Klimadashboard {PUBLIC_VERSION == 'de'
			? 'Deutschland'
			: 'Österreich'}</title
	>
	<meta name="description" content={'TODO'} />

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content={$page.url.href} />
	<meta property="og:type" content="website" />
	<meta
		property="og:title"
		content="{data.page.title} – Klimadashboard {PUBLIC_VERSION == 'de'
			? 'Deutschland'
			: 'Österreich'}"
	/>
	<meta property="og:description" content={'TODO'} />
	<meta
		property="og:image"
		content="{$page.url}image/social/{$page.params.slug ? $page.params.slug : 'home'}/social.jpg"
	/>

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={$page.url.href} />
	<meta property="twitter:site" content="@klimadashboard" />
	<meta
		name="twitter:title"
		content="{data.page.title} – Klimadashboard {PUBLIC_VERSION == 'de'
			? 'Deutschland'
			: 'Österreich'}"
	/>
	<meta name="twitter:description" content={'TODO'} />
	<meta
		name="twitter:image"
		content="{$page.url}image/social/{$page.params.slug ? $page.params.slug : 'home'}/social.jpg"
	/>
</svelte:head>

<Blocks data={data.page.blocks} />
