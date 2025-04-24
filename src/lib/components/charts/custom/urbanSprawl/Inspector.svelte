<script>
	import Chart from './Chart.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	export let data;
	export let regions;
	export let selectedRegion;
	export let selectedPeriod;

	$: region = regions.find((d) => d.code === selectedRegion) || false;
	$: dataForRegion = data.filter((d) => d.region == region.code);
	$: latestDataForRegion = dataForRegion.filter((d) => d.period == selectedPeriod);
	$: console.log(dataForRegion);
</script>

{#if region}
	<div>
		<h2 class="font-bold">{region.name}</h2>
		<p>
			In der Region leben {formatNumber(
				latestDataForRegion.find((d) => d.category == 'population')?.value
			)} Menschen.
		</p>
		<Chart data={dataForRegion} />
	</div>
{/if}
