<script>
	import Papa from 'papaparse';
	import Map from './Map.svelte';
	import Loader from '$lib/components/Loader.svelte';

	let dataset;

	Papa.parse(
		'/data_temp/Data_Downscaling_Climate_Policy_Attitudes-2023-05-31 - Data_Downscaling_Climate_Policy_Attitudes-2023-05-31.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					dataset = results.data;
				}
			}
		}
	);

	let promise = fetch('https://data.klimadashboard.org/de/geo/landkreise_simplify200.json')
		.then((x) => x.json())
		.catch(function (err) {
			throw error(500, 'Couldn’t load geodata.');
		});

	const policies = ['ice', 'gas_furnace', 'speedlimit', 'onshore', 'opnv', 'solar'];
</script>

<div class="max-w-6xl mx-auto">
	{#await promise}
		<Loader />
	{:then topo}
		{#if dataset.length > 0}
			<div class="grid grid-cols-3 md:grid-cols-6 gap-4">
				{#each policies as policy}
					<div class="text-center leading-tight">
						<h3 class="font-bold">{dataset.find((d) => d.policy == policy)['policy.name.de']}</h3>

						<Map data={dataset.filter((d) => d.year == 2021 && d.policy == policy)} {topo} />
						<p class="text-5xl font-light">XX%</p>
						<p>Bundesweite Zustimmung</p>
						<p>2021</p>
					</div>
				{/each}
			</div>
		{/if}
	{/await}
</div>
