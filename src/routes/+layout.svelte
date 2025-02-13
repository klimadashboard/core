<script>
	import '$lib/app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { glossaryItem } from '$lib/stores/glossary';
	import Glossary from '$lib/components/Glossary.svelte';
	import { onMount } from 'svelte';
	import * as Fathom from 'fathom-client';
	import { PUBLIC_VERSION } from '$env/static/public';
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

	onMount(() => {
		function handleGlobalClick(event) {
			const button = event.target.closest('button[data-key]');
			if (button) {
				glossaryItem.set(button.dataset.key);
			}
		}

		console.log('dayjs locale: ' + dayjs.locale());

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

	$: page.url.pathname, browser && Fathom.trackPageview();
</script>

<div>
	<div class="dark:bg-gray-950 dark:text-white transition duration-1000">
		{#if $glossaryItem}
			<Glossary />
		{/if}

		<slot />
	</div>
</div>
