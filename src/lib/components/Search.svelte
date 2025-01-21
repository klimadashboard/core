<script>
	import { onMount } from 'svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { page } from '$app/stores';

	console.log($page.data);

	let query = '';
	let suggestions = [];
	let showSuggestions = false;
	let activeSuggestionIndex = -1;
	let debounceTimeout;
	let placeholder = $page.data.translations.searchPlaceholder;

	// Debounce function to limit API calls
	function debounce(func, delay) {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(func, delay);
	}

	// Fetch suggestions from Directus
	async function fetchSuggestions(value) {
		if (value.length === 0) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		try {
			const directus = getDirectusInstance(fetch);

			// --- REGIONS ---
			const regionExactMatches = await directus.request(
				readItems('regions', {
					filter: {
						_or: [{ name: { _eq: value } }, { postcode: { _eq: value } }]
					},
					fields: ['id', 'name', 'postcode', 'country', 'type'],
					sort: ['name']
				})
			);

			const regionPartialMatches = await directus.request(
				readItems('regions', {
					filter: {
						_or: [{ name: { _icontains: value } }, { postcode: { _icontains: value } }]
					},
					fields: ['id', 'name', 'postcode', 'country', 'type'],
					sort: ['name']
				})
			);

			// --- CHARTS ---
			// Exact matches: title or text equals value
			const chartExactMatches = await directus.request(
				readItems('charts', {
					filter: {
						_or: [
							{
								translations: {
									title: { _eq: value }
								}
							},
							{ translations: { heading: { _eq: value } } },
							{ translations: { text: { _eq: value } } }
							/*
							current not supported by directus
							{ translations: { tags: { _contains: value } } }
							 */
						]
					},
					fields: ['id', 'translations.title', 'translations.heading', 'translations.text']
				})
			);

			const chartPartialMatches = await directus.request(
				readItems('charts', {
					filter: {
						_or: [
							{ translations: { title: { _icontains: value } } },
							{ translations: { heading: { _icontains: value } } },
							{ translations: { text: { _icontains: value } } }
							/*
							current not supported by directus
							{ translations: { tags: { _contains: value } } }
							 */
						]
					},
					fields: ['id', 'translations.title', 'translations.heading', 'translations.text']
				})
			);

			// --- PAGES ---
			// Exact matches: title equals value
			const pageExactMatches = await directus.request(
				readItems('pages', {
					filter: {
						_or: [
							{
								translations: {
									title: { _eq: value }
								}
							}
							/*
							current not supported by directus
							{ translations: { tags: { _contains: value } } }
							 */
						]
					},
					fields: ['id', 'translations.title', 'translations.slug']
				})
			);

			const pagePartialMatches = await directus.request(
				readItems('pages', {
					filter: {
						_or: [
							{
								translations: {
									title: { _icontains: value }
								}
							}
							/*
							current not supported by directus
							{ translations: { tags: { _contains: value } } }
							 */
						]
					},
					fields: ['id', 'translations.title', 'translations.slug']
				})
			);

			// Map all results to a unified format
			const mappedRegionExact = regionExactMatches.map((r) => ({
				id: r.id,
				title: r.name,
				subtitle: r.postcode,
				source: 'region',
				country: r.country,
				type: r.type
			}));

			// Avoid duplicates in partial matches that appear as exact
			const regionExactIds = mappedRegionExact.map((r) => r.id);
			const mappedRegionPartial = regionPartialMatches
				.filter((r) => !regionExactIds.includes(r.id))
				.map((r) => ({
					id: r.id,
					title: r.name,
					subtitle: r.postcode,
					source: 'region',
					country: r.country,
					type: r.type
				}));

			const mappedChartExact = chartExactMatches.map((c) => ({
				id: c.id,
				title: c.translations[0].title,
				subtitle: '',
				source: 'chart'
			}));

			const chartExactIds = mappedChartExact.map((c) => c.id);
			const mappedChartPartial = chartPartialMatches
				.filter((c) => !chartExactIds.includes(c.id))
				.map((c) => ({
					id: c.id,
					title: c.translations[0].title,
					subtitle: '',
					source: 'chart',
					slug: c.slug
				}));

			const mappedPageExact = pageExactMatches.map((p) => ({
				id: p.id,
				title: p.translations[0].title,
				subtitle: '',
				source: 'page',
				slug: p.translations[0].slug
			}));

			const pageExactIds = mappedPageExact.map((p) => p.id);
			const mappedPagePartial = pagePartialMatches
				.filter((p) => !pageExactIds.includes(p.id))
				.map((p) => ({
					id: p.id,
					title: p.translations[0].title,
					subtitle: '',
					slug: p.translations[0].slug,
					source: 'page'
				}));

			// Combine all suggestions
			suggestions = [
				...mappedPageExact,
				...mappedChartExact,
				...mappedRegionExact,
				...mappedPagePartial,
				...mappedChartPartial,
				...mappedRegionPartial
			];

			showSuggestions = true;
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	}

	// Handle input event with debounce
	function onInput(event) {
		query = event.target.value;
		debounce(() => fetchSuggestions(query), 100);
	}

	// Handle selection of a suggestion
	function selectSuggestion(item) {
		if (item.source === 'region') {
			window.location.href = `/regions/${item.id}`;
		} else if (item.source === 'chart') {
			window.location.href = `/charts/${item.id}`;
		} else if (item.source === 'page') {
			window.location.href = `${item.slug}`;
		}
	}

	// Keyboard navigation in suggestions
	function onKeyDown(event) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (activeSuggestionIndex < suggestions.length - 1) {
				activeSuggestionIndex++;
			}
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (activeSuggestionIndex > 0) {
				activeSuggestionIndex--;
			}
		} else if (event.key === 'Enter') {
			if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
				selectSuggestion(suggestions[activeSuggestionIndex]);
			}
		} else if (event.key === 'Escape') {
			showSuggestions = false;
		}
	}

	// Hide suggestions on blur
	function onBlur() {
		setTimeout(() => {
			showSuggestions = false;
			activeSuggestionIndex = -1;
		}, 100);
	}
