<script>
	import { onMount } from 'svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { PUBLIC_VERSION } from '$env/static/public';

	let query = '';
	let suggestions = [];
	let showSuggestions = false;
	let activeSuggestionIndex = -1;
	let debounceTimeout;
	export let includeRegions = false;

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
						_and: [
							{ country: { _eq: PUBLIC_VERSION.toUpperCase() } },
							{
								_or: [{ name: { _eq: value } }, { postcodes: { _contains: value } }]
							}
						]
					},
					fields: ['id', 'name', 'postcodes', 'country', 'layer'],
					sort: ['name']
				})
			);

			const regionPartialMatches = await directus.request(
				readItems('regions', {
					filter: {
						_and: [
							{ country: { _eq: PUBLIC_VERSION.toUpperCase() } },
							{
								_or: [{ name: { _icontains: value } }, { postcodes: { _contains: value } }]
							}
						]
					},
					fields: ['id', 'name', 'postcodes', 'country', 'layer'],
					sort: ['name']
				})
			);

			const mapRegions = (regions, searchValue) =>
				regions.map((r) => {
					let subtitle = '';

					if (Array.isArray(r.postcodes) && r.postcodes.length > 0) {
						// Check if the search value matches any postcode
						const matchedPostcode = r.postcodes.find((pc) => pc.startsWith(searchValue));

						// If there's a match, use it, otherwise default to the first postcode
						subtitle = matchedPostcode || r.postcodes[0];
					}

					return {
						id: r.id,
						title: r.name,
						subtitle,
						source: 'region',
						country: r.country,
						layer: r.layer
					};
				});

			const mappedRegionExact = mapRegions(regionExactMatches, value);
			const regionExactIds = mappedRegionExact.map((r) => r.id);
			const mappedRegionPartial = mapRegions(
				regionPartialMatches.filter((r) => !regionExactIds.includes(r.id)),
				value
			);

			// --- CHARTS ---
			const chartExactMatches = await directus.request(
				readItems('charts', {
					filter: {
						_and: [
							{
								site: {
									_eq: PUBLIC_VERSION
								}
							},
							{
								_or: [
									{ translations: { title: { _eq: value } } },
									{ translations: { heading: { _eq: value } } },
									{ translations: { text: { _eq: value } } }
								]
							},
							{
								status: {
									_eq: 'published'
								}
							}
						]
					},
					fields: ['id', 'translations.title', 'translations.heading', 'translations.text'],
					deep: {
						translations: {
							_filter: {
								languages_code: { _eq: $page.data.language.code }
							}
						}
					}
				})
			);

			const chartPartialMatches = await directus.request(
				readItems('charts', {
					filter: {
						_and: [
							{
								site: {
									_eq: PUBLIC_VERSION
								}
							},
							{
								_or: [
									{ translations: { title: { _icontains: value } } },
									{ translations: { heading: { _icontains: value } } },
									{ translations: { text: { _icontains: value } } }
								]
							},
							{
								status: {
									_eq: 'published'
								}
							}
						]
					},
					fields: ['id', 'translations.title', 'translations.heading', 'translations.text'],
					deep: {
						translations: {
							_filter: {
								languages_code: { _eq: $page.data.language.code }
							}
						}
					}
				})
			);

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
					source: 'chart'
				}));

			// --- PAGES ---
			const pageExactMatches = await directus.request(
				readItems('pages', {
					filter: {
						_and: [
							{
								site: {
									_eq: PUBLIC_VERSION
								}
							},
							{
								_or: [{ translations: { title: { _eq: value } } }]
							},
							{
								status: {
									_eq: 'published'
								}
							}
						]
					},
					fields: ['id', 'translations.title', 'translations.slug'],
					deep: {
						translations: {
							_filter: {
								languages_code: { _eq: $page.data.language.code }
							}
						}
					}
				})
			);

			const pagePartialMatches = await directus.request(
				readItems('pages', {
					filter: {
						_and: [
							{
								site: {
									_eq: PUBLIC_VERSION
								}
							},
							{ _or: [{ translations: { title: { _icontains: value } } }] },
							{
								status: {
									_eq: 'published'
								}
							}
						]
					},
					fields: ['id', 'translations.title', 'translations.slug'],
					deep: {
						translations: {
							_filter: {
								languages_code: { _eq: $page.data.language.code }
							}
						}
					}
				})
			);

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

			// --- COMPANIES ---
			const companyExactMatches = await directus.request(
				readItems('companies', {
					filter: {
						name: { _eq: value }
					},
					fields: ['id', 'name']
				})
			);

			const companyPartialMatches = await directus.request(
				readItems('companies', {
					filter: {
						name: { _icontains: value }
					},
					fields: ['id', 'name']
				})
			);

			const mappedCompanyExact = companyExactMatches.map((company) => ({
				id: company.id,
				title: company.name,
				subtitle: '',
				source: 'company'
			}));

			const companyExactIds = mappedCompanyExact.map((c) => c.id);
			const mappedCompanyPartial = companyPartialMatches
				.filter((company) => !companyExactIds.includes(company.id))
				.map((company) => ({
					id: company.id,
					title: company.name,
					subtitle: '',
					source: 'company'
				}));

			// Combine all suggestions
			suggestions = [
				...mappedPageExact,
				...mappedChartExact,
				...mappedRegionExact,
				...mappedPagePartial,
				...mappedChartPartial,
				...mappedRegionPartial,
				...mappedCompanyExact,
				...mappedCompanyPartial
			];

			showSuggestions = true;
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	}

	function onInput(event) {
		query = event.target.value;
		debounce(() => fetchSuggestions(query), 100);
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
					const directus = getDirectusInstance(fetch);

					// Fetch all regions with their centers
					const regions = await directus.request(
						readItems('regions', {
							fields: ['id', 'name', 'center'],
							filter: {
								country: {
									_eq: PUBLIC_VERSION.toUpperCase()
								}
							},
							limit: -1
						})
					);

					// Parse regions and calculate distances
					let closestRegion = null;
					let minDistance = Infinity;

					regions.forEach((region) => {
						if (region.center) {
							const [regionLng, regionLat] = region.center.map((coord) => parseFloat(coord.trim()));

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
	<div class="flex gap-2">
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
				placeholder={includeRegions
					? 'Suchen nach Regionen, Themen, Diagrammen...'
					: $page.data.translations.searchPlaceholder}
				class="input w-full !pl-10 text-black dark:text-white"
				bind:value={query}
				on:input={onInput}
				on:keydown={onKeyDown}
				on:blur={onBlur}
				autocomplete="off"
			/>
		</div>
		{#if includeRegions}
			<button aria-label="Find location" class="button !hidden" on:click={findClosestRegion}>
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
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
					<path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" />
					<path d="M12 2l0 2" />
					<path d="M12 20l0 2" />
					<path d="M20 12l2 0" />
					<path d="M2 12l2 0" />
				</svg>
			</button>
		{/if}
	</div>
	{#if showSuggestions && suggestions.length > 0}
		<ul
			class="absolute top-full left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm border overflow-scroll z-10 max-h-64 rounded-2xl"
		>
			{#each suggestions.filter( (s) => (includeRegions ? s.source : s.source !== 'region') ) as suggestion, index}
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
