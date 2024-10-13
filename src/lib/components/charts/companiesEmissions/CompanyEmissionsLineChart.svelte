<script>
	// @ts-nocheck
	import LineChart from '../chartLine.svelte';
	import { transformDataSingleCompany, transformDataMultipleCompanies } from './transformData';

	export let emissions;
	export let selectedCompanies;
	export let selectedScopes = ['scope1'];
	export let selectedCategory = 'location_based';

	let isSingleCompanySelected;
	let selectedCompanyNames;
	$: isSingleCompanySelected = selectedCompanies.length === 1;
	$: selectedCompanyNames = [...selectedCompanies].map((company) => company.name);

	const rawColors = ['#7CBAB3', '#575C75', '#71665B', '#B28834', '#8CAED9', '#E0A906', '#CF6317'];
	const selectedScopesToColors = {
		1: '#4e79a7',
		2: '#f28e2c',
		3: '#e15759'
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
		if (emissions && companyName && selectedScopes) {
			if (isSingleCompanySelected) {
				// Specify the company name to filter for
				const companyName = selectedCompanies[0].name;
				dataset = transformDataSingleCompany(
					emissions,
					companyName,
					selectedScopes,
					selectedCategory
				);
			} else {
				dataset = transformDataMultipleCompanies(
					emissions,
					selectedCompanyNames,
					selectedScopes,
					selectedCategory
				);
			}
			console.log('🚀 ~ dataset:', dataset);
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
		visualisation={'non-stacked'}
		marginLeft={50}
		xTicksInterval={2}
		preselectedIndex={7}
		unit={'t'}
		invalidX={6}
		invalidText={'Text zu invaliden Daten'}
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
