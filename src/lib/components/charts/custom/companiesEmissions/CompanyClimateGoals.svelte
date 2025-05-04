<script lang="ts">
	import CheckIcon from './CheckIcon.svelte';
	import XIcon from './XIcon.svelte';
	import type { CompanyMetaData } from './types';

	export let companiesGoalData: CompanyMetaData[] = [];

	let isOMV: boolean = false;
	$: isOMV = !!companiesGoalData.filter((company) => company.name === 'OMV AG').length;

	const tableCellClasses = 'text-semibold text-sm text-center px-1 leading-tight py-1';
</script>

{#if !companiesGoalData}
	<p>Loading...</p>
{:else if companiesGoalData}
	<table class="mx-auto rounded">
		<thead>
			<tr class="border-b">
				<th class="{tableCellClasses} text-left"></th>
				<th class="{tableCellClasses} text-left">Klimaneutralitätsziel</th>
				<th class="{tableCellClasses} text-center"
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
				<tr class="border-b">
					<td class={tableCellClasses}>
						<img
							src="https://base.klimadashboard.org/assets/{company.logoId}"
							alt={company.name}
							width="80"
							height="80"
							class="inline-block w-24 h-16 p-2 m-1 object-contain dark:bg-gray-100 rounded-xl"
							title={company.name}
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
					<td class={tableCellClasses}>
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
{/if}
{#if isOMV}
	<p class="text-sm pt-4">
		*Öl und Gaskonzerne wie die OMV können aktuell nicht an der Science Based Target Initative
		teilnehmen (SBTi Oil and Gas) und ihre Emmissionsziele validieren lassen.
	</p>
{/if}
