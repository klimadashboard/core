<script>
	import Papa from 'papaparse';
	import { fade } from 'svelte/transition';

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
	$: if (selectedScenario) {
		usedBudget = 0;
	}
	$: data = years.map((year) => {
		let data = [];
		if (getSumForYear(year) > 0) {
			data = Array.from(Array(getSumForYear(year)), (_, x) => {
				usedBudget += blockValue;
				return {
					x: x,
					type: usedBudget > currentScenario.value ? 'overused' : 'historical'
				};
			});
		} else {
			const projection = Math.max(0, Math.round((currentScenario.value - usedBudget) / blockValue));
			data = Array.from(Array(Math.min(projection, 12)), (_, x) => {
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

	let types = [
		{
			key: 'overused',
			classes: 'bg-energy'
		},
		{
			key: 'historical',
			classes: 'bg-industry'
		},
		{
			key: 'projection',
			classes: 'border-industry border-2'
		}
	];
</script>

<select bind:value={selectedScenario}>
	{#each scenarios as scenario}
		<option value={scenario.key}>{scenario.key}</option>
	{/each}
</select>
{currentScenario.heading}

{#if data}
	<div class="container relative">
		<div class="flex flex-col space-y-2">
			{#each data as year, i}
				<div class="relative" transition:fade={{ delay: i * 10 }}>
					{#if i % 10 == 0 || year.year == 2023}
						<p class="text-xs text-gray-600 absolute -bottom-4 left-1 -translate-x-1/2">
							{year.year}
						</p>
					{/if}

					<div class="flex space-x-1">
						{#each year.data as a, j}
							<div class="w-4 h-4 {types.find((d) => d.key == a.type).classes} mb-0.5 rounded-xl" />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else}
	Loading...
{/if}
