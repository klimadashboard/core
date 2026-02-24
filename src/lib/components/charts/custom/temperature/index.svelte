<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import Wrapper from './Wrapper.svelte';
	import StationPicker from '$lib/components/charts/custom/stationPicker/index.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let chart;

	let selectedStation;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_data' : 'at_geosphere_data';

	async function getData() {
		const directus = getDirectusInstance(fetch);
		if (selectedStation) {
			const data = await directus.request(
				readItems(tableName, {
					filter: {
						_and: [
							{
								station: {
									id: {
										_eq: selectedStation.id
									}
								}
							},
							{
								date: {
									_gte: '1900-01-01'
								}
							}
						]
					},
					limit: -1,
					sort: ['date']
				})
			);
			return data;
		} else {
			return false;
		}
	}

	$: promise = getData();

	$: if (selectedStation) {
		promise = getData();
	}
</script>

<div>
	<StationPicker bind:selectedStation {chart} />

	{#if !selectedStation}
		<div class="opacity-70">
			<p class="text-center max-w-2xl mx-auto mb-2">
				Wähle ein Station aus, um mehr zur Temperaturentwicklung in deiner Region zu erfahren. Es
				werden nur Stationen angezeigt, die seit zumindest 1990 durchgehend Daten aufzeichnen.
			</p>
			<div class="grid gap-2 grid-cols-3 animate-pulse">
				<div class="bg-gray-100 dark:bg-gray-800 h-16 rounded-2xl"></div>
				<div class="bg-gray-100 dark:bg-gray-800 h-16 rounded-2xl"></div>
				<div class="bg-gray-100 dark:bg-gray-800 h-16 rounded-2xl"></div>
			</div>
		</div>
	{/if}

	{#await promise}
		<Loader showText={true} />
	{:then data}
		<Wrapper {data} {selectedStation} />
	{:catch error}
		{error}
	{/await}
</div>
