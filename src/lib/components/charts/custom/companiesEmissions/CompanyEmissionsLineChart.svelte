<script>
	// @ts-nocheck
	import LineChart from '$lib/components/charts/chartLine.svelte';
	import { EMISSION_SCOPE_KEYS } from './constants';
	import { transformDataSingleCompany, transformDataMultipleCompanies } from './transformData';

	export let emissions;
	export let selectedCompanies;
	export let selectedScopes;
	export let selectedScope2Category = 'location_based';

	let isScopeThreeSelected;
	$: isScopeThreeSelected = selectedScopes.includes(3);

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

	let dataset = [];
	let keys;
	let labels;
	let colors;
	$: {
		if (emissions && selectedCompanies && selectedScopes) {
			if (isSingleCompanySelected) {
				// Specify the company name to filter for
				const companyName = selectedCompanies[0].name;
				dataset = transformDataSingleCompany(
					emissions,
					companyName,
					selectedScopes,
					selectedScope2Category
				);
			} else {
				dataset = transformDataMultipleCompanies(
					emissions,
					selectedCompanyNames,
					selectedScopes,
					selectedScope2Category
				);
			}
			// Select keys, colors and labels
			keys = isSingleCompanySelected ? selectedScopes : selectedCompanyNames;
			labels = isSingleCompanySelected
				? selectedScopes.map((scope) => selectedScopesToLabels[scope])
				: selectedCompanyNames;
			colors = isSingleCompanySelected
				? selectedScopes.map((scope) => selectedScopesToColors[scope])
				: rawColors.slice(0, selectedCompanyNames.length);
		}
	}
</script>

{#if dataset.length > 0 && selectedCompanies.length > 0 && selectedCompanies.length <= maxCompanies}
	<div class="h-72">
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
			xTicksInterval={1}
			unit={'t'}
			invalidX={isScopeThreeSelected && 6}
			invalidText={isScopeThreeSelected && 'Daten weniger genau*'}
		/>
	</div>
	{#if isScopeThreeSelected}
		<p class="text-sm opacity-80 mt-2">
			* Vor 2022 führt die Datenungenauigkeit aufgrund unterschiedlicher erfasster Dimensionen der
			Scope 3 Emissionen zu fehlender Vergleichbarkeit.
		</p>
	{/if}
{:else if selectedCompanies.length === 0}
	<div class="h-28"></div>
	<p class="text-center">Keine Unternehmen ausgewählt.</p>
	<p class="text-center">⬆ Wähle oben bis zu sieben Unternehmen aus! ⬆</p>
{:else if selectedCompanies.length > maxCompanies}
	<div class="h-28"></div>
	<p class="text-center">Zu viele Unternehmen ausgewählt. Wähle maximal 7 Unternehmen.</p>
{:else}
	<div class="h-28"></div>
	<p class="text-center">Laden...</p>
{/if}
