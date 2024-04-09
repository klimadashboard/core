<script>
	// @ts-nocheck
	import atxCompanies, { companyId } from '$lib/stores/companies';
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';
	import CompanyEmissionsLineChart from './CompanyEmissionsLineChart.svelte';
	import ViewSwitch from './ViewSwitch.svelte';

	let selectedScopes = '1';
	let selectedYear = '2020';
	let selectedSector = '';
	let rawData;
	let availableYears;
	let isFocusView = true;

	// $: console.log('companyId', $companyId);

	// use companies data with `selected: true` as default
	$: companies = atxCompanies.map((company) => {
		return {
			...company,
			selected: true
		};
	});

	// $: sectors = Array.from(new Set(atxCompanies.map((company) => [company.sector)));
	$: sectors = atxCompanies.reduce((accumulator, company) => {
		if (!accumulator.some((item) => item.name === company.sector && item.icon === company.icon)) {
			accumulator.push({ name: company.sector, icon: company.icon });
		}
		return accumulator;
	}, []);

	$: if (isFocusView) {
		deselectAll();
		companies[1].selected = true;
	}

	// $: if (!isFocusView) {
	// 	selectAll();
	// }

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
	<div class="flex">
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
			}}
			>Alle abwählen
		</button>
		<div class="ml-auto">
			<ViewSwitch bind:isChecked={isFocusView} />
		</div>
	</div>
	<br />

	<div class="flex flex-wrap">
		{#each sectors as sector}
			<button
				class="inline-flex items-center justify-center rounded-full font-semibold px-4 py-1 text-black text-xs bg-gray-100 mr-2 gap-2 mb-2"
				aria-label={sector}
				title={sector.name}
				on:click={() => (selectedSector = sector.name)}
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
		<button
			class="inline-flex items-center justify-center rounded-full font-semibold px-4 py-1 text-black text-xs bg-gray-100 mr-2 gap-2 mb-2"
			aria-label="all"
			title="All Sectors"
			on:click={() => (selectedSector = '')}
		>
			<img src="../icons/emission-sectors/DotsIcon.svg" alt="Energy" height="60" class="h-4" />
			<span class="font-semibold tracking-wide text-gray-600">All</span>
		</button>
	</div>
	<br />
	<div class="flex flex-wrap gap-2">
		{#each companies as company}
			{#if company.sector === selectedSector || selectedSector === ''}
				<button
					class="flex items-center rounded-xl font-semibold tracking-wide px-4 py-1.5 gap-2 text-black text-xs {company.selected
						? 'border-2 border-black'
						: 'border-2 border-gray-300'}"
					on:mousedown={() => onClickCompany(company)}
					aria-label={company.name}
					title={company.name}
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
			{/if}
		{/each}
	</div>

	<!-- Scope Selector -->
	<select bind:value={selectedScopes} on:change={handleSelectScope} class="mb-4 mt-2">
		<option value="1">Scope 1</option>
		<option value="2">Scope 2</option>
		<option value="3">Scope 3</option>
		<option value="12">Scope 1+2</option>
		<option value="123">Scope 1+2+3</option>
	</select>

	<br />

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
</div>
