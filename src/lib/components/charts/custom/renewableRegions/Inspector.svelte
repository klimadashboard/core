<script>
	import Loader from '$lib/components/Loader.svelte';
	import BarChart from './BarChart.svelte';
	import LineChart from './LineChart.svelte';
	import Comparison from './Comparison.svelte';

	export let region;
	export let data;
	export let regions;
	export let colors;

	$: getDataForRegion = async (regionCode = false) => {
		console.log(regionCode);
		const url = regionCode
			? `https://base.klimadashboard.org/get-renewables-growth?table=energy_solar_units&group=year&region=${regionCode}`
			: 'https://base.klimadashboard.org/get-renewables-growth?table=energy_solar_units&group=year';
		const response = await fetch(url);
		const data = await response.json();
		return data;
	};

	$: promise = getDataForRegion(region.code);
</script>

{#if region}
	<h2 class="text-2xl">Erneuerbare Energien in {region.name}</h2>
	<p>ID: {region.code}</p>

	{#await promise}
		<Loader />
	{:then data}
		<h3 class="font-bold text-2xl">Seit Jahresbeginn wurden XYZ zugebaut.</h3>
		<p class="text-lg mb-2">Label für den Chart</p>
		<BarChart {data} {colors} />
		<p class="text-lg mt-2 border-b pb-4 mb-4 border-current/20">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
			labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
		</p>
		<h3 class="font-bold text-2xl">Insgesamt wurden bisher XXX installiert.</h3>
		<p class="text-lg mb-2">Label für den Chart</p>
		<LineChart {data} {colors} />
		<p class="text-lg mt-2 border-b pb-4 mb-4 border-current/20">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
			labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
		</p>
		<Comparison {data} {regions} {colors} />

		<pre>{JSON.stringify(data, null, 2)}</pre>
	{/await}
{/if}
