<script lang="ts">
	import CompanyEmissionsContainer from './CompanyEmissionsContainer.svelte';
	import { getCompanyMetaData } from './getData';

	export let chart;
</script>

{#await getCompanyMetaData()}
	<p>Loading...</p>
{:then metaData}
	<CompanyEmissionsContainer {chart} companiesMetaData={metaData} />
{/await}
