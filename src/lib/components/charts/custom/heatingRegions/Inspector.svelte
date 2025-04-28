<script>
	import PerDay from './PerDay.svelte';
	import Chart from './Chart.svelte';
	import RegionComparison from './RegionComparison.svelte';
	import RegionSearch from './RegionSearch.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { getDataForSelectedRegion } from './getData';

	export let regions;
	export let selectedRegion;

	let categories = [
		{
			key: 'gas',
			label: 'Gasheizungen',
			color: '#005E61',
			featured: true
		},
		{
			key: 'district heating (various energy sources)',
			label: 'Fernwärme',
			color: '#800044',
			featured: true
		},
		{
			key: 'heating oil',
			label: 'Heizöl',
			color: '#895129',
			featured: true
		},
		{
			key: 'electricity (without heat pump)',
			label: 'Strom',
			color: '#B28F27'
		},
		{
			key: 'wood, wood pellets',
			label: 'Holz',
			color: '#000'
		},
		{
			key: 'solar/geothermal energy, heat pumps',
			label: 'Erneuerbare',
			color: '#00734D',
			featured: true
		},
		{
			key: 'no energy source (no heating)',
			label: 'Keine Heizung',
			color: '#000'
		},
		{
			key: 'coal',
			label: 'Kohle',
			color: '#000'
		},
		{
			key: 'biomass (excluding wood), biogas',
			label: 'Biomasse & Biogas',
			color: '#000'
		}
	];

	$: promise = getDataForSelectedRegion(selectedRegion.code);
</script>

<div class="bg-white dark:bg-gray-800 rounded-2xl p-3">
	<RegionSearch {regions} bind:selectedRegion />
	{#await promise then data}
		<p class="mt-2">
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
		<h2 class="text-2xl">Die Wärmewende stockt – Fossile Heizungen oftmals noch Standard</h2>
		<h3 class="text-lg">Heizungen nach Art des Energieträgers</h3>

		<Chart {data} {categories} />

		<PerDay {data} {categories} />

		<p class="opacity-80 leading-tight mt-4">
			<strong>Datenquelle</strong><br />Statistisches Bundesamt (2024): Zensus 2022, Eigene
			Berechnung
		</p>

		<RegionComparison {regions} {selectedRegion} {categories} />
	{/await}
</div>
