<script>
	// @ts-nocheck
	import atxCompanies from '$lib/stores/companies';
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';
	import CompanyEmissionsLineChart from './CompanyEmissionsLineChart.svelte';
	import CompanyClimateGoals from './CompanyClimateGoals.svelte';

	let scopes = ['1', '2', '3'];
	let selectedScopes = ['1'];
	let selectedYear = '2020';
	let selectedSector = '';
	let rawData;
	let availableYears;
	let isFocusView = false;
	let initialCompany = 'Erste Group Bank AG';
	let sortBy = 'sector';

	// use companies data with `selected: true` as default
	$: companies = atxCompanies
		.sort((a, b) => {
			if (a[sortBy] < b[sortBy]) {
				return -1;
			}
			if (a[sortBy] > b[sortBy]) {
				return 1;
			}
			return 0;
		})
		.map((company) => {
			if (company.name === initialCompany) {
				return {
					...company,
					selected: true
				};
			} else {
				return {
					...company,
					selected: false
				};
			}
		});

	// $: sectors = Array.from(new Set(atxCompanies.map((company) => [company.sector)));
	$: sectors = atxCompanies.reduce((accumulator, company) => {
		if (!accumulator.some((item) => item.name === company.sector && item.icon === company.icon)) {
			accumulator.push({ name: company.sector, icon: company.icon });
		}
		return accumulator;
	}, []);

	function selectAll() {
		companies = companies.map((company) => {
			if (company.sector === selectedSector || selectedSector === '') {
				return { ...company, selected: true };
			} else {
				return company;
			}
		});
	}

	function deselectAll() {
		companies = companies.map((company) => {
			if (company.sector === selectedSector || selectedSector === '' || company.selected) {
				return { ...company, selected: false };
			} else {
				return company;
			}
		});
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

	// Filter
	$: allSelected = companies.reduce((selected, company) => selected && company.selected, true);
	$: allDeselected = companies.reduce(
		(deselected, company) => deselected && !company.selected,
		true
	);

	// Load emissions data
	Papa.parse(
		// `../../data/${PUBLIC_VERSION}/company-emissions/ATX_Emissions_Scope1_2_3_PathTo2040.csv`,
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

	function toggleScope(scope) {
		if (selectedScopes.length === 1 && selectedScopes[0] === scope) return;
		const index = selectedScopes.indexOf(scope);
		if (index === -1) {
			selectedScopes = [...selectedScopes, scope];
		} else {
			selectedScopes.splice(index, 1);
			selectedScopes = selectedScopes;
			console.log('🚀 ~ toggleScope ~ selectedScopes:', selectedScopes);
		}
	}
</script>

<div>
	<!-- Sector Selector -->
	<div class="flex block font-semibold text-sm mb-1">
		<span class="mb-1">Kategorien</span>
	</div>
	<!-- </summary> -->
	<div class="flex flex-wrap mb-2">
		{#each sectors as sector}
			<button
				class="inline-flex items-center justify-center rounded-full font-semibold px-3 py-1 text-xs mr-2 gap-2 mb-2
					{selectedSector === sector.name ? 'text-black bg-gray-300' : 'text-gray-600 bg-gray-100'}"
				aria-label={sector}
				title={sector.name}
				on:click={() => {
					if (selectedSector === sector.name) {
						selectedSector = '';
					} else {
						selectedSector = sector.name;
					}
				}}
			>
				<img
					src="../icons/emission-sectors/{sector.icon}.svg"
					alt="Energy"
					height="60"
					class="h-4"
				/>
				<span class="font-semibold tracking-wide">{sector.name}</span>
			</button>
		{/each}
	</div>

	<!-- Company Heading -->
	<div class="flex mb-2">
		<p class="font-semibold text-sm">Unternehmen</p>
		<div class="flex text-sm text-underline gap-2 ml-6">
			<button
				class="disabled:opacity-50"
				disabled={allSelected || isFocusView}
				on:click={() => {
					selectAll();
				}}
			>
				Alle auswählen
			</button>
			<button
				class="disabled:opacity-50"
				disabled={allDeselected || isFocusView}
				on:click={() => {
					deselectAll();
				}}
			>
				Auswahl löschen
			</button>
			<button
				class="ml-6 flex items-center {isFocusView ? 'text-agriculture' : 'text-energy'}"
				on:click={() => (isFocusView = !isFocusView)}
			>
				<span
					class="{isFocusView
						? 'bg-agriculture'
						: 'bg-energy'} h-3 w-3 inline-block rounded-full mr-1"
				/>
				{isFocusView ? 'Mehrfachauswahl: ein' : 'Mehrfachauswahl: aus'}
			</button>
		</div>
		<div class="ml-auto" />
	</div>
	<!-- Companies -->
	<div class="flex flex-wrap gap-2 mb-4">
		{#each companies as company}
			<!-- {#if company.sector === selectedSector || company.selected || selectedSector === ''} -->
			<button
				class="flex items-center rounded-xl font-semibold px-3 py-1 gap-1.5 text-black text-xs bg-gray-100
					{company.selected ? 'border-2 border-green-600' : 'border-2'}
					{company.sector === selectedSector || selectedSector === '' ? '' : 'opacity-50'}
					{company.sector === selectedSector && !company.selected ? 'border-gray-600' : ''}"
				on:mousedown={() => onClickCompany(company)}
				aria-label={company.name}
				title="{company.name} ({company.sector})"
			>
				<img
					src="../icons/emission-sectors/{company.icon}.svg"
					alt="Energy"
					height="60"
					class="h-4"
				/>
				<img
					src="../icons/atx-companies/{company.logo}.svg"
					alt={company.logo}
					width="60"
					height="60"
					class="inline-block h-6 object-contain"
				/>
			</button>
			<!-- {/if} -->
		{/each}
	</div>

	<!-- Scope Selector -->
	<!-- <div class="flex my-3 gap-1">
		<label for="scopes" class="block font-semibold text-sm">Wähle den Scope:</label>
		<select bind:value={selectedScopes} on:change={handleSelectScope}>
			<option value="1">Scope 1</option>
			<option value="2">Scope 2</option>
			<option value="3">Scope 3</option>
			<option value="12">Scope 1+2</option>
			<option value="123">Scope 1+2+3</option>
		</select>
	</div> -->

	<div class="flex flex-wrap mb-2">
		<p class="font-semibold text-sm mr-4">Scopes</p>
		{#each scopes as scope}
			<button
				class="inline-flex items-center justify-center rounded-full font-semibold px-3 py-1 text-xs mr-2 gap-2 mb-2
                {selectedScopes.includes(scope)
					? 'text-black bg-gray-300'
					: 'text-gray-600 bg-gray-100'}"
				aria-label={scope}
				on:click={() => toggleScope(scope)}
			>
				<span class="font-semibold tracking-wide">Scope {scope}</span>
			</button>
		{/each}
	</div>

	<!-- Chart -->
	{#if rawData}
		<div class="h-72">
			<CompanyEmissionsLineChart
				{rawData}
				selectedCompanies={companies.filter((company) => company.selected)}
				selectedScopes={selectedScopes.map((scope) => `scope${scope}`)}
				{selectedYear}
			/>
		</div>
	{/if}
	<br />
	<CompanyClimateGoals selectedCompanies={companies.filter((company) => company.selected)} />
</div>
