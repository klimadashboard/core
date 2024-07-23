<script>
	import LineChart from '$lib/components/charts/chartLine.svelte';
	import Papa from 'papaparse';

	export let v;

	let rawData;
	let chartWidth;

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

	const keys = ['gas', 'oil', 'coal', 'wood', 'electric', 'heatPump', 'remote'];
	$: labels = keys.map((e) => v[e]);
	const colors = ['#7CBAB3', '#575C75', '#71665B', '#B28834', '#8CAED9', '#E0A906', '#CF6317'];
	const regions = [
		'Austria',
		'Burgenland',
		'Kärnten',
		'Niederösterreich',
		'Oberösterreich',
		'Salzburg',
		'Steiermark',
		'Tirol',
		'Wien',
		'Vorarlberg'
	];

	$: selectedRegion = 'Austria';

	$: dataset = rawData
		?.filter((d) => d.region == selectedRegion)
		.map((entry, i) => {
			return {
				x: i,
				label: entry.year,
				gas: entry.gas_sum,
				oil: entry.oil_sum,
				coal: entry.coal_sum,
				wood: entry.wood_sum,
				electric: entry.electric,
				heatPump: entry.heatPump,
				remote: entry.remote
			};
		});
</script>

<div class="flex flex-col md:flex-row justify-between">
	<div class="my-4 relative text-gray-600">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="absolute pointer-events-none top-3 h-6 right-2 transform -translate-y-0.5 icon-tabler-selector"
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
			<polyline points="8 9 12 5 16 9" />
			<polyline points="16 15 12 19 8 15" />
		</svg>
		<select
			bind:value={selectedRegion}
			class="block appearance-none w-full bg-gray-200 border border-gray-100 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-sm"
		>
			{#each regions as region}
				<option value={region}>{region}</option>
			{/each}
		</select>
	</div>
</div>

{#if dataset}
	<div class="w-full h-80 my-4" bind:clientWidth={chartWidth}>
		<LineChart
			data={dataset}
			{labels}
			{keys}
			{colors}
			xTicksInterval={chartWidth > 600 ? 1 : 2}
			showDots={true}
			unit={v.households}
			marginLeft={60}
		/>
	</div>
{/if}
