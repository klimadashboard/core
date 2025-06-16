<script>
	import { onMount } from 'svelte';
	import { getRegions } from '$lib/utils/regions';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { PUBLIC_VERSION } from '$env/static/public';

	let query = '';
	let suggestions = [];
	let showSuggestions = false;
	let activeSuggestionIndex = -1;
	let debounceTimeout;
	let requestCounter = 0;

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

		const currentRequest = ++requestCounter;

		try {
			const response = await fetch(
				`https://base.klimadashboard.org/get-search-results?q=${encodeURIComponent(value)}&lang=${$page.data.language.code}&site=${PUBLIC_VERSION}&country=${PUBLIC_VERSION.toUpperCase()}`,
				{ method: 'GET' }
			);

			if (currentRequest !== requestCounter) return;

			const results = await response.json();

			suggestions = results.map((item) => ({
				...item,
				subtitle: item.subtitle || ''
			}));

			showSuggestions = true;
		} catch (error) {
			if (currentRequest === requestCounter) {
				console.error('Search error:', error);
				suggestions = [];
				showSuggestions = false;
			}
		}
	}

	function onInput(event) {
		query = event.target.value;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			fetchSuggestions(query);
		}, 200);
	}

	function selectSuggestion(item) {
		if (item.source === 'region') {
			goto(`/regions/${item.id}`);
		} else if (item.source === 'chart') {
			goto(`/charts/${item.id}`);
		} else if (item.source === 'page') {
			goto(`${item.slug}`);
		} else if (item.source === 'company') {
			goto(`/companies/${item.id}`);
		}
	}

	function onKeyDown(event) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (activeSuggestionIndex < suggestions.length - 1) {
				activeSuggestionIndex++;
				scrollActiveSuggestionIntoView();
			}
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (activeSuggestionIndex > 0) {
				activeSuggestionIndex--;
				scrollActiveSuggestionIntoView();
			}
		} else if (event.key === 'Enter') {
			if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
				selectSuggestion(suggestions[activeSuggestionIndex]);
			}
		} else if (event.key === 'Escape') {
			showSuggestions = false;
		}
	}

	// Function to scroll the active suggestion into view
	function scrollActiveSuggestionIntoView() {
		const suggestionList = document.querySelector('ul');
		if (!suggestionList) return;

		const activeItem = suggestionList.querySelectorAll('li')[activeSuggestionIndex];
		if (activeItem) {
			activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}

	function onBlur() {
		setTimeout(() => {
			showSuggestions = false;
			activeSuggestionIndex = -1;
		}, 100);
	}

	// Function to calculate the distance between two lat/lng points
	function haversineDistance(lat1, lng1, lat2, lng2) {
		const toRadians = (degrees) => (degrees * Math.PI) / 180;

		const R = 6371; // Radius of the Earth in km
		const dLat = toRadians(lat2 - lat1);
		const dLng = toRadians(lng2 - lng1);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRadians(lat1)) *
				Math.cos(toRadians(lat2)) *
				Math.sin(dLng / 2) *
				Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c; // Distance in km
	}

	// Handle button click to find the closest region
	async function findClosestRegion() {
		// Check if the browser supports Geolocation
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser.');
			return;
		}

		// Get the user's current location
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;

				try {
					const regions = await getRegions();

					// Parse regions and calculate distances
					let closestRegion = null;
					let minDistance = Infinity;

					regions
						.filter((region) => region.layer == 'municipality')
						.forEach((region) => {
							if (region.center) {
								const [regionLng, regionLat] = region.center.map((coord) =>
									parseFloat(coord.trim())
								);

								const distance = haversineDistance(latitude, longitude, regionLat, regionLng);

								if (distance < minDistance) {
									minDistance = distance;
									closestRegion = region;
								}
							}
						});

					if (closestRegion) {
						// Redirect to the closest region's page
						goto(`/regions/${closestRegion.id}`);
					} else {
						alert('No regions found.');
					}
				} catch (error) {
					console.error('Error finding the closest region:', error);
				}
			},
			(error) => {
				alert('Unable to retrieve your location.');
				console.error(error);
			}
		);
	}
</script>

<div class="relative">
	<div class="flex flex-wrap items-center gap-2">
		<div class="relative w-full">
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
				class="absolute left-3 top-1.5 pointer-events-none"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
				<path d="M21 21l-6 -6" />
			</svg>
			<input
				type="text"
				placeholder={$page.data.translations.searchPlaceholder}
				class="input w-full !pl-10 text-black dark:text-white"
				bind:value={query}
				on:input={onInput}
				on:keydown={onKeyDown}
				on:blur={onBlur}
				autocomplete="off"
			/>
		</div>
		<button
			aria-label="Find location"
			class="button bg-green-500! cursor-pointer transition hover:bg-green-600!"
			on:click={findClosestRegion}
		>
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
				class=""
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
				<path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" />
				<path d="M12 2l0 2" />
				<path d="M12 20l0 2" />
				<path d="M20 12l2 0" />
				<path d="M2 12l2 0" />
			</svg>
			<span>Finde deine Region</span>
		</button>
		<p class="text-xs opacity-80 mt-1">Deine Koordinaten werden nicht gespeichert.</p>
	</div>
	{#if showSuggestions && suggestions.length > 0}
		<ul
			class="absolute top-full left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm border overflow-scroll z-10 max-h-64 rounded-2xl"
		>
			{#each suggestions as suggestion, index}
				<li
					class="p-2 cursor-pointer hover:bg-gray-600 hover:text-white border-b border-b-gray-600 {index ===
					activeSuggestionIndex
						? 'bg-gray-600 text-white'
						: ''}"
					on:click={() => selectSuggestion(suggestion)}
					on:mouseover={() => (activeSuggestionIndex = index)}
				>
					<strong>{suggestion.title}</strong>
					{#if suggestion.subtitle}
						<span>{suggestion.subtitle}</span>
					{/if}
					<span class="opacity-80 ml-1">[{$page.data.translations[suggestion.source]}]</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