</script>

<div class="relative">
	<div class="flex gap-2">
		<input
			type="text"
			{placeholder}
			class="px-4 py-2 rounded-full w-full bg-gray-100 dark:bg-gray-800"
			bind:value={query}
			on:input={onInput}
			on:keydown={onKeyDown}
			on:blur={onBlur}
			autocomplete="off"
		/>
		<button aria-label="Orten lasen..." class="bg-gray-100 dark:bg-gray-800 rounded-full grid px-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="m-auto"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"
				/><path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" /><path d="M12 2l0 2" /><path
					d="M12 20l0 2"
				/><path d="M20 12l2 0" /><path d="M2 12l2 0" /></svg
			>
		</button>
	</div>
	{#if showSuggestions && suggestions.length > 0}
		<ul
			class="absolute top-full left-0 right-0 bg-white bg-opacity-80 backdrop-blur border overflow-scroll z-10 max-h-64 rounded-2xl"
		>
			{#each suggestions as suggestion, index}
				<li
					class="p-2 cursor-pointer hover:bg-gray-600 hover:text-white border-b border-b-gray-600 {index ===
					activeSuggestionIndex
						? 'bg-gray-600 text-white'
						: ''}"
					on:click={() => selectSuggestion(suggestion)}
					on:keydown={() => selectSuggestion(suggestion)}
					on:mouseover={() => (activeSuggestionIndex = index)}
					on:focus={() => (activeSuggestionIndex = index)}
				>
					<!-- Display the suggestion title and subtitle if available -->
					<strong>{suggestion.title}</strong>
					{#if suggestion.subtitle}
						<span>{suggestion.subtitle}</span>
					{/if}
					<!-- Show source after title -->
					<span class="opacity-50 italic ml-2">({suggestion.source})</span>

					{#if suggestion.source === 'region'}
						<!-- Optional: show additional region info -->
						<span class="opacity-50 ml-2">
							{suggestion.country} | {suggestion.type}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
