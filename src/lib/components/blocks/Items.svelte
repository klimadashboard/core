<script>
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { locale } from '$lib/stores/i18n';
	import '@splidejs/svelte-splide/css/core';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let block;

	/**
	 * Fetch items from a single table
	 * @param {string} tableName
	 * @param {number} limit
	 * @returns {Promise<Array<any>>}
	 */
	async function fetchTableItems(tableName, limit = 20) {
		const directus = getDirectusInstance();

		let hasSiteField = false;

		try {
			// Fetch a single record to check for the existence of the "site" field
			const [sampleRecord] = await directus.request(
				readItems(tableName, {
					limit: 1, // Limit to 1 record for quick check
					fields: ['*']
				})
			);

			// Check if "site" is a key in the sample record
			hasSiteField = sampleRecord && Object.keys(sampleRecord).includes('site');
		} catch (err) {
			console.error(`Failed to fetch sample data for table "${tableName}":`, err);
		}

		try {
			const response = await directus.request(
				readItems(tableName, {
					limit,
					fields: ['*.*'],
					filter: {
						status: {
							_eq: 'published'
						},
						...(hasSiteField && {
							site: {
								_eq: PUBLIC_VERSION
							}
						})
					}
				})
			);

			return response.map((item) => ({
				...item,
				content: item.translations?.find((t) => t.languages_code === $locale),
				type: tableName
			}));
		} catch (err) {
			console.error(`Failed to fetch items from table "${tableName}":`, err);
			return [];
		}
	}

	/**
	 * Fetch items for all tables listed in block.types
	 * @param {string[]} tables
	 * @returns {Promise<Array<any>>}
	 */
	async function fetchAllItems(tables) {
		const promises = tables.map((table) => fetchTableItems(table));
		const results = await Promise.all(promises);

		// Flatten and deduplicate items based on a unique property
		const uniqueItems = Array.from(
			new Map(
				results.flat().map((item) => [item.id, item]) // Use 'id' as the key for uniqueness
			).values()
		);

		return uniqueItems;
	}

	// We store the Promise itself here
	let itemsPromise = fetchAllItems(block.types);
</script>

<div class="container my-4 text-lg">
	{#await itemsPromise}
		<!-- Loading State -->
		<p>Loading...</p>
	{:then items}
		<h3 class="font-bold border-b mb-1">{block.title}</h3>
		<ul class="flex flex-wrap gap-x-4">
			{#each items as item}
				{@const relativeUrl = item.type == 'pages' ? item.content.slug : item.type + '/' + item.id}
				<li class="inline hover:underline underline-offset-2 opacity-80 hover:opacity-100">
					<a href={relativeUrl}>
						<div class="">
							{#if item.content?.title}
								<p class="">{item.content?.title}</p>
							{/if}
							{#if item.name}
								<h3 class="">{item.name}</h3>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{:catch error}
		<!-- Error State -->
		<p class="text-red-500">Error loading items: {error.message}</p>
	{/await}
</div>
