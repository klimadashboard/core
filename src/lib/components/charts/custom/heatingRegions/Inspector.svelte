<script>
	import PerDay from './PerDay.svelte';
	import Chart from './Chart.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	export let selectedRegion;

	$: getDataForSelectedRegion = async (region) => {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('energy_heating_systems', {
				filter: {
					region: {
						_eq: region
					}
				}
			})
		);
		console.log(data);
		return data;
	};

	$: promise = getDataForSelectedRegion(selectedRegion);
</script>

<div class="bg-white dark:bg-gray-800 rounded-2xl p-3">
	{#await promise then data}
		<p>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="inline -translate-y-0.5 -translate-x-1"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"
				/><path
					d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"
				/></svg
			><span>{data[0].region_label}</span>
		</p>
		<h2 class="text-4xl">Die Wärmewende stockt – Fossile Heizungen oftmals noch Standard</h2>
		<h3 class="text-lg">Heizungen nach Art des Energieträgers</h3>

		<Chart {data} />

		<PerDay {data} />

		<p class="opacity-80 leading-tight mt-4">
			<strong>Datenquelle</strong><br />Statistisches Bundesamt (2024): Zensus 2022, Eigene
			Berechnung
		</p>
	{/await}
</div>
