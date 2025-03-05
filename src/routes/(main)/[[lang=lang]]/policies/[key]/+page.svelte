<script>
	import { page } from '$app/stores';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PoliciesGrid from '../PoliciesGrid.svelte';
	import PoliciesStatusSummary from '../PoliciesStatusSummary.svelte';
	import PoliciesFilter from '../PoliciesFilter.svelte';

	export let data;

	// Get selected filters from URL as a Set
	$: selectedFilters = new Set(
		$page.url.searchParams.get('filter')?.split(',').filter(Boolean) || []
	);

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

<PoliciesFilter attributes={data.attributes} />

<PoliciesStatusSummary policies={filteredPolicies} />

<PoliciesGrid policies={filteredPolicies} />
