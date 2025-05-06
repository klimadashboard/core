<script>
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import Papa from 'papaparse';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { pivot_multikey } from '@/lib/utils/data';


	let rawData;
	let unit;

	const getEmissionsData = async function () {
		try{
			const directus = getDirectusInstance(fetch);
			let data = await directus.request(
				readItems('emissions_data', {
					filter: {
						_and: [
							{ 
								country: { _eq: PUBLIC_VERSION.toUpperCase() },
								source: { _in: ["OLI 2023 (1990-2022)", "manual_consumption"] },
								category: { _in: ["0", "consumption_based"] },
								gas: { _eq: "THG" }
							}
						]
					},
					sort: "year",
					fields: ["category","gas.name","gas.unit","id","source","type","value","year"],
					limit: -1
				})
			);

			data = data.map((row, i) => ({
				value: row.value,
				year: row.year,
				unit: row.gas?.name,
				category: row.category === "0" ? "production_based" : row.category,
			}));
			const pivot_table = pivot_multikey(data, ["year", "unit"], "category")

			rawData = pivot_table
			unit = rawData[0].unit;

		} catch (error) {
			console.error('Error fetching emission data:', error);
		}
	};

	$: getEmissionsData();

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
