<script>
	import Papa from 'papaparse';
	import Scroller from '@sveltejs/svelte-scroller';
	import Chart from './Chart.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let index, offset, progress;

	let historicalData;
	let futureData;
	let blockValue = 50;

	Papa.parse('../data_temp/01o_emissions_co2_historical_incl_LULUCF_UPDATE.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				historicalData = results.data;
			}
		}
	});

	Papa.parse('../data_temp/01m_emissions_co2eq_incl_LULUCF_projection_WEM_UPDATE.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				futureData = results.data;
			}
		}
	});

	let chartWidth;
	let chartHeight;

	$: currentYear = 1850;

	$: currentYearTotalEmissions = 0;

	let timer;

	onMount(() => {
		timer = setInterval(() => {
			currentYear++;
			currentYearTotalEmissions = Math.round(
				historicalData
					.filter((d) => d.year <= currentYear)
					.reduce((a, b) => a + b.co2_Mt_incl_LULUCF, 0)
			);
		}, 20);
	});

	$: if (currentYear > 2022) {
		clearInterval(timer);
	}
</script>

<div class="-my-8">
	<Scroller bind:index bind:offset bind:progress>
		<div
			slot="background"
			class="p-4 w-screen relative bg-gray-100 grid background"
			bind:clientHeight={chartHeight}
			bind:clientWidth={chartWidth}
		>
			{#if historicalData && chartWidth && chartHeight}
				<Chart
					{historicalData}
					{futureData}
					{blockValue}
					{index}
					{offset}
					{progress}
					{chartWidth}
					{chartHeight}
					{currentYear}
				/>
			{:else}
				Loading...
			{/if}
		</div>
		<div slot="foreground" class="foreground">
			<section>
				<h1 class="text-4xl font-serif">
					Von 1850 bis <span class="tabular-nums">{currentYear}</span> hat Deutschland
					<nobr
						><span class="tabular-nums">{formatNumber(currentYearTotalEmissions)}</span> Millionen Tonnen
						CO2</nobr
					> ausgestoßen.
				</h1>
				<h2 class="text-4xl font-serif" in:fade={{ delay: 6200 }}>
					Jetzt ist das deutsche CO2-Budget aufgebraucht.
				</h2>
				<div in:fade={{ delay: 6500 }}>
					<p class="font-bold mt-4">Start scrolling...</p>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="mx-auto"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg
					>
				</div>
			</section>
			<section>
				<div class="section-background">
					<h2 class="text-xl">
						CO2 entsteht in der Industrie, beim Verbrenner, in der Landwirtscaft – XXX.
						<br />
						<span
							class="w-2 h-2 rounded-xl bg-industry inline-block -translate-y-1 -translate-x-1"
						/>
						Eine Kugel entspricht {blockValue} Millionen Tonnen CO2.
					</h2>
				</div>
			</section>
			<section>
				<h2 class="text-xl">
					Den Höhepunkt der Emissionen gab es XXX, seitdem sinken die Emissionen wieder.
				</h2>
			</section>
			<section>
				<h2 class="text-xl">2016 wurde das Pariser Klimaabkommen verabschiedet.</h2>
			</section>
			<section>
				<h2 class="text-xl">Das 1,5 Grad Budget ist XX aufgebraucht.</h2>
			</section>
			<section>
				<h2 class="text-xl">Mit nur 50% Wahrscheinlichkeit ist das Budget 2024 aufgebraucht.</h2>
			</section>
			<section>
				<h2 class="text-xl">
					Für 1,75 Grad verbleiben noch XX Tonnen. Bei gleichbleibenden Emissionen...
				</h2>
			</section>
			<section>
				<h2 class="text-xl">Wenn wir jedes Jahr X reduzieren, dannn...</h2>
			</section>
			<section>
				<h2 class="text-xl">Prozentual müssten wir...</h2>
			</section>
		</div>
	</Scroller>
</div>

<style>
	.background {
		height: calc(100vh - 6rem);
	}

	.section-background {
		@apply bg-white bg-opacity-20 backdrop-blur-lg p-4;
	}

	.foreground section {
		height: calc(100vh - 6rem);
		@apply text-center p-16 max-w-4xl mx-auto;
	}
</style>
