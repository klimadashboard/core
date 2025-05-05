<script>
	import { createEventDispatcher } from 'svelte';
	import formatNumber from '$lib/stores/formatNumber';

	export let regions = [];
	export let region = {};
	export let selectedRegions = [];

	const dispatch = createEventDispatcher();

	const getDistance = (center1, center2) => {
		if (!center1 || !center2) return Infinity;
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
			distance: r.center && region.center ? getDistance(r.center, region.center) : 0
		}))
		.sort((a, b) => a.distance - b.distance);

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
		return selectedRegions.find((s) => s.code === r.code);
	}
</script>

<div class="relative min-w-64">
	<input
		type="text"
		placeholder="Vergleiche deine Gemeinde mit..."
		bind:value={searchTerm}
		on:focus={() => (showDropdown = true)}
		class="border p-2 w-full text-base rounded-full"
		aria-label="Region suchen"
	/>

	{#if showDropdown && filtered.length > 0}
		<div
			class="absolute z-10 bg-white border rounded shadow max-h-64 overflow-y-auto mt-1 w-full"
			role="listbox"
			aria-multiselectable="true"
		>
			{#each filtered as r (r.code)}
				<div
					role="option"
					aria-selected={isSelected(r)}
					class="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
					on:click={() => toggle(r)}
				>
					<input type="checkbox" checked={isSelected(r)} readonly class="mr-2" />
					<span class="flex-1">
						{r.name}
						{#if r.distance !== null}
							({formatNumber(r.distance)} km){/if}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
