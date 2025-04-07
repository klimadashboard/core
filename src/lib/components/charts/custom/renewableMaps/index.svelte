<script>
	import Map from './Map.svelte';
	import Papa from 'papaparse';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	let data;
	let potentiale_2030;
	let potentiale_techn;

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

	// onMount(() => {
	// https://docs.google.com/spreadsheets/d/16kr90lRgPOteSYTa7hp5gOGA_49WdOqWSwSQty4uSZs/edit?usp=drive_link
	// Potentiale
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

	const keys = ['pv', 'windkraft'];
	const labels = ['Photovoltaik', 'Windkraft'];
	const colorRanges = [
		['#F6E5B4', '#E0A906'],
		['#C9DDE8', '#4C8EB3']
	];
</script>

<div class="grid md:grid-cols-2 gap-4">
	{#if potentiale_2030}
		{#each keys as key, i}
			<div>
				<Map data={potentiale_2030} {key} colorRange={colorRanges[i]} label={labels[i]} />
			</div>
		{/each}
	{/if}
</div>
