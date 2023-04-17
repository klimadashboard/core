<script>
	import BarChart from '../chartBar.svelte';
	import Papa from 'papaparse';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	let rawDataProduction;
	let rawDataConsumption;
	let region;

	Papa.parse(
		'https://data.klimadashboard.org/' + PUBLIC_VERSION + '/emissions/emissions_by_sectors.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					rawDataProduction = results.data;
				}
			}
		}
	);

	Papa.parse(
		'https://data.klimadashboard.org/' +
			PUBLIC_VERSION +
			'/emissions/emissions_consumption_based.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					rawDataConsumption = results.data;
				}
			}
		}
	);

	$: if (PUBLIC_VERSION == 'at') {
		region = 'Austria';
	} else {
		region = 'Germany';
	}

	$: dataset = rawDataProduction
		?.filter((d) => d.region == region)
		.map((entry, i) => {
			return {
				label: entry.year,
				categories: [
					{
						label: 'Konsumbasierte Emissionen',
						value: rawDataConsumption?.filter((d) => d.year == entry.year)[0]
							? rawDataConsumption.filter((d) => d.year == entry.year)[0].value
							: 0,
						color: '#E59E1A'
					},
					{
						label: 'Produktionsbasierte Emissionen',
						value: entry.total_co2e_t,
						color: '#4DB263'
					}
				]
			};
		});
</script>

<div class="h-80">
	{#if dataset}
		<BarChart data={dataset} visualisation="grouped" xAxixInterval="5" unit={'t THG'} />
	{:else}
		<Loader />
	{/if}
</div>
