<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';

	export let block;
	let itemsPromise;

	// Function to fetch all items
	async function fetchAllItems(tables, languageCode) {
		const fetchTableItems = async (tableName, limit = 20) => {
			const directus = getDirectusInstance();

			let hasSiteField = false;

			try {
				const [sampleRecord] = await directus.request(
					readItems(tableName, {
						limit: 1,
						fields: ['*']
					})
				);

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
						},
						deep: {
							translations: {
								_filter: {
									languages_code: {
										_eq: languageCode
									}
								}
							}
						}
					})
				);

				return response.map((item) => ({
					...item,
					content: item.translations?.[0],
					type: tableName
				}));
			} catch (err) {
				console.error(`Failed to fetch items from table "${tableName}":`, err);
				return [];
			}
		};

		const promises = tables.map((table) => fetchTableItems(table));
		const results = await Promise.all(promises);

		const uniqueItems = Array.from(new Map(results.flat().map((item) => [item.id, item])).values());

		return uniqueItems;
	}

	// Reactive update when language changes
	$: itemsPromise = fetchAllItems(block.types, page.data.language.code);
</script>

<div class="container my-4">
	{#await itemsPromise}
		<!-- Loading State -->
		<p>Loading...</p>
	{:then items}
		<h3 class="font-bold border-b mb-1">{block.title}</h3>
		<ul class="flex flex-wrap gap-x-4 text-lg">
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
