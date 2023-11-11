<script>
	import companies from '$lib/stores/companies';
	import { onMount } from 'svelte';

	const goalsData = [
		{
			title: 'Klimaneutralitätsziel vorhanden?',
			info: 'Ja, nur wenn mindestens Scope 1,2 Emissionen von Klimaneutralitätsziel umfasst',
			field: 'climateNeutrality'
		},
		{
			title: 'In welchem Jahr wird Klimaneutralität angestrebt?',
			field: 'climateNeutralityYear'
		},
		{
			title: 'Welche Scopes umfasst das Klimaneutralitätsziel?',
			field: 'climateNeutralityScopes'
		},
		{
			title: 'Zwischenziel Emissionsreduktion vorhanden?',
			field: 'intermediateGoal'
		},
		{
			title: 'Mitglied der Science Based Target (SBT) Initiative?',
			field: 'memberSBT'
		}
	];

	let companyGoalData = null;

	onMount(() => {
		getData();
	});

	async function getData() {
		let response = await fetch(`../data/at/companies/atx_climate_goals.json`);
		let data = await response.json();
		if (response.ok) {
			companyGoalData = data;
		} else {
			throw new Error(data);
		}
	}
</script>

{#if companyGoalData}
	{#each goalsData as goal}
		<div class="text-4xl mt-20">{goal.title}</div>
		{@const options = companyGoalData.reduce((options, c) => {
			if (options.indexOf(c[goal.field]) == -1) return [...options, c[goal.field]];
			return options;
		}, [])}
		{#each options as option}
			<strong class="block text-2xl mt-10">{option}</strong>
			<div class="pl-8">
				{#each companyGoalData as company}
					{#if company[goal.field] == option}
						{@const companyMetaData = companies.find((c) => c.name == company.name)}
						<img
							src="../icons/atx-companies/{companyMetaData.logo}.svg"
							alt={companyMetaData.logo}
							width="50"
							height="50"
							style="display: inline-block; width: 4em; height: 4em; padding: 0.5em; object-fit: contain;"
						/>
					{/if}
				{/each}
			</div>
		{/each}
	{/each}
{/if}
