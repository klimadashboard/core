<script lang="ts">
	import LineChart from '$lib/components/charts/chartLine.svelte';
	import { transformDataSingleCompany, transformDataMultipleCompanies } from './transformData';
	import type { CompanyEmissionArray, CompanyMetaData } from './schema';

	export let emissions: CompanyEmissionArray;
	export let selectedCompanies: CompanyMetaData[];
	export let selectedScopes: number[];
	export let selectedScope2Category: string = 'location_based';

	let isScopeThreeSelected: boolean;
	$: isScopeThreeSelected = selectedScopes.includes(3);

	let isSingleCompanySelected: boolean;
	let selectedCompanyNames: string[];
	$: isSingleCompanySelected = selectedCompanies.length === 1;
	$: selectedCompanyNames = [...selectedCompanies].map((company) => company.name);

	const rawColors: string[] = [
		'#7CBAB3',
		'#575C75',
		'#71665B',
		'#B28834',
		'#8CAED9',
		'#E0A906',
		'#CF6317'
	];
	const selectedScopesToColors: Record<number, string> = {
		1: '#4e79a7',
		2: '#f28e2c',
		3: '#e15759'
	};

	const selectedScopesToLabels: Record<number, string> = {
		1: 'Scope 1',
		2: 'Scope 2',
		3: 'Scope 3'
	};
	const maxCompanies = 7;

	let dataset: Array<Record<string, any>> = [];
	let keys: number[] | string[];
	let labels: string[];
	let colors: string[];
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
	<div class="h-20"></div>
	<p class="text-center">Keine Unternehmen ausgewählt.</p>
	<p class="text-center">⬆ Wähle oben bis zu sieben Unternehmen aus! ⬆</p>
	<div class="h-20"></div>
{:else if selectedCompanies.length > maxCompanies}
	<div class="h-20"></div>
	<p class="text-center">Zu viele Unternehmen ausgewählt. Wähle maximal 7 Unternehmen.</p>
	<div class="h-20"></div>
{:else}
	<div class="h-20"></div>
	<p class="text-center">Laden...</p>
	<div class="h-20"></div>
{/if}
