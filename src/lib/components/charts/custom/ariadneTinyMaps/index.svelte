<script>
	import Papa from 'papaparse';
	import Map from './Map.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { scaleApproval } from '$lib/utils/scales';

	let dataset;

	Papa.parse('/data_temp/ariadne-dataset.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				dataset = results.data;
			}
		}
	});

	let promise = fetch('https://data.klimadashboard.org/de/geo/landkreise_simplify200.json')
		.then((x) => x.json())
		.catch(function (err) {
			throw error(500, 'Couldn’t load geodata.');
		});

	const policies = ['ice', 'gas_furnace', 'speedlimit', 'onshore', 'opnv', 'solar'];
</script>

<div class="max-w-6xl mx-auto relative">
	<div class="flex rounded-lg overflow-hidden mb-2 md:absolute -bottom-12 right-0">
		{#each Array.from(Array(11).keys()) as i}
			<div class="w-6 h-6 grid" style="background: {scaleApproval(i * 10)}">
				{#if i < 2 || i > 8}
					<p class="text-white m-auto font-bold" style="font-size: 0.6em;">{i * 10}%</p>
				{/if}
			</div>
		{/each}
	</div>
	{#await promise}
		<Loader />
	{:then topo}
		{#if dataset}
			<div class="text-sm sm:text-base grid grid-cols-3 md:grid-cols-6 gap-4">
				{#each policies as policy}
					<div class="text-center leading-tight">
						<h3 class="font-bold h-8">
							{dataset.find((d) => d.policy == policy)['policy.name.de']}
						</h3>

						<Map data={dataset.filter((d) => d.year == 2021 && d.policy == policy)} {topo} />
						<p class="text-3xl sm:text-5xl font-light">
							{dataset.find((d) => d.policy == policy)['support.rd']}%
						</p>
						<p>Bundesweite Zustimmung</p>
						<p>2021</p>
					</div>
				{/each}
			</div>
		{/if}
	{/await}
</div>
