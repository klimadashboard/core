<script>
	import BarChart from '../chartBar.svelte';
	import Papa from 'papaparse';
	import Loader from '$lib/components/Loader.svelte';

	$: rawDataProduction = [];

	Papa.parse(
		'https://data.klimadashboard.org/at/emissions/Emission_All_sectors_Austria_1990-2020.csv',
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

	const rawDataConsumption = [
		{
			year: 1997,
			value: 116868000
		},
		{
			year: 2001,
			value: 120069000
		},
		{
			year: 2004,
			value: 130950000
		},
		{
			year: 2007,
			value: 123238000
		},
		{
			year: 2011,
			value: 123636000
		}
	];

	$: dataset = rawDataProduction?.map((entry, i) => {
		return {
			label: entry.year,
			annotation: entry.year == 2001 ? '' : '',
			categories: [
				{
					label: 'Konsumbasierte Emissionen',
					value: rawDataConsumption.filter((d) => d.year == entry.year)[0]
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
		<BarChart
			data={dataset}
			visualisation="grouped"
			xAxixInterval="5"
			label={'Konsumbasierte Emissionen 1990 - 2015'}
			unit={'t THG'}
			showDifferenceArea={true}
		/>
	{:else}
		<Loader />
	{/if}
</div>
