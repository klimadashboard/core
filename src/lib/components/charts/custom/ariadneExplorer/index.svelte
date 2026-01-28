<script>
	import { page } from '$app/stores';
	import Maps from './Maps.svelte';
	import Table from './Table.svelte';
	import Search from './Search.svelte';
	import Papa from 'papaparse';
	import { scaleApproval } from '$lib/utils/scales';

	let dataset;

	const showAllYearsPreset = $page.url.searchParams.get('showAllYears') == 'true' ? true : false;

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

	$: policies = [...new Set(dataset?.filter((e) => e.level == 2).map((e) => e.policy))];

	const getNameForPolicy = function (policy) {
		return dataset?.find((f) => f.policy == policy)['policy.name.de'];
	};

	$: selectedPolicy = false;

	$: if (!selectedPolicy) {
		selectedPolicy = 'onshore';
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

	$: showAllYears = showAllYearsPreset;

	$: data = dataset?.filter(
		(e) => e.level == 2 && e.policy == selectedPolicy && years.indexOf(e.year) > -1
	);

	$: selectedFeature = false;
</script>

<div class="flex gap-4 flex-wrap items-center mb-4">
	{#if dataset}
		<select bind:value={selectedPolicy} class="w-full sm:w-auto">
			{#each policies.sort( (a, b) => getNameForPolicy(a).localeCompare(getNameForPolicy(b)) ) as policy}
				<option value={policy}>{getNameForPolicy(policy)}</option>
			{/each}
		</select>
	{/if}

	<label class="flex space-x-2 items-center">
		<input type="checkbox" bind:checked={showAllYears} />
		<span>Alle Jahre zeigen</span>
	</label>

	<Search bind:selectedFeature />
</div>

<div class="flex flex-col sm:flex-row">
	{#if data}
		<Maps {data} {years} {selectedPolicy} bind:selectedFeature />
		{#if !showAllYears}
			<Table
				{data}
				bind:selectedFeature
				stateWideAverage={dataset?.find((e) => e.level == 0 && e.policy == selectedPolicy)[
					'support.rd'
				]}
			/>
		{/if}
	{/if}
</div>

<div class="inline-flex rounded-lg overflow-hidden mt-4">
	{#each Array.from(Array(11).keys()) as i}
		<div class="w-6 h-6 grid" style="background: {scaleApproval(i * 10)}">
			{#if i < 2 || i > 8}
				<p class="text-white m-auto font-bold" style="font-size: 0.6em;">{i * 10}%</p>
			{/if}
		</div>
	{/each}
</div>

<style>
	.wrapper {
		height: 100vh;
		min-height: 0;
	}
</style>
