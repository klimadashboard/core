<script>
	import companies from '$lib/stores/companies';
	import CheckIcon from './CheckIcon.svelte';
	import XIcon from './XIcon.svelte';

	export let companiesGoalData = [];

	let isOMV = false;
	$: isOMV = !!companiesGoalData.filter((company) => company.name === 'OMV AG').length;

	const tableCellClasses = 'text-semibold text-sm text-center px-1 leading-tight py-1';
</script>

{#if !companiesGoalData}
	<p>Loading...</p>
{:else if companiesGoalData}
	<table class="mx-auto">
		<thead>
			<tr class="border-b">
				<th class="{tableCellClasses} text-left bg-white text-white">Logo Images</th>
				<th class="{tableCellClasses} text-left">Klimaneutralitätsziel</th>
				<th class="{tableCellClasses} text-left"
					>Mitglied der <br />Science-Based-Target Initiative</th
				>
			</tr>
		</thead>
		<tbody>
			{#if companiesGoalData.length === 0}
				<tr>
					<td class="text-center text-sm pt-3" colspan="5">Keine Unternehmen ausgewählt</td>
				</tr>
			{/if}
			{#each companiesGoalData as company (company.name)}
				{@const companyMetaData = companies.find((c) => c.name == company.name)}
				<tr class="border-b">
					<td class={tableCellClasses}>
						<img
							src="https://base.klimadashboard.org/assets/{company.logoId}"
							alt={companiesGoalData.name}
							width="80"
							height="80"
							class="inline-block w-24 h-16 p-1 object-contain"
							title={companiesGoalData.name}
						/>
					</td>
					<td class={tableCellClasses}>
						{#if company.climate_neutrality_goal === 'Nein'}
							<XIcon additionalClasses="mx-auto" />
						{:else}
							<CheckIcon additionalClasses="mx-auto" />
							<b>{company.climate_neutrality_goal}</b><br />
							{#if company.climate_neutrality_scopes === null}
								ohne definierte Scopes
							{:else}
								für Scope {company.climate_neutrality_scopes}
							{/if}
						{/if}
					</td>
					<td class={tableCellClasses} title={company.member_sbt}>
						{#if company.member_sbt}
							<CheckIcon additionalClasses="mx-auto" />
						{:else}
							<XIcon additionalClasses="mx-auto inline" />
							{#if company.name === 'OMV AG'}<span>*</span>{/if}
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if isOMV}
		<p class="text-sm pt-4">
			*Öl und Gaskonzerne wie die OMV können aktuell nicht an der Science Based Target Initative
			teilnehmen (SBTi Oil and Gas) und ihre Emmissionsziele validieren lassen.
		</p>
	{/if}
{/if}
