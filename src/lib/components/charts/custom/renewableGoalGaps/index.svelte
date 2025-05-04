<script>
	import Papa from 'papaparse';
	import Gap from './Gap.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let v;

	const goalScenarios = {
		eag: 'EAG',
		nekp: 'NEKP',
		önip: 'ÖNIP'
	};

	let selectedScenario = 'eag';

	const energyTypes = [
		{
			key: 'Wind',
			label: 'Windenergie',
			dataKey: 'windkraft',
			color: '#4C8EB3',
			colorScale: ['#4C8EB3', '#B8D2E0'],
			icon: "<svg width='17' height='20' viewBox='0 0 17 20' fill='none' xmlns='http://www.w3.org/2000/svg' class='w-8 h-8'><path d='M7 10C7 12.76 9.01 13 11.5 13C13.99 13 16 12.76 16 10H7Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M6.5 10.0475C8.89023 8.6675 8.245 6.6564 7 4.5C5.755 2.3436 4.39023 0.873272 2 2.25327L6.5 10.0475Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.67072 10.2533C5.28049 8.87327 3.745 10.3436 2.5 12.5C1.255 14.6564 0.780485 16.6675 3.17072 18.0475L7.67072 10.2533Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'PV',
			label: 'Photovoltaik',
			dataKey: 'pv',
			color: '#E0A906',
			colorScale: ['#E0A906', '#E8CD7D'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-sun' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><circle cx='12' cy='12' r='4'></circle><path d='M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7'></path></svg>"
		},
		{
			key: 'Wasserkraft',
			label: 'Wasserkraft',
			dataKey: 'wasserkraft',
			color: '#08519C',
			colorScale: ['#08519C', '#7098C2'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-ripple' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M3 7c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 17c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 12c3 -2 6 -2 9 0s6 2 9 0'></path></svg>"
		}
	];

	let dataset;
	const getEEGoals = async function () {
		try {
			const directus = getDirectusInstance(fetch);
			const dataset_temp = await directus.request(
				readItems('ee_goals', {
					filter: {
						_and: [
							{
								Country: { _eq: PUBLIC_VERSION.toUpperCase() }
							}
						]
					},
					limit: -1,
					fields: [
						'goal_amount',
						'goal_year',
						'source_year',
						'current_production',
						'region.name',
						'Type',
						'region.name_short'
					]
				})
			);

			dataset = dataset_temp.map((row) => {
				return {
					...row,
					state_name: row?.region?.name,
					energy_data_key: row?.Type[0],
					state_short: row?.region?.name_short
				};
			});
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};
	$: getEEGoals();

	let dataGoals;
	const getGoals = async function () {
		try {
			const directus = getDirectusInstance(fetch);
			const goals = await directus.request(
				readItems('erneuerbare_2030_scenarios', {
					filter: {
						_and: [
							{
								Country: { _eq: PUBLIC_VERSION.toUpperCase() }
							}
						]
					},
					limit: -1
				})
			);
			dataGoals = goals;
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};
	$: getGoals();
</script>

<!-- <div class="flex flex-wrap gap-2 justify-center items-center"> -->
<div class="flex flex-wrap gap-2 items-center">
	Wähle das Ausbauziel:
	{#each Object.keys(goalScenarios) as goalScenario}
		<button
			class="button {selectedScenario === goalScenario ? '' : 'opacity-50'}"
			on:click={() => {
				selectedScenario = goalScenario;
			}}
			on:keydown={() => {
				selectedScenario = goalScenario;
			}}>{goalScenarios[goalScenario]}</button
		>
	{/each}
</div>
{#if dataset && dataGoals}
	<div class="grid md:grid-cols-2 gap-1 my-4">
		{#each energyTypes as type}
			<Gap
				{type}
				{dataset}
				dataGoal={dataGoals.filter(
					(d) => d.energy_type == type.dataKey && d.scenario == selectedScenario
				)[0]}
				goalScenario={goalScenarios[selectedScenario]}
			/>
		{/each}
		<div class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
			<p>Für Biomasse stehen noch nicht ausreichend Daten zu Verfügung.</p>
		</div>
	</div>
{:else}
	<Loader />
{/if}
