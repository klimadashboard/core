<script>
	import atxCompanies from '$lib/stores/companies';
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';
	import CompanyEmissionsChart from './CompanyEmissionsChart.svelte';

	let selectedScopes = '1';
	let selectedYear = '2020';
	let emissions_scope_1_2_3;
	let availableYears;

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

	function handleSelectScope(event) {
		selectedScopes = event.target.value;
	}

	function handleSelectYear(event) {
		selectedYear = event.target.value;
	}

	// Filter
	$: allSelected = companies.reduce((selected, company) => selected && company.selected, true);
	$: allDeselected = companies.reduce(
		(deselected, company) => deselected && !company.selected,
		true
	);

	// Load emissions data
	Papa.parse(`../../data/${PUBLIC_VERSION}/company-emissions/ATX_Emissions_Scope1_2_3.csv`, {
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

	$: {
		if (emissions_scope_1_2_3) {
			// get unique available years
			availableYears = [
				...new Set(emissions_scope_1_2_3.map((entry) => entry.Year_Scope.split('_')[0]))
			];
			console.log('🚀 ~ file: index.svelte:60 ~ availableYears:', availableYears);
		}
	}
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
	<mark>Bar-Chart mit bisherigen Emissionen</mark>
	<br />
	<!-- Scope Selector -->
	<select bind:value={selectedScopes} on:change={handleSelectScope}>
		<option value="1">Scope 1</option>
		<option value="2">Scope 2</option>
		<option value="3">Scope 3</option>
		<option value="12">Scope 1+2</option>
		<option value="123">Scope 1+2+3</option>
	</select>

	<!-- Year Selector -->
	{#if availableYears}
		<select bind:value={selectedYear} on:change={handleSelectYear}>
			{#each availableYears as year}
				<option value={year}>{year}</option>
			{/each}
		</select>
	{/if}
	<br />

	{#if emissions_scope_1_2_3}
		<div class="h-80">
			<CompanyEmissionsChart
				data={emissions_scope_1_2_3}
				selectedCompanies={companies.filter((company) => company.selected)}
				{selectedScopes}
				{selectedYear}
			/>
		</div>
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
