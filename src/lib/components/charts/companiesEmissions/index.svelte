<script>
	import atxCompanies, { companyId } from '$lib/stores/companies';
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';
	import CompanyEmissionsChart from './CompanyEmissionsChart.svelte';
	import ViewSwitch from './ViewSwitch.svelte';
	import { fade } from 'svelte/transition';

	let selectedScopes = '1';
	let selectedYear = '2020';
	let rawData;
	let availableYears;
	let freezeYAxis = false;
	let isFocusView = false;

	// $: console.log('companyId', $companyId);

	// use companies data with `selected: true` as default
	$: companies = atxCompanies.map((company) => {
		return {
			...company,
			selected: true
		};
	});

	$: if (isFocusView) {
		deselectAll();
		companies[1].selected = true;
	}

	$: if (!isFocusView) {
		selectAll();
	}

	// $: console.log(companies.map((c) => c.selected));

	function selectAll() {
		companies = companies.map((company) => ({ ...company, selected: true }));
	}

	function deselectAll() {
		companies = companies.map((company) => ({ ...company, selected: false }));
	}

	function onClickCompany(company) {
		if (isFocusView) {
			companies = companies.map((c) => {
				if (c.name === company.name) {
					return { ...c, selected: true };
				}
				return { ...c, selected: false };
			});
		} else {
			companies = companies.map((c) => {
				if (c.name === company.name) {
					return { ...c, selected: !c.selected };
				}
				return c;
			});
		}
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
	Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/company-emissions/ATX_Emissions_Scope1_2_3.csv`,
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				console.log('🚀 ~ file: index.svelte:44 ~ raw data:', results);
				if (results) {
					rawData = results.data;
				}
			}
		}
	);

	$: {
		if (rawData) {
			// get unique available years
			availableYears = [...new Set(rawData.map((entry) => entry.Year_Scope.split('_')[0]))];
			console.log('🚀 ~ file: index.svelte:60 ~ availableYears:', availableYears);
		}
	}
	console.log('🚀 ~ file: index.svelte:34 ~ emissions_scope_1_2_3:', rawData);
</script>

<div>
	<ViewSwitch bind:isChecked={isFocusView} />
	<button
		class="text-blue underline disabled:opacity-50 mr-2"
		disabled={allSelected || isFocusView}
		on:click={() => {
			selectAll();
		}}>Alle auswählen</button
	>
	<button
		class="text-blue underline disabled:opacity-50"
		disabled={allDeselected || isFocusView}
		on:click={() => {
			deselectAll();
		}}>Alle abwählen</button
	><br />
	<!-- {#each companies as company}
		<input type="checkbox" id="company-filter-{company.logo}" bind:checked={company.selected} />
		<label for="company-filter-{company.logo}">{company.name}</label>
		<br />
	{/each} -->

	<div class="flex gap-2 mt-4 flex-wrap">
		{#each companies as company}
			<button
				class=" flex space-x-2 items-center rounded-full font-semibold tracking-wide px-4 py-2 text-black text-xs {company.selected
					? 'border-2 border-black'
					: 'border-2 border-gray-300'}"
				on:mousedown={() => onClickCompany(company)}
				aria-label={company.name}
			>
				<img
					src="../icons/atx-companies/{company.logo}.svg"
					alt={company.logo}
					width="50"
					height="50"
					style="display: inline-block; height: 2em; object-fit: contain;"
				/>
				<span>{company.name}</span>
			</button>
		{/each}
	</div>

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
	{#if availableYears && !isFocusView}
		<select bind:value={selectedYear} on:change={handleSelectYear}>
			{#each availableYears as year}
				<option value={year}>{year}</option>
			{/each}
		</select>
	{/if}

	<!-- Freeze Y-Axis -->
	<label
		class="h-10 flex gap-1 text-sm items-center {freezeYAxis ? 'text-gray-700' : 'text-gray-400'}"
		transition:fade
	>
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M4 7L7 4L10 7"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M7 20V4"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M17 14.4444H12C11.4477 14.4444 11 14.9419 11 15.5556V18.8889C11 19.5025 11.4477 20 12 20H17C17.5523 20 18 19.5025 18 18.8889V15.5556C18 14.9419 17.5523 14.4444 17 14.4444Z"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M12.5 14.4444V12.2222C12.5 11.6329 12.7107 11.0676 13.0858 10.6509C13.4609 10.2341 13.9696 10 14.5 10C15.0304 10 15.5391 10.2341 15.9142 10.6509C16.2893 11.0676 16.5 11.6329 16.5 12.2222V14.4444"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<span>Y-Achse fixieren?</span>
		<input type="checkbox" bind:checked={freezeYAxis} />
	</label>

	<br />

	<!-- Chart -->
	{#if rawData}
		<div class="h-80">
			<CompanyEmissionsChart
				data={rawData}
				selectedCompanies={companies.filter((company) => company.selected)}
				{selectedScopes}
				{selectedYear}
				{freezeYAxis}
				{isFocusView}
			/>
		</div>
	{/if}

	<!-- Selected Companies List -->
	<!-- <div style="border: 1px solid black">
		<strong>Ausgewählte Unternehmen:</strong>
		<ul>
			{#each companies as company}
				{#if company.selected}
					<li>{company.name}</li>
				{/if}
			{/each}
		</ul>
	</div> -->
</div>
