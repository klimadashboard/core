<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import dayjs from 'dayjs';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { replaceState, goto } from '$app/navigation';
	import PolicyGrid from './PolicyGrid.svelte';
	import PoliciesStatusSummary from './PoliciesStatusSummary.svelte';
	export let data;

	$: selectedFilters = new Set($page.url.searchParams.get('filter')?.split(',') || []);
	$: console.log(selectedFilters);

	// Update URL and filter policies
	function setFilter(filterKey) {
		if (selectedFilters.has(filterKey)) {
			selectedFilters.delete(filterKey);
			$page.url.searchParams.delete('filter', filterKey);
		} else {
			selectedFilters.add(filterKey);
			$page.url.searchParams.append('filter', filterKey);
		}
		replaceState($page.url, $page.state);
	}

	// Filter policies based on selected filters
	$: filteredPolicies = selectedFilters.size
		? data.policies.filter((policy) =>
				policy.attributes.some((attr) => selectedFilters.has(attr.policies_attributes_key.key))
			)
		: data.policies;
</script>

<PageHeader />

<div class="container my-4">
	<div>
		<h2 class="flex gap-1 items-center font-bold text-sm mb-1">
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
				class="inline"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
				/><path d="M6 4v4" /><path d="M6 12v8" /><path
					d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
				/><path d="M12 4v10" /><path d="M12 18v2" /><path
					d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
				/><path d="M18 4v1" /><path d="M18 9v11" /></svg
			>Filter
		</h2>
	</div>
	{#if data.attributes}
		<div class="flex gap-1 flex-wrap items-center my-1">
			{#each data.attributes.filter((d) => d.type == 'topic') as topic}
				<button
					class="rounded-full px-3 py-1 text-sm font-bold {selectedFilters.has(topic.key)
						? 'bg-current/30'
						: 'bg-current/10'}"
					on:click={() => setFilter(topic.key)}
				>
					{topic.translations[0].title}
				</button>
			{/each}
		</div>
		<div class="flex gap-1 flex-wrap items-center my-1">
			{#each data.attributes.filter((d) => d.type == 'source') as source}
				<button
					class="rounded-full px-3 py-1 text-sm font-bold {selectedFilters.has(source.key)
						? 'bg-current/30'
						: 'bg-current/10'}"
					on:click={() => setFilter(source.key)}
				>
					{source.translations[0].title}
				</button>
			{/each}
		</div>
	{/if}
</div>

<PoliciesStatusSummary policies={filteredPolicies} />

<PolicyGrid policies={filteredPolicies} />
