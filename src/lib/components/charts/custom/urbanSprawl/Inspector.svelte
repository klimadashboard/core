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
	$: dataFor1980 = dataForRegion.filter((d) => d.period == 1980);

	$: popNow = latestDataForRegion.find((d) => d.category == 'pop3')?.value || 0;
	$: popTotalNow = latestDataForRegion.find((d) => d.category == 'population')?.value || 0;
	$: shareNow = popNow / popTotalNow;

	$: popThen = dataFor1980.find((d) => d.category == 'pop3')?.value || 0;
	$: popTotalThen = dataFor1980.find((d) => d.category == 'population')?.value || 0;
	$: shareThen = popThen / popTotalThen;

	$: difference = shareNow - shareThen;
	$: percentDifference = Math.round(difference * 100);
</script>

{#if region}
	<div>
		<h2 class="text-2xl">{region.name}</h2>
		<p class="text-lg">
			In der Region leben {formatNumber(popTotalNow)} Menschen, davon leben {formatNumber(popNow)} Menschen
			({Math.round(shareNow * 100)}%) in stark zersiedelten Gebieten. Im Jahr 1980 waren es nur {Math.round(
				shareThen * 100
			)}%.
		</p>

		<Chart data={dataForRegion} />
	</div>
{:else}
	<div>Wähle eine Region aus, um mehr Informationen zur Zersiedelung zu erhalten.</div>
{/if}
