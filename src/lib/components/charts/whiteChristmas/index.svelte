<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Chart from './Chart.svelte';
	import StationPicker from '$lib/components/charts/stationPicker/index.svelte';

	let selectedStation;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_data' : 'at_geosphere_data';

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		if (selectedStation) {
			const data = await directus.request(
				readItems(tableName, {
					fields: ['date', 'sh'],
					filter: {
						_and: [
							{
								station: {
									id: {
										_eq: parseInt(selectedStation.id)
									}
								}
							}
						]
					},
					limit: -1
				})
			);

			const correctedData = data.map((d) => {
				return {
					date: d.date,
					sh: d.sh == -1 ? 0 : d.sh
				};
			});

			const snowHeights = {};

			// Populate snowHeights with entries for Dec 24, 25, and 26
			correctedData.forEach(({ date, sh }) => {
				const d = new Date(date);
				const year = d.getFullYear();
				const month = d.getMonth() + 1;
				const day = d.getDate();

				if (month === 12 && [24, 25, 26].includes(day) && sh >= 0) {
					snowHeights[year] = snowHeights[year] || { 24: null, 25: null, 26: null };
					snowHeights[year][day] = sh;
				}
			});

			const currentYear = new Date().getFullYear();
			const snowHeightsArray = [];

			for (let year = 1960; year <= currentYear; year++) {
				const { 24: sh24 = null, 25: sh25 = null, 26: sh26 = null } = snowHeights[year] || {};
				const allNull = sh24 === null && sh25 === null && sh26 === null;

				// If all null, no data. Otherwise, replace nulls with 0.
				snowHeightsArray.push({
					year,
					sh24: allNull ? null : sh24 ?? 0,
					sh25: allNull ? null : sh25 ?? 0,
					sh26: allNull ? null : sh26 ?? 0,
					hasData: !allNull
				});
			}

			return snowHeightsArray;
		} else {
			return false;
		}
	};

	$: promise = getData();
</script>

<StationPicker bind:selectedStation />

<div class="w-full">
	{#await promise then data}
		<Chart {data} {selectedStation} />
	{:catch error}
		{error}
	{/await}
</div>
