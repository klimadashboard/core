<script>
	import '$lib/app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { glossaryItem } from '$lib/stores/glossary';
	import Glossary from '$lib/components/Glossary.svelte';
	import { onMount } from 'svelte';
	import * as Fathom from 'fathom-client';
	import { PUBLIC_VERSION } from '$env/static/public';

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

	onMount(() => {
		Fathom.load(fathom_ids.find((d) => d.version == PUBLIC_VERSION).fathom, {
			url: 'https://cdn-eu.usefathom.com/script.js'
		});
	});

	$: $page.url.pathname, browser && Fathom.trackPageview();
</script>

<div>
	<div class="dark:bg-gray-950 dark:text-white transition duration-1000">
		{#if $glossaryItem}
			<Glossary />
		{/if}

		<slot />
	</div>
</div>
