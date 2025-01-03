<script>
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { locale } from '$lib/stores/i18n';
	import '@splidejs/svelte-splide/css/core';

	export let block;

	/**
	 * Fetch items from a single table
	 * @param {string} tableName
	 * @param {number} limit
	 * @returns {Promise<Array<any>>}
	 */
	function fetchTableItems(tableName, limit = 20) {
		const directus = getDirectusInstance();
		// Use .then() and .catch() or async/await—both return a Promise
		return directus
			.request(
				readItems(tableName, {
					limit,
					fields: ['*.*'],
					filter: {
						status: {
							_eq: 'published'
						}
					}
				})
			)
			.then((response) => {
				return response.map((item) => ({
					...item,
					// Because $locale is a store, ensure you have a local subscription
					// or read it where it’s in scope.
					// If it’s in scope, you can do:
					content: item.translations?.find((t) => t.languages_code === $locale),
					type: tableName
				}));
			})
			.catch((err) => {
				console.error(`Failed to fetch items from table "${tableName}":`, err);
				return [];
			});
	}

	/**
	 * Fetch items for all tables listed in block.types
	 * @param {string[]} tables
	 * @returns {Promise<Array<any>>}
	 */
	async function fetchAllItems(tables) {
		const promises = tables.map((table) => fetchTableItems(table));
		const results = await Promise.all(promises);
		return results.flat(); // Flatten the array of arrays
	}

	// We store the Promise itself here
	let itemsPromise;

	// Whenever block.types changes, set a new promise
	$: if (block.types && Array.isArray(block.types)) {
		itemsPromise = fetchAllItems(block.types);
	}
</script>

{#await itemsPromise}
	<!-- Loading State -->
	<p>Loading...</p>
{:then items}
	<Splide
		class="m-4"
		options={{
			autoWidth: true,
			autoHeight: true,
			gap: '1rem',
			trimSpace: true,
			omitEnd: true,
			type: 'loop',
			pagination: false
		}}
		hasTrack={false}
	>
		<div class="flex border-b items-end pb-1">
			<h3 class="uppercase font-bold tracking-wide">{block.title}</h3>
			<div class="flex ml-auto splide__arrows">
				<button class="splide__arrow splide__arrow--prev"
					><svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg
					></button
				>
				<button class="splide__arrow splide__arrow--next"
					><svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg
					></button
				>
			</div>
		</div>
		<div class="mt-4">
			<SplideTrack>
				{#each items as item}
					{@const relativeUrl = item.type + '/' + item.id}
					<SplideSlide>
						<a class="w-64 block" href={relativeUrl}>
							<div class="bg-gray-100">
								<img src="{relativeUrl}/social.jpg" alt="" />
							</div>
							<div class="pt-2">
								{#if item.content?.title}
									<p class="uppercase font-bold text-sm tracking-wide">{item.content?.title}</p>
								{/if}
								{#if item.content?.heading}
									<h3 class="text-xl">{item.content?.heading}</h3>
								{/if}
								{#if item.name}
									<h3 class="text-xl">{item.name}</h3>
								{/if}
							</div>
						</a>
					</SplideSlide>
				{/each}
			</SplideTrack>
		</div>
	</Splide>
{:catch error}
	<!-- Error State -->
	<p class="text-red-500">Error loading items: {error.message}</p>
{/await}
