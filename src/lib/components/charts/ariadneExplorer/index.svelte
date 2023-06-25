<script>
	import Map from './Map.svelte';
	import Table from './Table.svelte';
	import Papa from 'papaparse';

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
					console.log(dataset);
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
		<span>Zeige alle Jahre?</span>
	</label>

	{#if selectedFeature}{/if}
</div>

{#if data}
	<div class="flex space-x-2">
		{#each years as year}
			<div class="text-center">
				<Map data={data.filter((d) => d.year == year)} bind:selectedFeature />

				<p class="text-gray-700">{year}</p>
				{#if selectedFeature}
					<p class="text-4xl">
						{data.find(
							(d) =>
								d.year == year &&
								d.code == selectedFeature.properties.RS &&
								d.policy == selectedPolicy
						)['support.rd']}%
					</p>
					<p>
						Zustimmung in
						{selectedFeature.properties.GEN}
					</p>
				{/if}
			</div>
		{/each}
		{#if !showAllYears}
			<Table {data} />
		{/if}
	</div>
{/if}

<style>
	.wrapper {
		height: 100vh;
		min-height: 0;
	}
</style>
