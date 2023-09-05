<script>
	import { fade } from 'svelte/transition';
	import Papa from 'papaparse';
	import formatNumber from '$lib/stores/formatNumber';

	let budgets = [
		{
			value: 1343,
			probability: 66,
			temperature: 1.5,
			type: 'CO2'
		},
		{
			value: 2443,
			probability: 50,
			temperature: 1.5,
			type: 'CO2'
		},
		{
			value: 5443,
			probability: 66,
			temperature: 1.75,
			type: 'CO2'
		}
	];

	$: historicalEmissions = [];

	Papa.parse(
		'https://data.klimadashboard.org/de/emissions/emissions_co2_historical_without_LULUCF.csv',
		// '../data/de/emissions/emissions_co2_historical_without_LULUCF.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					historicalEmissions = results.data;
					console.log('historicalEmissions', historicalEmissions);
				}
			}
		}
	);

	$: chosenBudget = budgets[0];
	$: totalHistoricalEmissions = historicalEmissions
		.filter((d) => d.year <= endYear && d.year >= startYear)
		.reduce((a, b) => a + b.co2_excl_LULUCF, 0);
	$: chosenHistoricalEmissions = historicalEmissions.filter(
		(d) => d.year <= endYear && d.year >= startYear
	);
	$: remainingBudget = chosenBudget.value;
	$: yearlyEmissions = 666;

	const blockValue = 100;

	let decades = [
		1750, 1760, 1770, 1780, 1790, 1800, 1810, 1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890, 1900,
		1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020
	];

	$: arrayHistorical = decades.map((key) => {
		let values = chosenHistoricalEmissions
			.filter((d) => d.year >= key && d.year < key + 10)
			.reduce((a, b) => Math.round(a + b.co2_excl_LULUCF), 0);
		return values;
	});

	$: arrayBudget = Array(Math.round(remainingBudget / blockValue)).fill('budget');
	$: arrayCurrent = Array(Math.round(yearlyEmissions / blockValue)).fill('current');
	$: remainingYears = Math.round((chosenBudget.value / yearlyEmissions) * 10) / 10;
	$: startYear = 1850;
	$: endYear = 2022;

	$: playing = false;

	const iterate = function () {
		var interval = setInterval(function () {
			if (endYear > 2020) {
				playing = false;
				clearInterval(interval);
			} else {
				endYear = Math.min(endYear + 10, 2022);
			}
		}, 1000);
	};

	$: if (playing) {
		endYear = 1849;
		iterate();
	}

	$: showDecades = false;
</script>

