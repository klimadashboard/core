<script>
	import Papa from 'papaparse';
	import Scroller from '@sveltejs/svelte-scroller';
	import Chart from './Chart.svelte';

	let index, offset, progress;

	let historicalEmissions;
	let blockValue = 50;

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
	$: if (selectedScenario && selectedProjection) {
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
			console.log('year: ' + year + ' projection: ' + projectedValueForYear);
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

	$: currentScenario = scenarios.find((d) => d.key == selectedScenario) || scenarios[0];
	let selectedScenario;
	$: console.log(selectedScenario);

	let selectedProjection = 'steady';
</script>

<Scroller bind:index bind:offset bind:progress>
	<div slot="background" class="w-screen relative bg-gray-100 grid background">
		<div class="absolute right-0 bottom-0 text-xs opacity-50 z-50">
			<select bind:value={selectedProjection}>
				<option value="steady">"steady"</option>
				<option value="percentage">"percentage"</option>
				<option value="linear">"linear"</option>
			</select>

			<select bind:value={selectedScenario}>
				{#each scenarios as scenario}
					<option value={scenario.key}>{scenario.key}</option>
				{/each}
			</select>
		</div>

		<div class="p-4">
			<div class="flex space-x-2 items-center">
				<div class="w-3 h-3 rounded-xl bg-industry" />
				<p>1 Kugel entspricht 50 Millionen Tonnen CO2</p>
			</div>
		</div>

		{#if data}
			<Chart {data} />
		{:else}
			Loading...
		{/if}
	</div>
	<div slot="foreground" class="foreground">
		<section>
			<h1 class="text-4xl font-serif">Deutschland CO2-Budget aufgebraucht</h1>
			<p class="text-lg mt-2 leading-snug">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
				voluptate velit esse cillum dolore eu fugiat nulla pariatur.
			</p>
			<p class="font-bold">Start scrolling...</p>
		</section>
		<section>Second section</section>
	</div>
</Scroller>

<style>
	.background {
		height: calc(100vh - 6rem);
	}

	.foreground section {
		height: calc(100vh - 6rem);
		@apply text-center p-16 max-w-xl mx-auto;
	}
</style>
