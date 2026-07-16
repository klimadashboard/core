<!--
	Shared multi-select country picker for the electrification charts
	(electrificationCountryPaths, electrificationBySector). Not a chart itself,
	so it lives outside charts/custom and isn't auto-discovered.
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Select } from '$lib/components/ui';
	import type { ElectrificationRegion } from '$lib/utils/electrification';
	import { countryColor } from '$lib/utils/electrification';

	export let regions: ElectrificationRegion[] = [];
	export let selected: string[] = [];
	/** Region id re-added when the selection would otherwise go empty. */
	export let fallbackId: string | undefined = undefined;
	export let clearLabel: string = 'Clear selection';

	const dispatch = createEventDispatcher<{ change: string[] }>();

	let toAdd = '';

	$: available = regions
		.filter((r) => !selected.includes(r.id))
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name));

	function regionName(id: string): string {
		return regions.find((r) => r.id === id)?.name ?? id;
	}

	function commit(next: string[]) {
		selected = next;
		dispatch('change', selected);
	}

	function onAdd() {
		if (!toAdd || selected.includes(toAdd)) return;
		commit([...selected, toAdd]);
		toAdd = '';
	}

	function removeCountry(id: string) {
		const next = selected.filter((c) => c !== id);
		commit(next.length ? next : fallbackId ? [fallbackId] : []);
	}

	function clearSelection() {
		commit(fallbackId ? [fallbackId] : []);
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<Select
		label="Add country"
		hideLabel
		small
		bind:value={toAdd}
		on:change={onAdd}
		disabled={available.length === 0}
		options={[
			{ value: '', label: '+ country…' },
			...available.map((r) => ({ value: r.id, label: r.name }))
		]}
	/>

	<div class="flex flex-wrap items-center gap-1.5">
		{#each selected as id (id)}
			{@const color = countryColor(id, selected, fallbackId)}
			<span
				class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600
					bg-white dark:bg-gray-800 pl-2.5 pr-1 py-1 text-sm font-medium text-gray-900 dark:text-gray-100"
			>
				<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:{color}"></span>
				{regionName(id)}
				<button
					type="button"
					class="rounded-full w-5 h-5 inline-flex items-center justify-center leading-none
						text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
					aria-label={`Remove ${regionName(id)}`}
					on:click={() => removeCountry(id)}
				>
					×
				</button>
			</span>
		{/each}
		{#if selected.length}
			<button
				type="button"
				class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
					underline underline-offset-2"
				on:click={clearSelection}
			>
				{clearLabel}
			</button>
		{/if}
	</div>
</div>
