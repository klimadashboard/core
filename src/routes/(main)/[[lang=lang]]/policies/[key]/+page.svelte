<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PoliciesGrid from '../PoliciesGrid.svelte';
	import PoliciesStatusSummary from '../PoliciesStatusSummary.svelte';
	export let data;
</script>

<PageHeader />

<PoliciesStatusSummary policies={data.policies} />

<PoliciesGrid policies={data.policies} />
