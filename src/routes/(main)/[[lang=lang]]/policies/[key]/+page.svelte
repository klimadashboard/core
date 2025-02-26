<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PolicyGrid from '../PolicyGrid.svelte';
	import PoliciesStatusSummary from '../PoliciesStatusSummary.svelte';
	export let data;
</script>

<PageHeader />

<PoliciesStatusSummary policies={data.policies} />

<PolicyGrid policies={data.policies} />
