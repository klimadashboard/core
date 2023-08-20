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

	/** @type {import('./$types').PageData} */
	export let data = [];

	$: if (browser && data.redirecturl) {
		goto(data.redirecturl);
	}
</script>

<svelte:head>
	<title
		>{data.title} – Klimadashboard {PUBLIC_VERSION == 'de' ? 'Deutschland' : 'Österreich'}</title
	>
	<meta name="description" content={data.meta_description} />
</svelte:head>

{#key data}
	{#if data.redirecturl}
		<Loader />
	{:else}
		<main class="mb-24">
			<PageHeader {data} />
			{#if data.pagelayout}
				{#each JSON.parse(data.pagelayout) as layout}
					<section id="{layout.id} {layout.attrs.id}" class={layout.attrs.class} transition:fade>
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
