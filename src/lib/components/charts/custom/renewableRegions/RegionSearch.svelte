<script>
	import { createEventDispatcher } from 'svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { clickOutside } from '$lib/utils/clickOutside';

	export let regions = [];
	export let region = {};
	export let selectedRegions = [];

	const dispatch = createEventDispatcher();

	const getDistance = (center1, center2) => {
		if (!center1 || !center2) return null;
		const toRad = (d) => (d * Math.PI) / 180;
		const R = 6371;
		const dLat = toRad(center2[1] - center1[1]);
		const dLon = toRad(center2[0] - center1[0]);
		const lat1 = toRad(center1[1]);
		const lat2 = toRad(center2[1]);
		const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	};

	let searchTerm = '';
	let showDropdown = false;

	$: searchable = regions
		.map((r) => ({
			...r,
			distance: getDistance(r.center, region.center),
			isParent: region.parents?.some((p) => p.id === r.id)
		}))
		.sort((a, b) => {
			// Ensure the "country" layer comes first
			if (a.layer === 'country' && b.layer !== 'country') return -2;
			if (b.layer === 'country' && a.layer !== 'country') return 1;

			// Parent region first
			if (a.isParent && !b.isParent) return -2;
			if (!a.isParent && b.isParent) return 1;

			// Then by distance (nulls last)
			if (a.distance === null && b.distance === null) return 0;
			if (a.distance === null) return 1;
			if (b.distance === null) return -1;
			return a.distance - b.distance;
		});

	$: filtered =
		searchTerm.length < 2
			? searchable.slice(0, 20)
			: searchable
					.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
					.slice(0, 50);

	function toggle(r) {
		dispatch('toggle', r);
		showDropdown = false;
		searchTerm = '';
	}

	function isSelected(r) {
		return selectedRegions.some((s) => s.id === r.id);
	}
</script>

<div class="relative min-w-56">
	<input
		type="text"
		placeholder="Vergleiche deine Gemeinde mit..."
		bind:value={searchTerm}
		on:focus={() => (showDropdown = true)}
		class="input text-sm w-full placeholder-black dark:placeholder-white"
		aria-label="Region suchen"
	/>

	{#if showDropdown && filtered.length > 0}
		<div
			class="absolute z-10 bg-white dark:bg-gray-900 border rounded-2xl border-current/20 text-sm shadow max-h-64 overflow-y-auto mt-1 w-full"
			role="listbox"
			aria-multiselectable="true"
			use:clickOutside
			on:click_outside={() => (showDropdown = false)}
		>
			{#each filtered as r}
				<div
					role="option"
					aria-selected={isSelected(r)}
					class="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
					on:click={() => toggle(r)}
				>
					<input type="checkbox" checked={isSelected(r)} readonly class="mr-2" />
					<span class="flex-1">
						{r.name} ({r.layer_label})
						{#if r.distance !== null && r.distance > 1 && r.layer == 'municipality'}
							({formatNumber(r.distance)} km){/if}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
