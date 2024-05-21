<script>
	// @ts-nocheck
	import LineChart from '../chartLine.svelte';
	import { transformDataSingleCompany, transformDataMultipleCompanies } from './transformData';

	export let rawData;
	export let selectedCompanies;
	export let selectedScopes = ['scope1'];

	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:5 ~ data:', rawData);
	$: console.log('🚀 ~ file: CompanyEmissionsChart ~ selectedCompanies:', selectedCompanies);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:10 ~ selectedScope:', selectedScopes);

	let isSingleCompanySelected;
	let selectedCompanyNames;
	$: isSingleCompanySelected = selectedCompanies.length === 1;
	$: selectedCompanyNames = [...selectedCompanies].map((company) => company.name);

	const rawColors = ['#7CBAB3', '#575C75', '#71665B', '#B28834', '#8CAED9', '#E0A906', '#CF6317'];
	const selectedScopesToColors = {
		1: '#7CBAB3',
		2: '#575C75',
		3: '#71665B'
	};
	const selectedScopesToLabels = {
		1: 'Scope 1',
		2: 'Scope 2',
		3: 'Scope 3'
	};
	const selectedScopesToKeys = {
		1: 'scope1',
		2: 'scope2',
		3: 'scope3'
	};
	const maxCompanies = 7;

	// // Magazine Visuation Companies & Colors
	// const rawColors = [
	// 	'#19A6E2',
	// 	'#08779A',
	// 	'#910505',
	// 	'#000000',
	// 	'#036041',
	// 	'#31B159',
	// 	'#F2380F',
	// 	'#0F469A',
	// 	'#6787A6'
	// ];
	// selectedCompanyNames = [
	// 	'Voestalpine AG',
	// 	'OMV AG',
	// 	'Wienerberger AG',
	// 	'EVN AG',
	// 	'Mayr-Melnhof Karton AG',
	// 	'Lenzing AG',
	// 	'STRABAG SE',
	// 	'Verbund AG',
	// 	'Austria Technologie & Systemtechnik AG'
	// ];

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
				console.log('🚀 ~ dataset:', dataset);
			} else {
				dataset = transformDataMultipleCompanies(rawData, selectedCompanyNames, selectedScopes);
				console.log('🚀 ~ dataset:', dataset);
			}

			// Select keys, colors and labels
			keys = isSingleCompanySelected
				? selectedScopes.map((scope) => selectedScopesToKeys[scope])
				: selectedCompanyNames;
			labels = isSingleCompanySelected
				? selectedScopes.map((scope) => selectedScopesToLabels[scope])
				: selectedCompanyNames;
			colors = isSingleCompanySelected
				? selectedScopes.map((scope) => selectedScopesToColors[scope])
				: rawColors.slice(0, selectedCompanyNames.length);

			//	console.log('🚀 ~ keys:', keys);
			//	console.log('🚀 ~ labels:', labels);
			//	console.log('🚀 ~ colors:', colors);
			//	console.log('🚀 ~ dataset:', dataset);
		}
	}
</script>

{#if dataset && selectedCompanies.length > 0 && selectedCompanies.length <= maxCompanies}
	<LineChart
		data={dataset}
		{colors}
		{keys}
		{labels}
		showTotal={isSingleCompanySelected}
		showAreas={false}
		showDots={true}
		visualisation={isSingleCompanySelected ? 'stacked' : 'non-stacked'}
		marginLeft={50}
		xTicksInterval={2}
		preselectedIndex={4}
		unit={'t'}
	/>
{:else if selectedCompanies.length === 0}
	<br /><br /><br />
	<p class="text-center">Keine Unternehmen ausgewählt.</p>
	<p class="text-center">⬆ Wähle oben bis zu sieben Unternehmen aus! ⬆</p>
{:else if selectedCompanies.length > maxCompanies}
	<p class="text-center">Zu viele Unternehmen ausgewählt. Wähle maximal 7 Unternehmen.</p>
{:else}
	<p class="text-center">Laden...</p>
{/if}
