<script>
	import Blocks from '$lib/components/blocks/index.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	/** @type {import('./$types').PageData} */
	export let data = [];
	console.log(JSON.parse(data.pagelayout));
</script>

<svelte:head>
	<title>{data.title} – Klimadashboard Österreich</title>
	<meta name="description" content={data.meta_description} />
</svelte:head>

<main class="mb-24">
	<PageHeader {data} />

	{#key data}
		{#if data.pagelayout}
			{#each JSON.parse(data.pagelayout) as layout}
				<section id="{layout.id} {layout.attrs.id}" class="{layout.attrs.class}" transition:fade>
					{#if layout.attrs.headline}
						<SectionHeader attrs={layout.attrs} />
					{/if}
					{#each layout.columns as column}
						<Blocks content={column.blocks} />
					{/each}
				</section>
			{/each}
		{:else}
			Content not found.
		{/if}
	{/key}
</main>