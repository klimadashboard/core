<script>
	import atxCompanies from '$lib/stores/companies';
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';
	import CompanyEmissionsChart from './CompanyEmissionsChart.svelte';

	let selectedScope = '1';
	let selectedYear = 2020;
	let emissions_scope_1_2_3;

	// use companies data with `selected: true` as default
	$: companies = atxCompanies.map((company) => {
		return {
			...company,
			selected: true
		};
	});

	// $: console.log(companies.map((c) => c.selected));

	function selectAll() {
		companies = companies.map((company) => ({ ...company, selected: true }));
	}

	function deselectAll() {
		companies = companies.map((company) => ({ ...company, selected: false }));
	}

	function handleSelectChange(event) {
		selectedScope = event.target.value;
		console.log(selectedScope); // You can log or use the value as needed
	}

	// Filter
	$: allSelected = companies.reduce((selected, company) => selected && company.selected, true);
	$: allDeselected = companies.reduce(
		(deselected, company) => deselected && !company.selected,
		true
	);

	// TODO: remove scope12 from data structure
	// TODO: align company names in atxCompanies and in csv data
	// Papa.parse(`../../data/${PUBLIC_VERSION}/company-emissions/v5_Emissionpaths_Scope1_2_3.csv`, { // this link does not work
	Papa.parse(`v5_Emissionpaths_Scope1_2_3.csv`, {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			console.log('🚀 ~ file: index.svelte:44 ~ results:', results);
			if (results) {
				emissions_scope_1_2_3 = results.data;
			}
		}
	});

	console.log('🚀 ~ file: index.svelte:34 ~ emissions_scope_1_2_3:', emissions_scope_1_2_3);
</script>

<div>
	<button
		class="text-blue underline disabled:opacity-50"
		disabled={allSelected}
		on:click={() => {
			selectAll();
		}}>Alle auswählen</button
	><br />
	<button
		class="text-blue underline disabled:opacity-50"
		disabled={allDeselected}
		on:click={() => {
			deselectAll();
		}}>Alle abwählen</button
	><br />
	{#each companies as company}
		<input type="checkbox" id="company-filter-{company.logo}" bind:checked={company.selected} />
		<label for="company-filter-{company.logo}">{company.name}</label><br />
	{/each}
	<br />

	<br />
	Auswahl der Scopes
	<select bind:value={selectedScope} on:change={handleSelectChange}>
		<option>Scope 1</option>
		<option>Scope 2</option>
		<option>Scope 3</option>
		<option>Scope 1+2</option>
		<option>Scope 1+2+3</option>
	</select>
	<br />

	<mark>Bar-Chart mit bisherigen Emissionen</mark>

	{#if emissions_scope_1_2_3}
		<CompanyEmissionsChart
			data={emissions_scope_1_2_3}
			selectedCompanies={companies}
			{selectedScope}
			{selectedYear}
		/>
	{/if}

	<div style="border: 1px solid black">
		<strong>Ausgewählte Unternehmen:</strong>
		<ul>
			{#each companies as company}
				{#if company.selected}
					<li>{company.name}</li>
				{/if}
			{/each}
		</ul>
	</div>
</div>
