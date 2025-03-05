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
			<h2 class="font-bold mt-2 flex items-center gap-0.5">
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
					class="w-5 h-5"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
					/><path d="M6 4v4" /><path d="M6 12v8" /><path
						d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
					/><path d="M12 4v10" /><path d="M12 18v2" /><path
						d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
					/><path d="M18 4v1" /><path d="M18 9v11" /></svg
				>
				<span
					>{$page.data.translations[
						'policies' + type.charAt(0).toUpperCase() + type.slice(1)
					]}</span
				>
			</h2>
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
