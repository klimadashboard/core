<script>
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import Papa from 'papaparse';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	let rawData;
	let unit;

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
					rawData = results.data;
					unit = rawData[0].unit;
				}
			}
		}
	);

	$: dataset = rawData?.map((entry, i) => {
		return {
			label: entry.year,
			categories: [
				{
					label: 'Konsumbasierte Emissionen',
					value: entry.consumption_based ? entry.consumption_based : 0,
					color: '#E59E1A'
				},
				{
					label: 'Produktionsbasierte Emissionen',
					value: entry.production_based,
					color: '#4DB263'
				}
			]
		};
	});
</script>

<div class="h-80">
	{#if dataset}
		<BarChart data={dataset} visualisation="grouped" xAxixInterval="5" unit={'t ' + unit} />
	{:else}
		<Loader />
	{/if}
</div>
