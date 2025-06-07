<script>
	import PerDay from './PerDay.svelte';
	import Chart from './Chart.svelte';
	import RegionComparison from './RegionComparison.svelte';
	import RegionSearch from './RegionSearch.svelte';
	import { getDataForSelectedRegion } from './getData';

	export let regions;
	export let selectedRegion;

	let categories = [
		{
			key: 'gas',
			label: 'Gasheizungen',
			color: '#0C4A6E', // deep cyan-blue
			featured: true
		},
		{
			key: 'district heating (various energy sources)',
			label: 'Fernwärme',
			color: '#9D174D', // rich magenta
			featured: true
		},
		{
			key: 'heating oil',
			label: 'Heizöl',
			color: '#9C3A03', // earthy brown
			featured: true
		},
		{
			key: 'electricity (without heat pump)',
			label: 'Strom',
			color: '#B45309' // amber-brown
		},
		{
			key: 'wood, wood pellets',
			label: 'Holz',
			color: '#4B5563' // slate gray
		},
		{
			key: 'solar/geothermal energy, heat pumps',
			label: 'Wärmepumpen, Solar-/Geothermie',
			color: '#047857', // emerald green
			featured: true
		},
		{
			key: 'no energy source (no heating)',
			label: 'Keine Heizung',
			color: '#6B7280' // neutral gray
		},
		{
			key: 'coal',
			label: 'Kohle',
			color: '#374151' // dark slate
		},
		{
			key: 'biomass (excluding wood), biogas',
			label: 'Biomasse & Biogas',
			color: '#3F6212' // olive green
		}
	];

	$: promise = getDataForSelectedRegion(selectedRegion?.code);
</script>

<div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
	<RegionSearch {regions} bind:selectedRegion />
	{#if selectedRegion}
		{#await promise then data}
			{#if data.length > 0}
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
					><span>{data?.[0]?.region_label}</span>
				</p>
				<h2 class="text-2xl leading-tight">
					Die Wärmewende stockt – Fossile Heizungen oftmals noch Standard
				</h2>
				<h3 class="text-lg leading-tight mt-2">Heizungen nach Art des Energieträgers</h3>

				<Chart {data} {categories} />

				<PerDay {data} {categories} />

				<p class="opacity-80 leading-tight mt-4">
					<strong>Datenquelle</strong><br />Statistisches Bundesamt (2024): Zensus 2022, Eigene
					Berechnung
				</p>
			{:else}
				<p class="opacity-80 my-4">
					Keine Daten für die ausgewählte Region verfügbar. Wähle eine andere Region.
				</p>
			{/if}
		{/await}

		<RegionComparison {regions} {selectedRegion} {categories} />
	{/if}
</div>
