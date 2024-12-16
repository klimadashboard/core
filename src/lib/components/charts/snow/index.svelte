<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import { page } from '$app/stores';

	$: selectedStation = $page.url.searchParams.get('weatherStation')
		? parseInt($page.url.searchParams.get('weatherStation'))
		: 555;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_data' : 'at_geosphere_data';

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		if (selectedStation) {
			const station = await directus.request(
				readItem(tableName.replace('_data', '_stations'), selectedStation)
			);
			const data = await directus.request(
				readItems(tableName, {
					fields: ['date', 'sh'],
					filter: {
						_and: [
							{
								station: {
									id: {
										_eq: selectedStation
									}
								}
							},
							{
								sh: {
									_gte: 1 // Include only days with snow (sh > 0)
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

				// Calculate winter metrics
				currentWinter.daysWithSnow += 1; // Every entry is a snow day now
				if (previousSh !== null && entry.sh > previousSh) {
					currentWinter.totalSnowAccumulation += entry.sh - previousSh;
				}

				previousSh = entry.sh;
			});

			// Push the last winter
			if (currentWinterStartYear !== null) {
				winters.push({ ...currentWinter });
			}

			return {
				winters: winters,
				station: station
			};
		} else {
			return false;
		}
	};

	$: promise = getData();

	$: getRecordWinter = function (data) {
		return data.winters.find(
			(d) => d.daysWithSnow === Math.max(...data.winters.map((d) => d.daysWithSnow))
		);
	};
</script>

<div>
	{#await promise}
		<Loader showText={true} />
	{:then data}
		<h2 class="text-2xl max-w-4xl text-center mx-auto text-balance">
			Die Wetterstation {data.station.name} meldete im {getRecordWinter(data).label} mit {getRecordWinter(
				data
			).daysWithSnow} Schneedeckentagen einen Rekord, während es im {data.winters[
				data.winters.length - 2
			].label}
			{data.winters[data.winters.length - 2].daysWithSnow} Schneedeckentage gab.
		</h2>

		<div class="h-72">
			<BarChart
				data={data.winters.map((d, i) => {
					return {
						label: d.label,
						categories: [
							{
								value: d.daysWithSnow,
								label: 'Schneedeckentage im ' + d.label,
								color: '#11998E'
							}
						]
					};
				})}
				xAxixInterval={10}
				visualisation={'stacked'}
				unit={'Schneedeckentage'}
			/>
		</div>
	{:catch error}
		{error}
	{/await}
</div>
