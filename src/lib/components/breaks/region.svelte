<script>
	import { onMount } from 'svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';

	let query = '';
	let suggestions = [];
	let showSuggestions = false;
	let activeSuggestionIndex = -1;
	let debounceTimeout;

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

			// Fetch exact matches
			const exactMatches = await directus.request(
				readItems('regions', {
					filter: {
						_or: [{ name: { _eq: value } }, { postcode: { _eq: value } }]
					},
					fields: ['*'], // Include any other fields you need
					sort: ['name'] // Sort exact matches alphabetically by name
				})
			);

			// Fetch partial matches excluding exact matches
			const partialMatches = await directus.request(
				readItems('regions', {
					filter: {
						_and: [
							{
								_or: [{ name: { _icontains: value } }, { postcode: { _icontains: value } }]
							}
						]
					},
					fields: ['*'],
					sort: ['name'] // Sort partial matches alphabetically by name
				})
			);

			// Combine exact matches and partial matches
			suggestions = [...exactMatches, ...partialMatches];
			console.log(suggestions);
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

	// Handle selection of a region
	function selectRegion(region) {
		window.location.href = `/region/${region.id}`;
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
				selectRegion(suggestions[activeSuggestionIndex]);
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

<div class="bg-gray-100 py-8 my-8">
	<div class="container md:flex justify-between items-center">
		<div>
			<p class="uppercase font-bold tracking-wide">Preview</p>
			<h2 class="text-4xl font-bold">Die Klimakrise <br />in deiner Region</h2>
			<p class="text-lg max-w-xs leading-tight mt-2">
				Auswirkungen, Emissionen und Klimazukünfte bei dir vor Ort.
			</p>
		</div>
		<div class="max-w-2xl w-full text-lg">
			<div class="relative mt-4">
				<input
					type="text"
					placeholder="Nach PLZ oder Ort suchen..."
					class="px-4 py-2 rounded-full w-full"
					bind:value={query}
					on:input={onInput}
					on:keydown={onKeyDown}
					on:blur={onBlur}
					autocomplete="off"
				/>
				{#if showSuggestions && suggestions.length > 0}
					<ul class="suggestions rounded-2xl">
						{#each suggestions as region, index}
							<li
								class="suggestion-item {index === activeSuggestionIndex ? 'active' : ''}"
								on:click={() => selectRegion(region)}
								on:mouseover={() => (activeSuggestionIndex = index)}
							>
								{#if region.postcode}
									{region.postcode}
								{/if}
								{region.name}
								<span class="opacity-50">
									{region.country} |
									{region.type}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #ccc;
		z-index: 10;
		max-height: 200px;
		overflow-y: auto;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.suggestion-item {
		padding: 8px;
		cursor: pointer;
	}

	.suggestion-item.active,
	.suggestion-item:hover {
		background-color: #f0f0f0;
	}
</style>
