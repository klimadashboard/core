<script>
	import Chart from './Chart.svelte';
	import Papa from 'papaparse';
	// Removed: import _ from 'lodash';
	import Details from './Details.svelte';
	import { onMount } from 'svelte';
	import Switch from '$lib/components/Switch.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	const energyTypes = [
		{
			key: 'Wind',
			label: 'Windenergie',
			dataKey: 'windkraft',
			color: '#4C8EB3',
			colorScale: ['#4C8EB3', '#B8D2E0'],
			regions: ['at', 'de'],
			icon: "<svg width='17' height='20' viewBox='0 0 17 20' fill='none' xmlns='http://www.w3.org/2000/svg' class='w-8 h-8'><path d='M7 10C7 12.76 9.01 13 11.5 13C13.99 13 16 12.76 16 10H7Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M6.5 10.0475C8.89023 8.6675 8.245 6.6564 7 4.5C5.755 2.3436 4.39023 0.873272 2 2.25327L6.5 10.0475Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.67072 10.2533C5.28049 8.87327 3.745 10.3436 2.5 12.5C1.255 14.6564 0.780485 16.6675 3.17072 18.0475L7.67072 10.2533Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'PV',
			label: 'Photovoltaik',
			dataKey: 'pv',
			color: '#E0A906',
			colorScale: ['#E0A906', '#E8CD7D'],
			regions: ['at', 'de'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-sun' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><circle cx='12' cy='12' r='4'></circle><path d='M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7'></path></svg>"
		},
		{
			key: 'Wasserkraft',
			label: 'Wasserkraft',
			dataKey: 'wasserkraft',
			color: '#08519C',
			colorScale: ['#08519C', '#7098C2'],
			regions: ['at'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-ripple' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M3 7c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 17c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 12c3 -2 6 -2 9 0s6 2 9 0'></path></svg>"
		}
		// {
		// 	key: 'Biomasse',
		// 	label: 'Biomasse',
		// 	dataKey: 'biomasse',
		// 	color: '#00441B',
		// 	colorScale: ['#00441B', '#66997A'],
		// 	regions: ['at'],
		// 	icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-growth' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M16.5 15a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m-4 3.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m0 -7.5v6'></path></svg>"
		// }
	];

	let bundeslaender = {
		Kärnten: 'KTN',
		Burgenland: 'BU',
		Niederösterreich: 'NÖ',
		Oberösterreich: 'OÖ',
		Salzburg: 'SBG',
		Steiermark: 'STMK',
		Tirol: 'T',
		Vorarlberg: 'VBG',
		Wien: 'W'
	};

	let potentiale_2030;
	let potentiale_techn;

	let dataset;
	let energyByBundesland;
	let minYear;
	let maxYear;
	let selectedBundesland = 'Kärnten';

	let goals;
	let showTechn = false;

	const getDataPotentiale = async function (/** @type {string} */ potential_class) {
		try {
			const directus = getDirectusInstance(fetch);
			let potentiale_data = await directus.request(
				readItems('ee_potentiale', {
					filter: {
						_and: [
							{
								Country: { _eq: PUBLIC_VERSION.toUpperCase() },
								potential_class: { _eq: potential_class }
							}
						]
					},
					limit: -1,
					fields: ['Type', 'potential_class', 'region.name', 'value_TWh']
					// sort: ['name']
				})
			);
			potentiale_data = potentiale_data.map((row) => {
				return {
					energy: row['Type'][0],
					potential_class: row['potential_class'][0],
					region: row['region']['name'],
					value_TWh: row['value_TWh']
				};
			});

			const potentiale_temp = {};

			Object.keys(bundeslaender).forEach((bundesland) => {
				potentiale_temp[bundesland] = {};

				const water = +potentiale_data.find(
					(row) => row.region === bundesland && row.energy === 'water'
				)?.value_TWh;
				potentiale_temp[bundesland]['wasserkraft'] = water;
				const wind = +potentiale_data.find(
					(row) => row.region === bundesland && row.energy === 'wind'
				)?.value_TWh;
				potentiale_temp[bundesland]['windkraft'] = wind;
				const pv =
					+potentiale_data.find((row) => row.region === bundesland && row.energy === 'pv_area')?.value_TWh +
					potentiale_data.find((row) => row.region === bundesland && row.energy === 'pv_roof')?.value_TWh;
				potentiale_temp[bundesland]['pv'] = pv;
			});

			return potentiale_temp;
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};

	const getPotentiale2030 = async function () {
		potentiale_2030 = await getDataPotentiale('until_2030');
	};
	$: getPotentiale2030();

	const getPotentialeTechn = async function () {
		potentiale_techn = await getDataPotentiale('technical');
	};
	$: getPotentialeTechn();

	const getDataHistoric = async function () {
		try {
			const directus = getDirectusInstance(fetch);
			dataset = await directus.request(
				readItems('ee_historisch', {
					filter: {
						_and: [
							{
								Country: { _eq: PUBLIC_VERSION.toUpperCase() }
							}
						]
					},
					limit: -1,
					fields: ['year', 'region.name', 'pv', 'windkraft', 'wasserkraft'],
					sort: ['year']
				})
			);

			dataset = dataset.map((row) => {
				return {...row, region: row["region"]["name"]};
			});

			const years = dataset.map((row) => row.year);
			minYear = Math.min(...years);
			maxYear = Math.max(...years);

			// Group rows by region without lodash using reduce
			energyByBundesland = dataset.reduce((groups, row) => {
				const region = row.region;
				if (!groups[region]) {
					groups[region] = [];
				}
				groups[region].push(row);
				return groups;
			}, {});

		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};

	$: getDataHistoric();

	const getDataGoals = async function () {
		try {
			const directus = getDirectusInstance(fetch);
			dataset = await directus.request(
				readItems('ee_goals', {
					filter: {
						_and: [
							{
								Country: { _eq: PUBLIC_VERSION.toUpperCase() }
							}
						]
					},
					limit: -1,
					fields: ['Type', "goal_amount", "goal_year", "source_year", 'region.name'],
				})
			);

			goals = dataset.map((row) => {
				return {...row, region: row["region"]["name"], Type: row["Type"][0]};
			});

		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};

	$: getDataGoals();

	$: selectedStartYear = minYear;
</script>

<div class="flex gap-4 items-center">
	<div>
		<label class="flex gap-1 items-center cursor-pointer {showTechn ? '' : ''}">
			<span>Technisch mögliche Potentiale</span>
			<input type="checkbox" bind:checked={showTechn} />
		</label>
	</div>
	<div class="flex items-center gap-2">
		<span>Startjahr auswählen</span>
		<input type="number" min={minYear} max={maxYear} bind:value={selectedStartYear} class="input" />
	</div>
</div>

<div class="mt-4">
	{#if energyTypes && potentiale_2030 && energyByBundesland && selectedBundesland && dataset && goals}
		<div class="flex flex-wrap gap-2 items-center">
			{#each Object.keys(energyByBundesland) as bundesland}
				<button
					class="button {selectedBundesland === bundesland ? '' : 'opacity-50'}"
					on:click={() => {
						selectedBundesland = bundesland;
					}}
					on:keydown={() => {
						selectedBundesland = bundesland;
					}}>{bundesland}</button
				>
			{/each}
		</div>
		<div class="grid gap-4 md:grid-cols-3 mt-4">
			{#each energyTypes as type}
				{@const cur_goals = goals.filter(
					(row) =>
						row.state_name === selectedBundesland &&
						row.energy_data_key === type.dataKey &&
						row.goal_amount != 'keinZiel'
				)}
				<Details
					bundesland={selectedBundesland}
					{type}
					{selectedStartYear}
					{showTechn}
					potential_techn={potentiale_techn[selectedBundesland][type.dataKey]}
					potential_2030={potentiale_2030[selectedBundesland][type.dataKey]}
					goals={cur_goals}
					dataset={energyByBundesland[selectedBundesland]
						?.map((row) => {
							return {
								year: row.year,
								value: row[type.dataKey]
							};
						})
						.filter((row) => !isNaN(row.value) && row.value != null)}
				/>
			{/each}
		</div>
	{/if}
</div>
