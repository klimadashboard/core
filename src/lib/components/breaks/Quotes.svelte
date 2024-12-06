<script>
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css';
	import { readItems, readAssetRaw } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import { onMount } from 'svelte';

	let quotes = [];
	let error = null;

	async function getQuotes() {
		const directus = getDirectusInstance();
		try {
			const response = await directus.request(readItems('quotes'));

			return response;
		} catch (err) {
			error = err;
		}
	}

	$: promise = getQuotes();
</script>

{#await promise then quotes}
	<Splide
		options={{
			type: 'loop',
			perPage: 3,
			arrows: false,
			autoplay: true,
			breakpoints: {
				1800: {
					perPage: 2
				},
				1000: {
					perPage: 1
				}
			}
		}}
		aria-label="My Favorite Images"
	>
		{#each quotes as quote}
			<SplideSlide class="p-4">
				<p class="text-2xl">{quote.text}</p>
				<div class="flex items-center gap-2">
					{#if quote.author_image}
						<img
							class="w-24 h-24 rounded-full"
							src="https://base.klimadashboard.org/assets/{quote.author_image}"
							alt={quote.author_name}
						/>
					{/if}
					<div class="text-lg leading-tight">
						<p class="font-bold">{quote.author_name}</p>
						{#if quote.author_role}
							<p>{quote.author_role}</p>
						{/if}
					</div>
				</div>
			</SplideSlide>
		{/each}
	</Splide>
{:catch error}
	<p>Error fetching quotes: {error.message}</p>
{/await}
