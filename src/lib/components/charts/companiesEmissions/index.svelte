<script>
	// @ts-nocheck
	import atxCompanies, { companyId } from '$lib/stores/companies';
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';
	import CompanyEmissionsLineChart from './CompanyEmissionsLineChart.svelte';
	import ViewSwitch from './ViewSwitch.svelte';
	import CompanyClimateGoals from './CompanyClimateGoals.svelte';

	let selectedScopes = '1';
	let selectedYear = '2020';
	let selectedSector = '';
	let isAllSectorSelected = true;
	let rawData;
	let availableYears;
	let isFocusView = false;
	let initialCompany = 'Erste Group Bank AG';

	// use companies data with `selected: true` as default
	$: companies = atxCompanies.map((company) => {
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

	function handleSelectScope(event) {
		selectedScopes = event.target.value;
	}

	// Filter
	$: allSelected = companies.reduce((selected, company) => selected && company.selected, true);
	$: allDeselected = companies.reduce(
		(deselected, company) => deselected && !company.selected,
		true
	);

	// Load emissions data
	Papa.parse(
		`../../data/${PUBLIC_VERSION}/company-emissions/ATX_Emissions_Scope1_2_3_PathTo2040.csv`,
		// `https://data.klimadashboard.org/${PUBLIC_VERSION}/company-emissions/ATX_Emissions_Scope1_2_3.csv`,
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
	<div class="flex mb-2">
		<button
			class="text-sm text-blue underline disabled:opacity-50 mr-2"
			disabled={allSelected || isFocusView}
			on:click={() => {
				selectAll();
			}}>Alle auswählen</button
		>
		<button
			class="text-sm text-blue underline disabled:opacity-50"
			disabled={allDeselected || isFocusView}
			on:click={() => {
				deselectAll();
			}}
			>Auswahl löschen
		</button>
		<div class="ml-auto">
			<ViewSwitch bind:isChecked={isFocusView} />
		</div>
	</div>

	<!-- Sector Selector -->
	<details>
		<summary class="block font-semibold text-sm mb-1">Filter nach Kategorie</summary>
		<div class="flex flex-wrap">
			<button
				class="inline-flex items-center justify-center rounded-full font-semibold px-4 py-1 text-black text-xs bg-gray-100 mr-2 gap-2 mb-2 {isAllSectorSelected
					? 'bg-gray-300'
					: 'bg-gray-100'}"
				aria-label="all"
				title="All Sectors"
				on:click={() => {
					selectedSector = '';
					isAllSectorSelected = !isAllSectorSelected;
				}}
			>
				<img src="../icons/emission-sectors/DotsIcon.svg" alt="Energy" height="60" class="h-4" />
				<span class="font-semibold tracking-wide text-gray-600">All</span>
			</button>
			{#each sectors as sector}
				<button
					class="inline-flex items-center justify-center rounded-full font-semibold px-4 py-1 text-black text-xs bg-gray-100 mr-2 gap-2 mb-2 {selectedSector ===
					sector.name
						? 'bg-gray-300'
						: 'bg-gray-100'}"
					aria-label={sector}
					title={sector.name}
					on:click={() => {
						selectedSector = sector.name;
						isAllSectorSelected = false;
					}}
				>
					<img
						src="../icons/emission-sectors/{sector.icon}.svg"
						alt="Energy"
						height="60"
						class="h-4"
					/>
					<span class="font-semibold tracking-wide text-gray-600">{sector.name}</span>
				</button>
			{/each}
		</div>
	</details>

	<br />

	<!-- Company Selector -->
	<!-- <p class="block font-semibold text-sm mb-1">Wähle Unternehmen:</p> -->
	<div class="flex flex-wrap gap-2">
		{#each companies as company}
			{#if company.sector === selectedSector || company.selected || selectedSector === ''}
				<button
					class="flex items-center rounded-xl font-semibold tracking-wide px-4 py-1.5 gap-2 text-black text-xs {company.selected
						? 'border-2 border-black'
						: 'border-2 border-gray-300'}"
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
					{#if company.selected}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="icon icon-tabler icons-tabler-outline icon-tabler-trash-x h-4"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7h16" /><path
								d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"
							/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /><path
								d="M10 12l4 4m0 -4l-4 4"
							/></svg
						>
					{/if}
				</button>
			{/if}
		{/each}
	</div>

	<!-- Scope Selector -->
	<div class="flex my-3 gap-1">
		<label for="scopes" class="block font-semibold text-sm">Wähle den Scope:</label>
		<select bind:value={selectedScopes} on:change={handleSelectScope}>
			<option value="1">Scope 1</option>
			<option value="2">Scope 2</option>
			<option value="3">Scope 3</option>
			<option value="12">Scope 1+2</option>
			<option value="123">Scope 1+2+3</option>
		</select>
	</div>

	<!-- Chart -->
	{#if rawData}
		<div class="h-96">
			<CompanyEmissionsLineChart
				{rawData}
				selectedCompanies={companies.filter((company) => company.selected)}
				selectedScopes={Array.from(selectedScopes).map((scope) => `scope${scope}`)}
				{selectedYear}
			/>
		</div>
	{/if}
	<br />
	<CompanyClimateGoals selectedCompanies={companies.filter((company) => company.selected)} />
</div>

<style>
	details {
		user-select: none;
	}

	details > summary span.icon {
		width: 24px;
		height: 24px;
		transition: all 0.3s;
		margin-left: auto;
	}

	details[open] summary span.icon {
		transform: rotate(180deg);
	}

	summary {
		display: flex;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}
</style>
