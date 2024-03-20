<script>
	import Papa from 'papaparse';
	import Scroller from '@sveltejs/svelte-scroller';
	import Chart from './Chart.svelte';
	import { onMount } from 'svelte';

	let index, offset, progress;

	let historicalEmissions; // old
	let historicalData; // new
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

	Papa.parse('../data_temp/01j_emissions_co2_incl_LULUCF_UPDATE.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				historicalEmissions = results.data;
				// console.log(historicalEmissions);
			}
		}
	});

	const years = Array.from(Array(60), (_, x) => 1990 + x);
	$: getSumForYear = function (year) {
		let historical = historicalEmissions?.find((d) => d.year == year)
			? historicalEmissions.find((d) => d.year == year).co2_Mt_incl_LULUCF
			: 0;
		let projection = 0;

		// console.log(historical);

		return Math.round((historical + projection) / blockValue);
	};

	$: usedBudget = 0;
	$: if (currentScenario && selectedProjection) {
		usedBudget = 0;
	}
	$: data = years.map((year) => {
		let data = [];
		if (getSumForYear(year) > 0) {
			data = Array.from(Array(getSumForYear(year)), (_, x) => {
				usedBudget += blockValue;
				// console.log(usedBudget);
				return {
					x: x,
					type: usedBudget > currentScenario.value ? 'overused' : 'historical'
				};
			});
		} else {
			let projectedValueForYear = Math.max(0, (currentScenario.value - usedBudget) / blockValue);

			if (selectedProjection == 'percentage') {
				projectedValueForYear = projectedValueForYear / Math.max(1, year - 2023);
			} else if (selectedProjection == 'linear') {
				projectedValueForYear = projectedValueForYear - 1 * Math.max(1, year - 2023);
				// remainignBugdet * 2 / budgetLastYear;
			}

			projectedValueForYear = Math.max(0, projectedValueForYear);
			// console.log('year: ' + year + ' projection: ' + projectedValueForYear);
			data = Array.from(Array(Math.min(Math.round(projectedValueForYear), 12)), (_, x) => {
				usedBudget += blockValue;
				return {
					x: x,
					type: 'projection'
				};
			});
		}
		return {
			year: year,
			data: data
		};
	});

	// $: console.log(data);

	$: scenarios = [
		{
			key: '15-67',
			heading:
				'Deutschland hat sein faires CO2-Budget für 1,5 Grad mit 67% Wahrscheinlichkeit 2023 aufgebraucht. Seitdem lebt es auf Kosten anderer Länder.',
			value: 27828 // -530
		},
		{
			key: '15-50',
			heading: 'FÜr 1,5 Grad mit 50% Wahrscheinlichkeit ver',
			value: 28528 // 170
		},
		{
			key: '175-67',
			heading: 'Für XX verbleiben ab 2024 noch XX Tonnen.',
			value: 32258 // 3900
		}
	];

	$: currentScenario = scenarios[Math.max(index - 3 || 0, 0)];

	let selectedProjection = 'steady';

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
			{#if data && historicalData && chartWidth && chartHeight}
				<Chart
					{data}
					{historicalData}
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
					Bis {currentYear} hat Deutschland {currentYearTotalEmissions} ausgestoßen. Deutschland CO2-Budget
					aufgebraucht
				</h1>
				<p class="text-lg mt-2 leading-snug">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
					ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
					ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
					reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
				</p>
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
			</section>
			<section>
				<h2 class="text-xl">Seit XX hat XX ausgestoßen.</h2>
				<div class="w-3 h-3 rounded-xl bg-industry" />
				<p>Eine Kugel entspricht {blockValue}.</p>
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
				<h2 class="text-xl">Für 1,75 Grad verbleiben noch XX Tonnen.</h2>
			</section>
		</div>
	</Scroller>
</div>

<style>
	.background {
		height: calc(100vh - 6rem);
	}

	.foreground section {
		height: calc(100vh - 6rem);
		@apply text-center p-16 max-w-xl mx-auto;
	}
</style>
