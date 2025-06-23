<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import { page } from '$app/state';

	let selectedStation = [];

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_data' : 'at_geosphere_data';

	$: getData = async function () {
		selectedStation = page.url.searchParams.get('weatherStation');

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

	let chartWidth;
</script>

<div>
	{#await promise}
		<Loader showText={true} />
	{:then data}
		{#if getRecordWinter(data).daysWithSnow < 200}
			<h2 class="text-2xl max-w-4xl text-center mx-auto text-balance">
				Im Rekordwinter {getRecordWinter(data).label.replace('Winter', '')} verzeichnete die Wetterstation
				{data.station.name}
				{getRecordWinter(data).daysWithSnow} Tage mit einer Schneehöhe von mindestens 1cm – im {data
					.winters[data.winters.length - 2].label}
				waren es {data.winters[data.winters.length - 2].daysWithSnow}.
			</h2>
		{/if}

		<div class="h-72" bind:clientWidth={chartWidth}>
			<BarChart
				data={data.winters.map((d, i) => {
					return {
						label: d.label.replace('Winter ', ''),
						categories: [
							{
								value: d.daysWithSnow,
								label: 'Schneedeckentage im ' + d.label,
								color: '#11998E',
								estimate: d == data.winters[data.winters.length - 1] ? true : false
							}
						]
					};
				})}
				xAxixInterval={chartWidth > 600 ? 10 : 20}
				visualisation={'stacked'}
				unit={'Schneedeckentage'}
				reverseLegend={true}
				marginLeft={40}
				marginRight={30}
			/>
		</div>
		<p class="text-lg">
			Während es auch in den vergangenen Jahren einzelne Winter mit relativ hoher Schneedeckung gab,
			ist über die vergangenen Jahre insgesamt ein Rückgang in der Anzahl der Tage mit mindestens 1
			cm Schnee zu beobachten. Die Schwankungen zwischen den Jahren bleiben dabei deutlich.
		</p>
	{:catch error}
		{JSON.stringify(error)}
	{/await}
</div>
