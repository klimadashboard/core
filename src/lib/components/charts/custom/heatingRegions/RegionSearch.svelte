<script>
	export let selectedRegion;
	export let regions;

	let query = '';
	let suggestions = [];
	let showSuggestions = false;
	let activeSuggestionIndex = -1;
	let debounceTimeout;

	// Debounce input
	function onInput(event) {
		query = event.target.value;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			filterSuggestions(query);
		}, 200);
	}

	// Filter local regions instead of remote fetch
	function filterSuggestions(value) {
		if (value.trim().length === 0) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		const lower = value.toLowerCase();
		suggestions = regions
			.filter((region) => region.name.toLowerCase().includes(lower))
			.slice(0, 10); // Limit to 10 for performance
		showSuggestions = suggestions.length > 0;
		activeSuggestionIndex = -1;
	}

	function selectSuggestion(region) {
		selectedRegion = region;
		query = region.name;
		showSuggestions = false;
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

	function scrollActiveSuggestionIntoView() {
		const suggestionList = document.getElementById('region-suggestions');
		if (!suggestionList) return;

		const activeItem = suggestionList.querySelectorAll('li')[activeSuggestionIndex];
		if (activeItem) {
			activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}

	function onBlur() {
		// Delay hiding so click events can register
		setTimeout(() => {
			showSuggestions = false;
			activeSuggestionIndex = -1;
		}, 100);
	}
</script>

<div class="relative">
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
			class="absolute left-3 top-1.5 pointer-events-none text-gray-500"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
			<path d="M21 21l-6 -6" />
		</svg>

		<input
			type="search"
			class="input w-full !pl-10 text-black dark:text-white"
			placeholder="Region suchen..."
			bind:value={query}
			on:input={onInput}
			on:keydown={onKeyDown}
			on:blur={onBlur}
			autocomplete="off"
			aria-autocomplete="list"
			aria-controls="region-suggestions"
			aria-expanded={showSuggestions}
		/>
	</div>

	{#if showSuggestions && suggestions.length > 0}
		<ul
			id="region-suggestions"
			role="listbox"
			class="absolute top-full left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm border overflow-scroll z-10 max-h-64 rounded-2xl"
		>
			{#each suggestions as region, index (region.code)}
				<li
					role="option"
					tabindex="-1"
					class="p-2 cursor-pointer hover:bg-gray-600 hover:text-white border-b border-b-gray-600 {index ===
					activeSuggestionIndex
						? 'bg-gray-600 text-white'
						: ''}"
					on:click={() => selectSuggestion(region)}
					on:mouseover={() => (activeSuggestionIndex = index)}
				>
					<strong>{region.name}</strong>
				</li>
			{/each}
		</ul>
	{/if}
</div>
