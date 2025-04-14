<script>
	import Loader from '$lib/components/Loader.svelte';
	import BarChart from './BarChart.svelte';
	import LineChart from './LineChart.svelte';

	export let region;

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
	<h2>Erneuerbare in {region.name}</h2>
	<p>ID: {region.code}</p>

	{#await promise}
		<Loader />
	{:then data}
		<BarChart {data} />
		<LineChart {data} />
		<pre>{JSON.stringify(data, null, 2)}</pre>
	{/await}
{/if}
