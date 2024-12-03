<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Chart from './Chart.svelte';

	let selectedStation = 101;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_data' : 'at_geosphere_data';

	async function getData() {
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
										_eq: parseInt(3379)
									}
								}
							},
							{
								sh: {
									_gte: 1
								}
							}
						]
					},
					limit: -1
				})
			);
			return data;
		} else {
			return false;
		}
	}

	function calculateSnowHeights(data) {
		const snowHeights = {};

		data.forEach(({ date, sh }) => {
			const currentDate = new Date(date);
			const year = currentDate.getFullYear();
			const month = currentDate.getMonth() + 1; // Months are 0-indexed
			const day = currentDate.getDate();

			if (month === 12 && (day === 24 || day === 25 || day === 26)) {
				if (!snowHeights[year]) {
					// Initialize snow heights for the three days to null
					snowHeights[year] = { 24: null, 25: null, 26: null };
				}
				// Assign snow height if sh is 0 or greater
				if (sh >= 0) {
					snowHeights[year][day] = sh;
				}
			}
		});

		// Generate an array from 1950 to the current year
		const currentYear = new Date().getFullYear();
		const snowHeightsArray = [];

		for (let year = 1950; year <= currentYear; year++) {
			const days = snowHeights[year];

			if (days && days[24] !== null && days[25] !== null && days[26] !== null) {
				// All three days have valid snow height data
				snowHeightsArray.push({
					year,
					sh24: days[24],
					sh25: days[25],
					sh26: days[26],
					hasData: true
				});
			} else {
				// Missing data for one or more days
				snowHeightsArray.push({
					year,
					sh24: days?.[24] ?? 0,
					sh25: days?.[25] ?? 0,
					sh26: days?.[26] ?? 0,
					hasData: false
				});
			}
		}

		return snowHeightsArray;
	}

	$: promise = getData().then(calculateSnowHeights);
</script>

<div>
	{#await promise}
		<Loader showText={true} />
	{:then data}
		<Chart {data} />
	{:catch error}
		{error}
	{/await}
</div>