<section class="container">
	<div class="max-w-2xl text-xl px-4 md:px-0">
		<p class="text-budgetHistoric max-w-lg leading-tight">
			{#if endYear == 2022}
				In den letzten {endYear - startYear + 1} Jahren hat Deutschland
				<nobr>{formatNumber(Math.round(totalHistoricalEmissions))} Mio. Tonnen</nobr> CO₂ ausgestoßen.
			{:else}
				In den {endYear - startYear} Jahren zwischen {startYear} und {endYear} hat Österreich
				<nobr>{formatNumber(Math.round(totalHistoricalEmissions))} Mio. Tonnen CO₂</nobr> ausgestoßen.
			{/if}
		</p>

		<div
			class="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500 mt-2 -translate-x-0.5"
		>
			<div class="flex gap-2 items-center">
				<button on:mousedown={() => (playing = !playing)}>
					{#if !playing}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-player-play"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M7 4v16l13 -8z" />
						</svg>
					{/if}
				</button>
				<input
					type="number"
					class="w-14 bg-gray-100 p-1"
					bind:value={startYear}
					min={1850}
					max={Math.min(endYear, 2020)}
				/>
				<span>–</span>
				<input
					type="number"
					class="w-14 bg-gray-100 p-1"
					bind:value={endYear}
					min={Math.max(1850, startYear)}
					max={2022}
				/>
				<label class="space-x-1 ml-2 flex items-center">
					<input type="checkbox" bind:checked={showDecades} />
					<span>Jahrzehnte anzeigen?</span>
				</label>
			</div>

			<div class="flex gap-2 items-center">
				<div>1 Kasten entspricht 100 Mio. t CO₂</div>
				<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-current" />
			</div>
		</div>

		<div class="grid gap-1 mx-auto mt-2 text-budgetHistoric budget-grid">
			{#each arrayHistorical as decade, i}
				{@const decadeString = decades[i].toString()}
				{#if showDecades && decade > 0}
					<div
						class="col-span-2 flex items-center {i % 2 == 0 ? 'opacity-100' : 'opacity-70'}"
						style="font-size: 12px; line-height: 1;"
					>
						<span class="tabular-nums tracking-tight -translate-x-0.5">{decadeString}</span>
						<svg
							width="13"
							height="24"
							class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3"
							viewBox="0 0 13 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M0 2L12 12L0 22"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				{/if}
				{#each Array(Math.round(decade / blockValue)) as box, j}
					<div
						class="w-3 h-3 bg-current grid {showDecades
							? i % 2 == 0
								? 'opacity-100'
								: 'opacity-70'
							: ''}"
						transition:fade
					>
						<!--
          {#if j == 0}
          <div class="text-white font-bold m-auto text-center" style="font-size: 7px; line-height: 0.9">
          <span>{decadeString.substr(0,2)}</span>
          <span>{decadeString.substr(-2)}</span>
          </div>
          {/if}
          -->
					</div>
				{/each}
			{/each}
		</div>

		<p class="mt-6 text-budgetDefault leading-tight">
			Ab 2023 verbleiben nur noch {remainingBudget} Millionen Tonnen, um das Pariser Klimaabkommen mit
			einer Erderhitzung von +1.5°C einzuhalten.
		</p>

		<div class="relative text-gray-600 text-sm mt-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="absolute pointer-events-none top-1 right-0 h-4"
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
				name="budget"
				bind:value={chosenBudget}
				class="block appearance-none w-full leading-tight focus:outline-none focus:bg-gray-200 focus:border-gray-500 bg-gray-100 py-1 px-2"
			>
				{#each budgets as budget}
					<option value={budget}>
						{#if budget.temperature == 1.65}
							1,5 °C mit zwischenzeitlich 1,65°C bei {budget.probability}%
							Eintrittswahrscheinlichkeit
						{:else}
							{budget.temperature.toString().replace('.', ',')} °C bei {budget.probability}%
							Eintrittswahrscheinlichkeit
						{/if}
					</option>
				{/each}
			</select>
		</div>

		<div class="grid gap-1 mx-auto mt-2 text-budgetDefault budget-grid">
			{#each arrayBudget as box}
				<div class="w-3 h-3 bg-current" transition:fade />
			{/each}
		</div>

		{#if chosenBudget.probability == 50}
			<p class="mt-2 text-sm text-budgetDefault">
				Wenn das Temperaturziel nur mit 50%-iger Wahrscheinlichkeit erreicht werden soll, ist das
				verbleibende Budget zwar größer, die Einhaltung aber auch unwahrscheinlicher.
			</p>
		{/if}
		{#if chosenBudget.temperature == 1.65}
			<p class="mt-2 text-sm text-budgetDefault">
				Das Budget mit zwischenzeitlich +1,65°C ist zwar größer, aber auch riskanter: denn jedes
				Zehntel Grad Erderhitzung gefährdet mehr Menschenleben durch das immer wahrscheinlich
				werdende Überschreiten irreversibler Kipp-Punkte.
			</p>
		{/if}

		<p class="mt-6 leading-tight text-budgetDark">
			In dem aktuellen Tempo ist unser Budget <nobr
				>in {remainingYears.toString().replace('.', ',')} Jahren aufgebraucht.</nobr
			>
		</p>

		<div class="grid gap-1 mx-auto mt-2 text-budgetDark budget-grid">
			{#each arrayCurrent as box}
				<div class="w-3 h-3 bg-current" transition:fade />
			{/each}
			<div class="text-sm -translate-y-1" style="grid-column: span 24 / span 24;">
				666,5 Mio. Tonnen hat Deutschland im Jahr 2022 emittiert.
			</div>
		</div>

		<div class="border-t pt-1 mt-6 text-gray-600 border-current text-sm sources">
			<p>
				Historische Emissionen: <a
					href="https://www.icos-cp.eu/science-and-impact/global-carbon-budget/2022"
					>Global Carbon Project (2022)</a
				> <br />CO₂-Emissionen 2022:
				<a
					href="https://www.umweltbundesamt.de/daten/klima/treibhausgas-emissionen-in-deutschland#emissionsentwicklung"
					>Umweltbundesamt (2023)</a
				><br />Verbleibendes CO₂-Budget:
				<a
					href="https://www.umweltrat.de/SharedDocs/Downloads/DE/04_Stellungnahmen/2020_2024/2022_06_fragen_und_antworten_zum_co2_budget.html"
					>Sachverständigenrat für Umweltfragen (SRU)</a
				><br />Eigene Berechnung<br /><br />Datensätze:
				<br /><a
					href="https://github.com/klimadashboard/data/blob/main/de/emissions/emissions_co2_historical_without_LULUCF.csv"
					>Historische CO₂-Emissionen inkl. CO₂-Emissionen 2022</a
				><br /><a
					href="https://github.com/klimadashboard/data/blob/main/de/emissions/emissions_co2budget_scenarios_DE.csv"
					>Verbleibendes CO₂-Budget</a
				>
			</p>
		</div>
	</div>
</section>

<style>
	.budget-grid {
		grid-template-columns: repeat(40, minmax(0, 1fr));
	}

	@media screen and (max-width: 650px) {
		.budget-grid {
			grid-template-columns: repeat(32, minmax(0, 1fr));
		}
	}

	@media screen and (max-width: 480px) {
		.budget-grid {
			grid-template-columns: repeat(24, minmax(0, 1fr));
		}
	}

	@media screen and (max-width: 350px) {
		.budget-grid {
			grid-template-columns: repeat(18, minmax(0, 1fr));
		}
	}

	.sources a {
		@apply underline;
	}
</style>
