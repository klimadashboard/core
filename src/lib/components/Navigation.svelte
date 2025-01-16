<script>
	import { fade } from 'svelte/transition';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let showNavigation;

	/**
	 * Fetch items from a single table
	 * @param {string} tableName
	 * @param {number} limit
	 * @returns {Promise<Array<any>>}
	 */
	function fetchTableItems(tableName, limit = 20) {
		const directus = getDirectusInstance();
		return directus
			.request(
				readItems(tableName, {
					limit,
					fields: ['*.*'],
					filter: {
						_and: [
							{
								status: {
									_eq: 'published'
								}
							},
							{
								translations: {
									languages_code: {
										_eq: 'de'
									}
								}
							},
							{
								site: {
									_eq: PUBLIC_VERSION
								}
							}
						]
					}
				})
			)
			.then((response) => response)
			.catch((err) => {
				console.error(`Failed to fetch items from table "${tableName}":`, err);
				return [];
			});
	}

	/**
	 * Fetch items for all tables listed in block.types
	 * @param {string[]} tables
	 * @returns {Promise<Record<string, Array<any>>>}
	 */
	async function fetchAllItems(tables) {
		const results = {};
		for (const table of tables) {
			results[table] = await fetchTableItems(table);
		}
		return results;
	}

	// Fetch items for the specified tables
	let itemsPromise = fetchAllItems(['pages', 'charts']);
</script>

{#if showNavigation}
	<div
		class="fixed w-screen h-screen z-40 bg-white bg-opacity-90 backdrop-blur-lg pt-64 p-4"
		transition:fade
	>
		<div class="max-w-4xl mx-auto">
			{#await itemsPromise then itemsByTable}
				{#each Object.entries(itemsByTable) as [tableName, items]}
					<div>
						<h2 class="font-bold capitalize">{tableName}</h2>
						<ul>
							{#each items as item}
								<li>
									<a href={item.slug}> {item.id}</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			{/await}
		</div>
	</div>
{/if}
