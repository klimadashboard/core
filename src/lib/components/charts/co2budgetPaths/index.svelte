<script>
	import Papa from 'papaparse';
	import Chart from './Chart.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let v;

	let budgets = {
		at: [
			{
				value: 280,
				probability: 66,
				temperature: 1.5,
				type: 'THG',
				percentPerYear: '-22% pro Jahr'
			},
			{
				value: 510,
				probability: 50,
				temperature: 1.5,
				type: 'THG',
				percentPerYear: '-22% pro Jahr'
			},
			{
				value: 340,
				probability: 66,
				temperature: 1.65,
				type: 'THG',
				percentPerYear: '-22% pro Jahr'
			},
			{
				value: 610,
				probability: 50,
				temperature: 1.65,
				type: 'THG',
				percentPerYear: '-22% pro Jahr'
			}
		],
		de: [
			{
				value: 1343,
				probability: 66,
				temperature: 1.5,
				type: 'THG',
				percentPerYear: '-33% pro Jahr',
				tonsPerYear: '129 Mio t CO₂',
				usedUp: {
					nochange: { season: "Anfang", year: 2025 },
					linear: { season: "Anfang", year: 2027 },
					percentage: { season: "Anfang", year: 2045 },
				}
			},
			{
				value: 2443,
				probability: 50,
				temperature: 1.5,
				type: 'THG',
				percentPerYear: '-21% pro Jahr',
				tonsPerYear: '78 Mio t CO₂',
				usedUp: {
					nochange: { season: "Herbst", year: 2026 },
					linear: { season: "Mitte", year: 2031 },
					percentage: { season: "Anfang", year: 2045 },
				}
			},
			{
				value: 5443,
				probability: 66,
				temperature: 1.75,
				type: 'THG',
				percentPerYear: '-10% pro Jahr',
				tonsPerYear: '37 Mio t CO₂',
				usedUp: {
					nochange: { season: "April", year: 2031 },
					linear: { season: "Mitte", year: 2039 },
					percentage: { season: "Anfang", year: 2045 },
				}
			}
		]
	};

	let budget = budgets[PUBLIC_VERSION];

	let dataPaths;
	let thgPathDe = null;
	let dataHistoric;
	let showKSGGoal = false;

	Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/emissions/emissions_co2budget_scenarios_${PUBLIC_VERSION.toLocaleUpperCase()}.csv`,
		// `../../data/${PUBLIC_VERSION}/emissions/emissions_co2budget_scenarios_${PUBLIC_VERSION.toLocaleUpperCase()}.csv`,
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					dataPaths = results.data;
				}
			}
		}
	);

	// Papa.parse(`../../data/${PUBLIC_VERSION}/emissions/emissions_co2_historic.csv`,
	Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/emissions/emissions_co2_historic.csv`,
		// `../data/${PUBLIC_VERSION}/emissions/emissions_co2_historic.csv`,
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					dataHistoric = results.data;
				}
			}
		}
	);

	// DE THG
	Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/emissions/emissions_by_sectors.csv`,
		// `../data/${PUBLIC_VERSION}/emissions/emissions_by_sectors.csv`,
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					thgPathDe = results.data.map((d) => {
						return { year: d.year, thg: d.total_co2e_t / 1000000 };
					});
				}
			}
		}
	);

	$: selectedStartYear = containerWidth > 1000 ? 1990 : 2000;

	$: chosenBudget = budget.find(
		(d) => d.temperature == chosenTemperature && d.probability == chosenProbability
	);
	$: chosenTemperature = 1.5;
	$: chosenProbability = 66;

	$: containerWidth = 0;
</script>

<div class="relative" bind:clientWidth={containerWidth}>
	<div
		id="switch"
		class="flex flex-wrap gap-4 items-center text-sm {PUBLIC_VERSION == 'at' ? 'hidden' : ''}"
	>
		<div class="flex gap-2 items-center bg-gray-100 rounded-full py-1 px-3">
			<label class="flex items-center gap-1 {chosenProbability == 66 ? 'font-bold' : ''}">
				<input type="radio" value={66} bind:group={chosenProbability} />
				<span>66%</span>
			</label>
			{#if chosenTemperature == 1.5}
				<label class="flex items-center gap-1 {chosenProbability == 50 ? 'font-bold' : ''}">
					<input type="radio" value={50} bind:group={chosenProbability} />
					<span>50%</span>
				</label>
			{/if}
			<span class="font-bold">Eintrittswahrscheinlichkeit</span>
		</div>
		<div>
			<div class="flex gap-2 items-center bg-gray-100 rounded-full py-1 px-3">
				<label class="flex items-center gap-1 {chosenTemperature == 1.5 ? 'font-bold' : ''}">
					<input type="radio" name="goal" value={1.5} bind:group={chosenTemperature} />
					<span>+1,5°C</span>
				</label>
				<!-- <label class="flex items-center gap-1 {chosenTemperature == 1.65 ? 'font-bold' : ''}">
					<input type="radio" name="goal" value={1.65} bind:group={chosenTemperature} />
					<span>+1,5°C (zwischenzeitlich 1.65°C)</span>
				</label> -->
				<label class="flex items-center gap-1 {chosenTemperature == 1.75 ? 'font-bold' : ''}">
					<input
						type="radio"
						name="goal"
						value={1.75}
						bind:group={chosenTemperature}
						on:click={() => {
							chosenProbability = 66;
						}}
					/>
					<span>+1,75°C</span>
				</label>
				<span class="font-bold">Temperaturlimit</span>
			</div>
		</div>
		<div>
			<div class="flex gap-2 items-center bg-gray-100 rounded-full py-1 px-3">
				<label class="flex items-center gap-1 {showKSGGoal ? 'font-bold' : ''}">
					<input type="checkbox" bind:checked={showKSGGoal} />
					<span>Reduktionspfad der Bundesregierung anzeigen</span>
				</label>
			</div>
		</div>
	</div>
</div>

{#if dataHistoric && dataPaths}
	<Chart {dataHistoric} {dataPaths} {chosenBudget} {selectedStartYear} {showKSGGoal} {thgPathDe} />
{/if}

<div id="settings" class="flex items-center gap-2 text-sm mt-2 md:mt-0">
	<span>Startjahr auswählen</span>
	<input
		type="number"
		min="1990"
		max="2020"
		bind:value={selectedStartYear}
		class="px-3 py-1 w-20 bg-gray-100 rounded-full"
	/>
</div>

{#if chosenProbability == 50 && chosenTemperature == 1.65}
	<div class="flex text-sm text-budgetDefault items-center space-x-2">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="w-6 h-6 icon icon-tabler icon-tabler-alert-triangle"
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
			<path d="M12 9v2m0 4v.01" />
			<path
				d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"
			/>
		</svg>
		<div class="max-w-2xl">
			{#if chosenProbability == 50}
				<p class="mt-2">{v.disclaimerProbability}</p>
			{/if}
			{#if chosenTemperature == 1.65}
				<p class="mt-2">{v.disclaimerTemperature}</p>
			{/if}
		</div>
	</div>
{/if}

{#if v == undefined}
	<p class="text-lg max-w-4xl mt-2 text-prose">
		{@html v['text' + chosenBudget.value]}
	</p>
{/if}
