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
	let isFocusView = true;
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
		if (!isFocusView) {
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

	function toggleScope(scope) {
		if (selectedScopes.length === 1 && selectedScopes[0] === scope) return;
		const index = selectedScopes.indexOf(scope);
		if (index === -1) {
			selectedScopes = [...selectedScopes, scope];
		} else {
			selectedScopes.splice(index, 1);
			selectedScopes = selectedScopes;
		}
	}
</script>

<div>
	<h2 class="text-2xl mt-8 mb-4 border-b py-2">Emissionen</h2>
	<!-- Sector Selector -->
	<div class="flex font-semibold text-sm mb-1">
		<span class="mb-1">Sektoren</span>
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
	<div class="flex mb-2 flex-wrap gap-x-3">
		<p class="font-semibold text-sm">Unternehmen</p>
		<div class="flex flex-wrap text-sm text-underline gap-x-3 md:ml-6">
			<button
				class="disabled:opacity-50"
				disabled={selectedSector === '' || !isFocusView}
				on:click={() => {
					selectAll();
				}}
			>
				Sektor auswählen
			</button>
			<button
				class="disabled:opacity-50"
				disabled={allDeselected || !isFocusView}
				on:click={() => {
					deselectAll();
				}}
			>
				Auswahl löschen
			</button>
			<button
				class="md:ml-6 flex items-center {isFocusView ? 'text-agriculture' : 'text-energy'}"
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
	<!-- Companies v1 -->
	<div class="flex flex-wrap gap-2 mb-4">
		{#each companies as company}
			<button
				class="flex items-center rounded-xl font-semibold p-1 md:px-3 py-1 gap-1.5 text-black text-xs bg-gray-100
					{company.selected ? 'border-2 border-green-600' : 'border-2'}
					{company.sector === selectedSector || selectedSector === '' ? '' : 'opacity-50'}
					{company.sector === selectedSector && !company.selected ? 'border-gray-300' : ''}"
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
		{/each}
	</div>

	<div class="flex flex-wrap mb-2">
		<p class="font-semibold text-sm mr-4 mb-1">Emissionsquellen</p>
		<div class="flex gap-x-3">
			{#each scopes as scope}
				<button
					class="inline-flex items-center justify-center rounded-full font-semibold px-3 py-1 text-xs gap-2 mb-2
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
	</div>

	<!-- Chart -->
	{#if rawData}
		<div class="h-72">
			<CompanyEmissionsLineChart
				{rawData}
				selectedCompanies={companies.filter((company) => company.selected)}
				{selectedScopes}
				{selectedYear}
			/>
		</div>
	{/if}
	<br />
	<h2 class="text-2xl mt-8 mb-4 border-b py-2">Klimaziele</h2>
	<CompanyClimateGoals selectedCompanies={companies.filter((company) => company.selected)} />
</div>
