<script>
	import companies from '$lib/stores/companies';
	import { onMount } from 'svelte';
	import CheckIcon from './CheckIcon.svelte';
	import XIcon from './XIcon.svelte';

	export let selectedCompanies = [];
	$: console.log(selectedCompanies);

	let companyGoalData = null;
	let originalData = null;
	const tableCellClasses = 'text-semibold text-sm text-center px-1';

	onMount(() => {
		getData();
	});

	async function getData() {
		let response = await fetch(
			`https://data.klimadashboard.org/at/companies/atx_climate_goals_v2.json`
			// `../data/at/companies/atx_climate_goals_v2.json`
		);
		let data = await response.json();
		if (response.ok) {
			originalData = data;
			companyGoalData = data;
		} else {
			throw new Error(data);
		}
	}
	$: {
		if (originalData && selectedCompanies) {
			const selectedCompanyNames = selectedCompanies.map((company) => company.name);
			companyGoalData = originalData.filter((company) =>
				selectedCompanyNames.includes(company.name)
			);
		}
	}

	function mapStatusToIcon(status) {
		const mapping = {
			Ja: CheckIcon,
			Nein: XIcon
		};
		return mapping[status]; // Returns the original status if it's neither of the above
	}
</script>

{#if !companyGoalData}
	<p>Loading...</p>
{:else if companyGoalData}
	<table class="min-w-full">
		<thead>
			<tr class="border-b">
				<th class="{tableCellClasses} text-left bg-white text-white">Logo Images</th>
				<th class="{tableCellClasses} text-left">Klimaneutralitätsziel</th>
				<th class="{tableCellClasses} text-left">Umfasste Scopes</th>
				<th class="{tableCellClasses} text-left">Zwischenziel</th>
				<th class="{tableCellClasses} text-left">Mitglied Science-Based-Target Initiative</th>
			</tr>
		</thead>
		<tbody>
			{#if selectedCompanies.length === 0}
				<tr>
					<td class="text-center text-sm pt-3" colspan="5">Keine Unternehmen ausgewählt</td>
				</tr>
			{/if}
			{#each companyGoalData as company (company.name)}
				{@const companyMetaData = companies.find((c) => c.name == company.name)}
				<tr class="border-b">
					<td class={tableCellClasses}>
						<img
							src="../icons/atx-companies/{companyMetaData.logo}.svg"
							alt={companyMetaData.logo}
							width="64"
							height="64"
							class="inline-block w-12 h-8 p-1 object-contain"
							title={companyMetaData.name}
						/>
					</td>
					<td class={tableCellClasses}>
						{#if company.climateNeutrality === 'Nein'}
							<XIcon additionalClasses="mx-auto" />
						{:else}
							{company.climateNeutrality}
						{/if}
					</td>
					<td class={tableCellClasses} title={company.climateNeutralityScopes}
						>{#if company.climateNeutralityScopes === 'nicht definiert'}
							<XIcon additionalClasses="mx-auto" />
						{:else}
							{company.climateNeutralityScopes}
						{/if}</td
					>
					<td class={tableCellClasses} title={company.intermediateGoal}>
						<svelte:component
							this={mapStatusToIcon(company.intermediateGoal)}
							additionalClasses="mx-auto"
						/>
					</td>
					<td class={tableCellClasses} title={company.memberSBT}
						><svelte:component
							this={mapStatusToIcon(company.intermediateGoal)}
							additionalClasses="mx-auto"
						/></td
					>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
