<script>
	import BarChart from '../chartBar.svelte';
	import Papa from 'papaparse';

	let rawData;

	Papa.parse(
		'https://data.klimadashboard.org/at/heating-systems/klimadashboard_AT_heatingSystems_timeline.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					rawData = results.data;
				}
			}
		}
	);

	$: selectedYear = 2020;
	$: showPerHousehold = false;

	$: dataset = rawData
		?.filter((d) => d.region !== 'Austria')
		.filter((d) => d.year == selectedYear)
		.sort(function (a, b) {
			return a.households - b.households;
		})
		.map((entry, i) => {
			return {
				label: entry.region,
				categories: [
					{
						label: v.gas,
						value: showPerHousehold ? entry.gas_sum_per100households : entry.gas_sum,
						color: '#7CBAB3'
					},
					{
						label: v.oil,
						value: showPerHousehold ? entry.oil_sum_per100households : entry.oil_sum,
						color: '#575C75'
					},
					{
						label: v.coal,
						value: showPerHousehold ? entry.coal_sum_per100households : entry.coal_sum,
						color: '#71665B'
					},
					{
						label: v.wood,
						value: showPerHousehold ? entry.wood_sum_per100households : entry.wood_sum,
						color: '#B28834'
					},
					{
						label: v.electric,
						value: showPerHousehold ? entry.electric_per100households : entry.electric,
						color: '#8CAED9'
					},
					{
						label: v.heatPump,
						value: showPerHousehold ? entry.heatPump_per100households : entry.heatPump,
						color: '#E0A906'
					},
					{
						label: v.remote,
						value: showPerHousehold ? entry.remote_per100households : entry.remote,
						color: '#CF6317'
					}
				]
			};
		});

	export let v;
</script>

<div class="flex flex-col md:flex-row justify-between">
	<div class="flex gap-2">
		<input
			type="range"
			min="2004"
			max="2020"
			step="2"
			bind:value={selectedYear}
			aria-label={'Jahr auswählen'}
		/>
		<p class="text-sm text-gray-600">{selectedYear}</p>
	</div>
	<label
		class="flex space-x-2 text-sm items-center {showPerHousehold
			? 'text-gray-700'
			: 'text-gray-400'}"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 icon icon-tabler icon-tabler-home"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<polyline points="5 12 3 12 12 3 21 12 19 12" />
			<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
			<path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
		</svg>
		<span>{v.per100households}</span>
		<input type="checkbox" bind:checked={showPerHousehold} />
	</label>
</div>
{#if dataset}
	<div class="mt-4 w-full h-80">
		<BarChart
			data={dataset}
			visualisation={'stacked'}
			unit={v.households}
			show0ValuesInLegend={true}
		/>
	</div>
{/if}
