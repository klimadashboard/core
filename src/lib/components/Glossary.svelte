<script>
	import { clickOutside } from '$lib/utils/clickOutside';
	import { glossaryItem } from '$lib/stores/glossary';
	import { fade } from 'svelte/transition';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';

	const getGlossary = async function (key) {
		const directus = getDirectusInstance();
		try {
			const response = await directus.request(
				readItems('glossary', {
					filter: {
						_and: [
							{
								status: {
									_eq: 'published'
								}
							},
							{
								key: {
									_eq: key
								}
							}
						]
					},
					limit: 1,
					fields: ['*.*']
				})
			);

			return response[0];
		} catch (err) {
			console.error(err);
			return [];
		}
	};

	$: promise = getGlossary($glossaryItem);
</script>

{#if $glossaryItem}
	<div
		class="popup fixed inset-0 grid bg-black/50 rounded-2xl z-50"
		transition:fade|global={{ duration: 200 }}
	>
		<div
			class="bg-white dark:bg-gray-800 m-auto shadow-lg p-4 max-w-md lg:max-w-lg relative overflow-scroll"
			style="max-height: 70vh;"
			use:clickOutside
			on:click_outside={() => glossaryItem.set(false)}
		>
			<button
				on:mousedown={() => glossaryItem.set(false)}
				class="absolute top-4 right-4"
				aria-label="Close"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-x"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
			{#await promise}
				<Loader />
			{:then item}
				<h3 class="text-gradient-green text-xl border-b border-b-green-600 pb-2 mb-4">
					{item.translations[0]?.title}
				</h3>
				{@html item.translations[0]?.text}
			{:catch error}
				{error}
			{/await}
		</div>
	</div>
{/if}
