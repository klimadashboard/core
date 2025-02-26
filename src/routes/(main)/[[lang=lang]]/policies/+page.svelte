<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import dayjs from 'dayjs';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { replaceState, goto } from '$app/navigation';
	import PolicyGrid from './PolicyGrid.svelte';
	import PoliciesStatusSummary from './PoliciesStatusSummary.svelte';
	export let data;

	console.log(data);

	// Get selected filters from URL as a Set
	$: selectedFilters = new Set(
		$page.url.searchParams.get('filter')?.split(',').filter(Boolean) || []
	);
	$: console.log(selectedFilters);

	// Update URL and filter policies
	function setFilter(filterKey) {
		if (selectedFilters.has(filterKey)) {
			selectedFilters.delete(filterKey);
		} else {
			selectedFilters.add(filterKey);
		}

		// Update the URL search params correctly
		const newFilterValue = [...selectedFilters].join(',');
		if (newFilterValue) {
			$page.url.searchParams.set('filter', newFilterValue);
		} else {
			$page.url.searchParams.delete('filter');
		}

		replaceState($page.url, $page.state);
	}

	// Filter policies based on selected filters using AND logic
	$: filteredPolicies = selectedFilters.size
		? data.policies.filter((policy) =>
				[...selectedFilters].every((filter) =>
					policy.attributes.some((attr) => attr.key === filter)
				)
			)
		: data.policies;
</script>

<PageHeader />

<div class="container">
	{#if data.attributes}
		<div class="flex gap-1 flex-wrap items-center my-1">
			{#each data.attributes.filter((d) => d.type === 'topic') as topic}
				<button
					class="rounded-full px-3 py-1 text-sm font-bold {selectedFilters.has(topic.key)
						? 'bg-current/30'
						: 'bg-current/10'}"
					on:click={() => setFilter(topic.key)}
				>
					{topic.title}
				</button>
			{/each}
		</div>
		<div class="flex gap-1 flex-wrap items-center my-1">
			{#each data.attributes.filter((d) => d.type === 'source') as source}
				<button
					class="rounded-full px-3 py-1 text-sm font-bold {selectedFilters.has(source.key)
						? 'bg-current/30'
						: 'bg-current/10'}"
					on:click={() => setFilter(source.key)}
				>
					{source.title}
				</button>
			{/each}
		</div>
		<div class="flex gap-1 flex-wrap items-center my-1">
			{#each data.attributes.filter((d) => d.type === 'effect') as effect}
				<button
					class="rounded-full px-3 py-1 text-sm font-bold {selectedFilters.has(effect.key)
						? 'bg-current/30'
						: 'bg-current/10'}"
					on:click={() => setFilter(effect.key)}
				>
					{effect.title}
				</button>
			{/each}
		</div>
	{/if}
</div>

<PoliciesStatusSummary policies={filteredPolicies} />

<PolicyGrid policies={filteredPolicies} />
