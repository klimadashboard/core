<script>
	import Maps from './Maps.svelte';
	import Table from './Table.svelte';
	import Papa from 'papaparse';
	import { scaleApproval } from '$lib/stores/scales';

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

	$: selectedPolicy = false;

	$: if (!selectedPolicy) {
		selectedPolicy = policies[0];
	}

	$: years = showAllYears
		? [
				...new Set(
					dataset
						?.filter((e) => e.level == 2 && e.policy == selectedPolicy && e.year !== 'average')
						.map((d) => d.year)
						.sort((a, b) => a - b)
				)
		  ]
		: [dataset?.filter((e) => e.level == 2 && e.policy == selectedPolicy)[0].year];

	$: console.log(years);
	$: showAllYears = false;

	$: policies = [...new Set(dataset?.filter((e) => e.level == 2).map((e) => e.policy))];
	$: console.log(policies);

	$: data = dataset?.filter(
		(e) => e.level == 2 && e.policy == selectedPolicy && years.indexOf(e.year) > -1
	);

	$: selectedFeature = false;
</script>

<div class="flex space-x-4 items-center mb-4">
	{#if dataset}
		<select bind:value={selectedPolicy}>
			{#each policies as policy}
				<option value={policy}>{dataset?.find((f) => f.policy == policy)['policy.name.de']}</option>
			{/each}
		</select>
	{/if}

	<label class="flex space-x-2 items-center">
		<input type="checkbox" bind:checked={showAllYears} />
		<span>Alle Jahre zeigen</span>
	</label>

	<div class="flex rounded-lg overflow-hidden">
		{#each Array.from(Array(11).keys()) as i}
			<div class="w-6 h-6 grid" style="background: {scaleApproval(i * 10)}">
				{#if i < 2 || i > 8}
					<p class="text-white m-auto font-bold" style="font-size: 0.6em;">{i * 10}%</p>
				{/if}
			</div>
		{/each}
	</div>
</div>

<div class="flex">
	{#if data}
		<Maps {data} {years} {selectedPolicy} bind:selectedFeature />
		{#if !showAllYears}
			<Table {data} bind:selectedFeature />
		{/if}
	{/if}
</div>

<style>
	.wrapper {
		height: 100vh;
		min-height: 0;
	}
</style>
