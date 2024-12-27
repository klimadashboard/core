<script>
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { locale } from '$lib/stores/i18n';
	import '@splidejs/svelte-splide/css';

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
					fields: ['*.*']
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

<div class="m-4">
	<div class="flex border-b">
		<h3 class="uppercase font-bold tracking-wide">{block.title}</h3>
	</div>
	<div class="mt-4">
		<!-- Await the `itemsPromise` -->
		{#await itemsPromise}
			<!-- Loading State -->
			<p>Loading...</p>
		{:then items}
			<!-- Success State: Use the `items` resolved by `itemsPromise` -->
			<Splide
				options={{
					autoWidth: true,
					autoHeight: true,
					gap: '1rem',
					trimSpace: true,
					omitEnd: true,
					type: 'loop',
					pagination: false
				}}
			>
				{#each items as item}
					<SplideSlide>
						<a class="border w-64 h-80 block" href="{item.type}/{item.id}">
							<div class="h-20 bg-gray-100" />
							<div class="p-4">
								<p class="uppercase font-bold text-sm tracking-wide">{item.content?.title}</p>
								<h3 class="text-xl">{item.content?.heading}</h3>
							</div>
						</a>
					</SplideSlide>
				{/each}
			</Splide>
		{:catch error}
			<!-- Error State -->
			<p class="text-red-500">Error loading items: {error.message}</p>
		{/await}
	</div>
</div>
