<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { replaceState, goto } from '$app/navigation';

	export let attributes;

	// Filter attributes based on policies
	$: applicableAttributes = attributes
		.filter((attr) =>
			$page.data.policies.some((policy) =>
				policy.attributes?.some((policyAttr) => policyAttr.key === attr.key)
			)
		)
		.filter((attr) => attr.key !== $page.data.attribute?.key);

	// Extract unique attribute types dynamically
	$: attributeGroups = [...new Set(applicableAttributes.map((attr) => attr.type))];

	// Selected filters from URL
	$: selectedFilters = new Set(
		$page.url.searchParams.get('filter')?.split(',').filter(Boolean) || []
	);

	// Update URL and filter policies
	function setFilter(filterKey) {
		if (selectedFilters.has(filterKey)) {
			selectedFilters.delete(filterKey);
		} else {
			selectedFilters.add(filterKey);
		}

		// Update URL search params
		const newFilterValue = [...selectedFilters].join(',');
		if (newFilterValue) {
			$page.url.searchParams.set('filter', newFilterValue);
		} else {
			$page.url.searchParams.delete('filter');
		}

		replaceState($page.url, $page.state);
	}
</script>

<div class="container">
	{#if applicableAttributes.length}
		{#each attributeGroups as type}
			<div class="flex gap-1 flex-wrap items-center my-1">
				{#each applicableAttributes.filter((attr) => attr.type === type) as attr}
					<button
						class="rounded-full px-3 py-1 text-sm font-bold flex items-center gap-1 h-7 {selectedFilters.has(
							attr.key
						)
							? 'bg-current/30'
							: 'bg-current/10'}"
						on:click={() => setFilter(attr.key)}
					>
						{@html attr.icon || ''}
						{attr.title}
					</button>
				{/each}
			</div>
		{/each}
	{/if}
</div>
