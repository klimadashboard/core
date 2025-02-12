<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import Papa from 'papaparse';
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import { onMount } from 'svelte';

	let data = [];

	onMount(() => {
		Papa.parse(
			'https://data.klimadashboard.org/' + PUBLIC_VERSION + '/emissions/emissions_by_sectors.csv',
			{
				download: true,
				dynamicTyping: true,
				header: true,
				skipEmptyLines: true,
				complete: (results) => {
					data = results.data;
					console.log(data);
					data = data
						.filter(
							(d) =>
								d.region == 'Austria' && d.classification == 'Gesamt' && d.total_co2e_t !== null
						)
						.map((d) => {
							return {
								x: d.year,
								y: d.total_co2e_t
							};
						});
					console.log(data);
				}
			}
		);
	});

	$: yScale = scaleLinear()
		.domain([0, max(data, (d) => d.y)])
		.range([0, 40]);

	let chartWidth;
</script>

{#if data.length > 0}
	<div
		class="flex h-14 mt-2 -mb-1 items-end justify-between relative"
		bind:clientWidth={chartWidth}
	>
		<p class="absolute left-0 top-0 text-xs">{data[0].x}</p>
		<p class="absolute right-0 top-0 text-xs">{data[data.length - 1].x}</p>
		{#each data as d}
			<div
				style="height: {Math.round(yScale(d.y))}px; width: {chartWidth / data.length - 2}px;"
				class="bg-current {d == data[data.length - 1] ? 'opacity-100' : 'opacity-50'}"
			></div>
		{/each}
	</div>
{/if}
