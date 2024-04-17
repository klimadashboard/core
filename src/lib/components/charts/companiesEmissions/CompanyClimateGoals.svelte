<script>
	import companies from '$lib/stores/companies';
	import { onMount } from 'svelte';

	export let selectedCompanies = [];

	let companyGoalData = null;
	let originalData = null;
	const tableCellClasses = 'px-4 text-center';

	onMount(() => {
		getData();
	});

	async function getData() {
		let response = await fetch(
			// `https://data.klimadashboard.org/at/companies/atx_climate_goals.json`
			`../data/at/companies/atx_climate_goals.json`
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
		if (originalData && selectedCompanies.length > 0) {
			const selectedCompanyNames = selectedCompanies.map((company) => company.name);
			companyGoalData = originalData.filter((company) =>
				selectedCompanyNames.includes(company.name)
			);
		} else {
			companyGoalData = originalData;
		}
	}

	function mapStatusToIcon(status) {
		const mapping = {
			Ja: '✅',
			Nein: '❌'
		};
		mapping['nicht definiert'] = '❓';
		return mapping[status] || status; // Returns the original status if it's neither of the above
	}
</script>

{#if companyGoalData}
	<table class="min-w-full">
		<thead>
			<tr class="border-b">
				<th class="{tableCellClasses} text-left bg-white" />
				<th class="{tableCellClasses} text-left">Climate Neutrality</th>
				<th class="{tableCellClasses} text-left">Target Year</th>
				<th class="{tableCellClasses} text-left">Scopes</th>
				<th class="{tableCellClasses} text-left">Intermediate Goal</th>
				<th class="{tableCellClasses} text-left">Member SBT</th>
			</tr>
		</thead>
		<tbody>
			{#each companyGoalData as company (company.name)}
				{@const companyMetaData = companies.find((c) => c.name == company.name)}
				<tr class="border-b">
					<td class={tableCellClasses}>
						<img
							src="../icons/atx-companies/{companyMetaData.logo}.svg"
							alt={companyMetaData.logo}
							width="50"
							height="50"
							style="display: inline-block; width: 4em; height: 4em; padding: 0.5em; object-fit: contain;"
							title={companyMetaData.name}
						/>
					</td>
					<td class={tableCellClasses}>{mapStatusToIcon(company.climateNeutrality)}</td>
					<td class={tableCellClasses} title={company.climateNeutralityYear}
						>{mapStatusToIcon(company.climateNeutralityYear)}</td
					>
					<td class={tableCellClasses} title={company.climateNeutralityYear}
						>{mapStatusToIcon(company.climateNeutralityScopes)}</td
					>
					<td class={tableCellClasses} title={company.intermediateGoal}
						>{mapStatusToIcon(company.intermediateGoal)}</td
					>
					<td class={tableCellClasses} title={company.memberSBT}
						>{mapStatusToIcon(company.memberSBT)}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
