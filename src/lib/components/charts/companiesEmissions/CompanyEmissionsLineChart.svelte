<script>
	// @ts-nocheck
	import LineChart from '../chartLine.svelte';
	import { transformDataSingleCompany, transformDataMultiCompanies } from './transformData';

	export let rawData;
	export let selectedCompanies;
	export let selectedScopes = ['scope1'];
	
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:5 ~ data:', rawData);
	$: console.log('🚀 ~ file: CompanyEmissionsChart ~ selectedCompanies:', selectedCompanies);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:10 ~ selectedScope:', selectedScopes);

	let isSingleCompanySelected;
	let selectedCompanyNames
	$: isSingleCompanySelected = selectedCompanies.length === 1;
	$: selectedCompanyNames = [...selectedCompanies].map((company) => company.name);

	const rawColors = ['#7CBAB3', '#575C75', '#71665B', '#B28834', '#8CAED9', '#E0A906', '#CF6317'];
	const rawLabels = ['Scope 1', 'Scope 2', 'Scope 3'];
	const rawKeys = ['scope1', 'scope2', 'scope3'];

	// Specify the company name to filter for
	const companyName = selectedCompanies[0].name;

	let dataset = [];
	let keys;
	let labels;
	let colors;
	$: {
		if (rawData && companyName && selectedScopes) {

			if (isSingleCompanySelected) {
				// Specify the company name to filter for
				const companyName = selectedCompanies[0].name;
				dataset = transformDataSingleCompany(rawData, companyName, selectedScopes);
			} else {
				dataset = transformDataMultiCompanies(rawData, selectedCompanyNames, selectedScopes);
				console.log("🚀 ~ dataset:", dataset)
			}


			// Select keys, colors and labels
			if (selectedScopes.length === 1) {
				keys = isSingleCompanySelected ? selectedScopes : selectedCompanyNames;
				labels = isSingleCompanySelected ? [`Scope ${selectedScopes[0].slice(-1)}`] : selectedCompanyNames;
				colors = isSingleCompanySelected ? [rawColors[parseInt(selectedScopes[0].slice(-1)) - 1]] : rawColors.slice(0, selectedCompanyNames.length);
			} else {
				keys = isSingleCompanySelected ? rawKeys.slice(0, selectedScopes.length) : selectedCompanyNames;
				labels = isSingleCompanySelected ? rawLabels.slice(0, selectedScopes.length) : selectedCompanyNames;
				colors = isSingleCompanySelected ? rawColors.slice(0, selectedScopes.length) : rawColors.slice(0, selectedCompanyNames.length);
			}

			console.log('🚀 ~ keys:', keys);
			console.log('🚀 ~ labels:', labels);
			console.log('🚀 ~ colors:', colors);
			console.log('🚀 ~ dataset:', dataset);
		}
	}
</script>

{#if dataset && selectedCompanies.length > 0 && selectedCompanies.length < 8}
	<LineChart
		data={dataset}
		{colors}
		{keys}
		{labels}
		showTotal={isSingleCompanySelected}
		showAreas={isSingleCompanySelected}
		visualisation={isSingleCompanySelected ? 'stacked' : 'non-stacked'}
		marginLeft={40}
		xTicksInterval={1}
	/>
{:else if selectedCompanies.length === 0}
	<p class="text-center">No company selected. Select up to 7 companies.</p>
{:else if selectedCompanies.length > 6}
	<p class="text-center">Too many companies selected. Select up to 7 companies.</p>
{:else}
	<p class="text-center">Loading...</p>
{/if}
