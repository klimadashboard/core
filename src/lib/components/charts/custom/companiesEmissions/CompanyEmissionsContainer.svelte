<script lang="ts">
	import CompanyEmissionsLineChart from './CompanyEmissionsLineChart.svelte';
	import CompanyClimateGoals from './CompanyClimateGoals.svelte';
	import { getCompanyEmissionData, getAllSectors } from './getData';
	import Switch from '$lib/components/Switch.svelte';
	import { glossaryItem } from '$lib/stores/glossary';
	import DataDownload from './DataDownload.svelte';
	import { page } from '$app/state';
	import type { CompanyMetaData, CompanyMetaDataArray } from './types';

	export let companiesMetaData: CompanyMetaDataArray = [];
	export let chart;

	const scopes = [1, 2, 3];
	let selectedScopes: number[] = [1];
	let selectedSector = '';
	let isFocusView = true;
	let initialCompany = 'Erste Group Bank AG';
	let selectedCompaniesNames = [initialCompany];

	const views = [
		{
			key: 'location_based',
			label: 'standortbasiert',
			icon: null
		},
		{
			key: 'market_based',
			label: 'marktbasiert',
			icon: null
		}
	];
	let selectedScope2Category = 'location_based';

	type CompanyWithSelected = CompanyMetaData & { selected: boolean };

	$: companies = companiesMetaData.map((company) => {
		if (page.params.id && company.id === page.params.id) {
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
	}) as CompanyWithSelected[];

	function selectAll() {
		companies = companies.map((company) => {
			if (company.sectors.includes(selectedSector) || selectedSector === '') {
				return { ...company, selected: true };
			} else {
				return company;
			}
		});
	}

	function deselectAll() {
		companies = companies.map((company) => {
			if (company.sectors.includes(selectedSector) || selectedSector === '' || company.selected) {
				return { ...company, selected: false };
			} else {
				return company;
			}
		});
	}

	function onClickCompany(company: CompanyWithSelected) {
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
	$: allDeselected = companies.reduce(
		(deselected, company) => deselected && !company.selected,
		true
	);

	$: selectedCompaniesNames = companies
		.filter((company) => company.selected)
		.map((company) => company.name);

	function toggleScope(scope: number) {
		if (selectedScopes.length === 1 && selectedScopes[0] === scope) return;
		const index = selectedScopes.indexOf(scope);
		if (index === -1) {
			selectedScopes = [...selectedScopes, scope];
		} else {
			selectedScopes.splice(index, 1);
			selectedScopes = selectedScopes;
		}
	}

	function handleGlossaryButtonClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const term = target.dataset.term;
		if (term) {
			$glossaryItem = term;
		}
	}
</script>

<div>
	<!-- Sector Selector -->
	{#await getAllSectors()}
		<p>Loading Sectors...</p>
	{:then sectors}
		<div class="flex font-semibold text-sm mb-1">
			<span class="mb-1">Sektoren</span>
		</div>
		<div class="flex flex-wrap mb-2">
			{#each sectors as sector}
				<button
					class="inline-flex items-center justify-center rounded-full font-semibold px-3 py-1 text-xs mr-2 gap-2 mb-2 hover:cursor-pointer
        {selectedSector === sector.name
						? 'text-black bg-gray-300 '
						: 'text-gray-700 dark:text-gray-700 bg-gray-100 dark:bg-gray-500 '}"
					aria-label={sector.name}
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
						src={`https://base.klimadashboard.org/assets/${sector.icon}`}
						alt={sector.name}
						height="60"
						class="h-4"
					/>
					<span class="font-semibold tracking-wide">{sector.name}</span>
				</button>
			{/each}
		</div>
	{/await}

	<!-- Companies Selection Heading -->
	<div class="flex mb-2 flex-wrap gap-x-3">
		<p class="font-semibold text-sm">Unternehmen</p>
		<div class="flex flex-wrap text-sm text-underline gap-x-3 md:ml-6">
			<button
				class="disabled:opacity-50 hover:cursor-pointer"
				disabled={selectedSector === '' || !isFocusView}
				on:click={() => {
					selectAll();
				}}
			>
				Sektor auswählen
			</button>
			<button
				class="disabled:opacity-50 hover:cursor-pointer"
				disabled={allDeselected || !isFocusView}
				on:click={() => {
					deselectAll();
				}}
			>
				Auswahl löschen
			</button>
			<button
				class="md:ml-6 flex items-center {isFocusView
					? 'text-agriculture'
					: 'text-energy'} hover:cursor-pointer"
				on:click={() => (isFocusView = !isFocusView)}
			>
				<span
					class="{isFocusView
						? 'bg-agriculture'
						: 'bg-energy'} h-3 w-3 inline-block rounded-full mr-1"
				></span>
				{isFocusView ? 'Mehrfachauswahl: ein' : 'Mehrfachauswahl: aus'}
			</button>
		</div>
		<div class="ml-auto"></div>
	</div>
	<!-- Companies -->
	<div class="flex flex-wrap gap-2 mb-4">
		{#each companies as company}
			<button
				class="flex items-center rounded-xl font-semibold p-1 md:px-3 py-1 gap-1.5 text-black text-xs bg-gray-100 hover:cursor-pointer
        {company.selected ? 'border-2 border-green-600' : 'border-2 border-gray-100'}
        {company.sectors.includes(selectedSector) || selectedSector === '' ? '' : 'opacity-50'}
        {company.sectors.includes(selectedSector) && !company.selected ? 'border-gray-300' : ''}"
				on:mousedown={() => onClickCompany(company)}
				aria-label={company.name}
				title="{company.name} ({company.sectors.join(', ')})"
			>
				<img
					src="https://base.klimadashboard.org/assets/{company.sectorIconIds[0]}"
					alt={company.sectors.join(', ')}
					height="60"
					class="h-4"
				/>
				<img
					src="https://base.klimadashboard.org/assets/{company.logoId}"
					alt={company.name}
					width="60"
					height="60"
					class="inline-block h-6 object-contain"
				/>
			</button>
		{/each}
	</div>
	<div class="flex md:justify-between items-center mb-1 flex-wrap">
		<!-- Scopes -->
		<div class="flex flex-wrap mb-2 items-center">
			<p class="font-semibold text-sm mr-4">
				Emissionsquellen
				<button
					class="w-4 h-4 cursor-help rounded-full text-white text-xs"
					style="background: linear-gradient(90deg, #79ca94 0%, #2e9c5c 100%);"
					data-term="scopes"
					on:click={handleGlossaryButtonClick}
				>
					?
				</button>
			</p>

			<div class="flex gap-x-3 items-center">
				{#each scopes as scope}
					<button
						class="inline-flex items-center justify-center rounded-full font-semibold px-3 py-1 text-xs gap-2 shrink-0 hover:cursor-pointer
              {selectedScopes.includes(scope)
							? 'text-black bg-gray-100 border-2 border-green-600'
							: 'text-gray-600 bg-gray-100 border-2 border-gray-100'}"
						aria-label={`Scope ${scope}`}
						on:click={() => toggleScope(scope)}
					>
						<span class="font-semibold tracking-wide">Scope {scope}</span>
					</button>
				{/each}
				{#if selectedScopes.length > 1 && selectedCompaniesNames.length > 1}
					<p class="text-gray-600 dark:text-gray-300 text-sm">
						(ausgewählte Scopes werden summiert)
					</p>
				{/if}
			</div>
		</div>
		{#if selectedScopes.includes(2)}
			<Switch
				{views}
				activeView={selectedScope2Category}
				on:itemClick={(event) => {
					selectedScope2Category = event.detail;
				}}
				type="small"
			/>
		{/if}
	</div>

	<!-- Chart -->
	{#await getCompanyEmissionData()}
		<p>Loading...</p>
	{:then emissions}
		<div class="">
			<CompanyEmissionsLineChart
				{emissions}
				selectedCompanies={companies.filter((company) => company.selected)}
				{selectedScopes}
				{selectedScope2Category}
			/>
		</div>
		<DataDownload data={emissions} />
	{/await}
	<h2 class="text-2xl my-4 border-b py-2">Klimaziele</h2>
	<CompanyClimateGoals
		companiesGoalData={companiesMetaData.filter((company) =>
			selectedCompaniesNames.includes(company.name)
		)}
	/>
</div>
