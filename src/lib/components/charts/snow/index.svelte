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
							}
						]
					},
					limit: -1
				})
			);

			// Sort data by date ascending
			const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));

			const winters = [];
			let currentWinter = {
				label: '',
				daysWithSnow: 0,
				totalSnowAccumulation: 0
			};
			let previousSh = null;
			let currentWinterStartYear = null;

			sortedData.forEach((entry) => {
				const date = new Date(entry.date);
				const year = date.getFullYear();
				const month = date.getMonth() + 1; // Months are 0-based

				// Determine the winter start year
				let winterStartYear;
				if (month >= 7) {
					// July to December
					winterStartYear = year;
				} else {
					// January to June
					winterStartYear = year - 1;
				}

				// Initialize new winter if not set or different from current
				if (currentWinterStartYear !== winterStartYear) {
					// Push the previous winter to the array
					if (currentWinterStartYear !== null) {
						winters.push({ ...currentWinter });
					}
					// Start a new winter
					currentWinterStartYear = winterStartYear;
					currentWinter = {
						label: `Winter ${winterStartYear}-${winterStartYear + 1}`,
						daysWithSnow: 0,
						totalSnowAccumulation: 0
					};
					previousSh = null; // Reset previousSh for the new winter
				}

				if (previousSh !== null) {
					if (entry.sh > previousSh) {
						currentWinter.daysWithSnow += 1;
						currentWinter.totalSnowAccumulation += entry.sh - previousSh;
					}
				}

				previousSh = entry.sh;
			});

			// Push the last winter
			if (currentWinterStartYear !== null) {
				winters.push({ ...currentWinter });
			}
			return winters;
		} else {
			return false;
		}
	}

	$: promise = getData();
</script>

<div>
	{#await promise}
		<Loader showText={true} />
	{:then winters}
		<Chart {winters} />
	{:catch error}
		{error}
	{/await}
</div>
