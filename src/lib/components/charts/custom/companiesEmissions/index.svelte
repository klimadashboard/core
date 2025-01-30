<script>
	import CompanyEmissionsContainer from './CompanyEmissionsContainer.svelte';
	import { getCompanyMetaData } from './getData';
</script>

{#await getCompanyMetaData()}
	<p>Loading...</p>
{:then metaData}
	<CompanyEmissionsContainer companiesMetaData={metaData} />
{/await}
