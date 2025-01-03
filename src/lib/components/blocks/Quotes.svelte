<script>
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import { readItems, readAssetRaw } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';

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
				<div class="relative">
					<p class="text-2xl">{quote.text}</p>
					<p class="-top-32 -left-8 absolute text-[10rem] font-light opacity-10">»</p>
				</div>
				<div class="flex items-center gap-2 mt-4">
					{#if quote.author_image}
						<img
							class="w-20 h-20 rounded-full shadow"
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
