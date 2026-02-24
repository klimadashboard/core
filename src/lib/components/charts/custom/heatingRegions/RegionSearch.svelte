<script lang="ts">
	import type { RegionWithDistance } from './config';

	export let selectedRegion: RegionWithDistance | null = null;
	export let allRegions: RegionWithDistance[] = [];

	let query = '';
	let suggestions: RegionWithDistance[] = [];
	let showSuggestions = false;
	let activeSuggestionIndex = -1;
	let debounceTimeout: ReturnType<typeof setTimeout>;

	function onInput(event: Event) {
		query = (event.target as HTMLInputElement).value;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			filterSuggestions(query);
		}, 200);
	}

	function filterSuggestions(value: string) {
		if (value.trim().length === 0) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		const lower = value.toLowerCase();
		suggestions = allRegions
			.filter((region) => region.name.toLowerCase().includes(lower))
			.slice(0, 10);
		showSuggestions = suggestions.length > 0;
		activeSuggestionIndex = -1;
	}

	function selectSuggestion(region: RegionWithDistance) {
		selectedRegion = region;
		query = region.name;
		showSuggestions = false;
	}

	function onKeyDown(event: KeyboardEvent) {
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
		setTimeout(() => {
			showSuggestions = false;
			activeSuggestionIndex = -1;
		}, 150);
	}
</script>

<div class="relative">
	<div class="relative w-full">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="M21 21l-4.35-4.35" />
		</svg>

		<input
			type="search"
			class="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
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
			class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-auto z-20 max-h-64 rounded-xl shadow-lg"
		>
			{#each suggestions as region, index (region.code)}
				<li
					role="option"
					aria-selected={index === activeSuggestionIndex}
					tabindex="-1"
					class="px-4 py-2.5 cursor-pointer transition-colors {index === activeSuggestionIndex
						? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
						: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
					on:click={() => selectSuggestion(region)}
					on:mouseenter={() => (activeSuggestionIndex = index)}
				>
					<span class="font-medium">{region.name}</span>
					{#if region.layer === 'district'}
						<span class="text-xs text-gray-500 dark:text-gray-400 ml-2">Landkreis</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
