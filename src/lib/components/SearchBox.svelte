<script>
	import { createEventDispatcher } from 'svelte';
	import { clickOutside } from '../utils/clickOutside.js';
	import Input from './Input.svelte';

	export let items;
	export let matchCase = false;
	export let selectedItem = null;

	export function reset() {
		selectedItem = null;
		searchString = '';
	}

	$: searchString = '';
	let prevSearchString = null;

	let displayItems = false;

	const dispatch = createEventDispatcher();

	function selectItem(key) {
		const item = items?.find((i) => i.key === key);
		displayItems = false;
		searchString = item?.title;
		selectedItem = item;
		if (item) {
			dispatch('selectItem', {
				item
			});
		}
	}

	$: {
		if (prevSearchString && !searchString?.length) {
			selectItem(null);
		}
		prevSearchString = searchString;
	}

	const getCasedString = (str) => (matchCase ? str : str?.toLowerCase());

	const computeMatchingDistance = (item) => {
		const { title, subtitle } = item || {};

		const getPositionInString = (str) => getCasedString(str)?.indexOf(getCasedString(searchString));

		return (
			getPositionInString(title) + getPositionInString(subtitle) + title?.length + subtitle?.length
		);
	};

	$: handleKeydown = (event) => {
		if (!displayedItems || displayedItems?.length === 0) return;
		const focusInsideSearchBox = document.activeElement?.id.includes('search-box');
		const isArrowDownPress = event.key === 'ArrowDown';
		const isArrowUpPress = event.key === 'ArrowUp';

		const getPreviousyFocusedItemIndex = () =>
			document.activeElement.id.includes('search-box-item')
				? parseInt(document.activeElement.dataset.index)
				: null;

		const handleArrowDownPress = () => {
			const previouslyFocusedItemIndex = getPreviousyFocusedItemIndex();
			if (previouslyFocusedItemIndex === null) {
				itemRefs[0]?.focus();
			} else if (previouslyFocusedItemIndex + 1 < displayedItems?.length) {
				itemRefs[previouslyFocusedItemIndex + 1]?.focus();
			}
		};

		const handleArrowUpPress = () => {
			const previouslyFocusedItemIndex = getPreviousyFocusedItemIndex();
			if (previouslyFocusedItemIndex) {
				itemRefs[previouslyFocusedItemIndex - 1]?.focus();
			} else {
				document.getElementById('search-box-input')?.focus();
			}
		};

		if (focusInsideSearchBox && (isArrowDownPress || isArrowUpPress)) {
			event.preventDefault();
			if (isArrowDownPress) {
				handleArrowDownPress();
			}
			if (isArrowUpPress) {
				handleArrowUpPress();
			}
		}
	};

	$: matchingItems =
		items && searchString?.length > 2
			? items
					.filter((item) => {
						const { title, subtitle } = item || {};
						return (
							getCasedString(title)?.includes(getCasedString(searchString)) ||
							getCasedString(subtitle)?.includes(getCasedString(searchString))
						);
					})
					.sort((a, b) => {
						const distanceA = computeMatchingDistance(a);
						const distanceB = computeMatchingDistance(b);

						return distanceA - distanceB;
					})
			: null;

	$: displayedItems = matchingItems ? matchingItems.slice(0, 5) : matchingItems;
	$: remainingItems = matchingItems ? matchingItems.length - displayedItems?.length : null;

	let itemRefs = [];
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="relative inline-block" use:clickOutside on:click_outside={() => (displayItems = false)}>
	<Input
		id="search-box-input"
		icon="assets/icons/search.svg"
		bind:value={searchString}
		on:input={() => (displayItems = true)}
		placeholder="PLZ oder Ort eingeben..."
	/>
	{#if matchingItems !== null && !selectedItem && displayItems}
		<div style="z-index: 10000" class="absolute shadow-md bg-white left-0 right-0">
			{#each displayedItems as { key, title, subtitle }, index (key)}
				<li class="list-none" on:click={selectItem(key)}>
					<a
						bind:this={itemRefs[index]}
						id={`search-box-item-${index}`}
						data-index={index}
						href="javascript:void(0)"
						class="flex flex-col px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
						role="button"
						tabindex="0"
					>
						<span class="text-sm"> {title}</span>
						{#if subtitle}
							<span class="text-coldGray-300 text-xs"> {subtitle}</span>
						{/if}
					</a>
				</li>
			{/each}
			{#if remainingItems}
				<div class="text-xs text-center">
					{remainingItems} verborgene Elemente
				</div>
			{/if}
			{#if matchingItems !== null && matchingItems.length === 0}
				<div class="text-xs text-center">
					<span>Keine Resultate</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
