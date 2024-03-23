<script>
	import Papa from 'papaparse';
	import Scroller from '@sveltejs/svelte-scroller';
	import Chart from './Chart.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	let index, offset, progress;

	let historicalData = [];
	let futureData = [];
	let blockValue = 25;

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

	Papa.parse('../data_temp/01n_emissions_co2_budget_scenarios_UPDATE.csv', {
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
		}, 10);
	});

	$: if (currentYear > 2022) {
		clearInterval(timer);
	}

	const budgets = [
		{
			year: 2016,
			budget: 5012,
			offset: 0.25
		},
		{
			year: 2017,
			budget: 4231,
			offset: 0.28
		},
		{
			year: 2018,
			budget: 3460,
			offset: 0.3
		},
		{
			year: 2019,
			budget: 2707,
			offset: 0.32
		},
		{
			year: 2020,
			budget: 2007,
			offset: 0.34
		},
		{
			year: 2021,
			budget: 1361,
			offset: 0.36
		},
		{
			year: 2022,
			budget: 687,
			offset: 0.38
		},
		{
			year: 2023,
			budget: 19,
			offset: 0.4
		},
		{ year: 2024, budget: -575, offset: 0.47 }
	];

	let selectedBudgetYear = budgets[0];

	$: if (index == 5) {
		selectedBudgetYear = budgets.reduce((prev, curr) => {
			return Math.abs(curr.offset - offset) < Math.abs(prev.offset - offset) ? curr : prev;
		});
	}

	const sources = [
		{
			index: 2,
			label:
				"Daten: Gütschow et al. PRIMAP / <a href='https://www.umweltbundesamt.de/presse/pressemitteilungen/klimaemissionen-sinken-2023-um-101-prozent'>UBA</a>"
		},
		{
			index: 3,
			label:
				"Daten: Gütschow et al. PRIMAP / <a href='https://www.umweltbundesamt.de/presse/pressemitteilungen/klimaemissionen-sinken-2023-um-101-prozent'>UBA</a>"
		},
		{
			index: 4,
			label: 'Daten: SRU (1,5 Grad, 67%)'
		},
		{
			index: 5,
			label: 'Daten: SRU (1,5 Grad, 67%)'
		},
		{
			index: 6,
			label: 'Daten: SRU (1,5 Grad, 50%)'
		},
		{
			index: 8,
			label: 'Daten: SRU (1,75 Grad, 67%)'
		},
		{
			index: 9,
			label: 'Daten: SRU (1,75 Grad, 67%)'
		},
		{
			index: 10,
			label: 'Daten: SRU (1,75 Grad, 67%)'
		}
	];
</script>

<div class="-mt-24">
	<Scroller bind:index bind:offset bind:progress>
		<div
			slot="background"
			class="p-4 w-screen relative bg-gray-100 grid co2b-background"
			bind:clientHeight={chartHeight}
			bind:clientWidth={chartWidth}
		>
			{#if historicalData.length > 0 && chartWidth && chartHeight}
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
					{selectedBudgetYear}
				/>
			{:else}
				Loading...
			{/if}
			<div class="absolute bottom-0 w-full">
				<div class="max-w-3xl mx-auto flex items-center text-xs text-gray-600 p-2">
					<div class="flex items-center space-x-1 font-bold">
						<div class="w-1.5 h-1.5 rounded-xl bg-current" />
						<p class="">
							entspricht
							{blockValue} Mio. t CO₂
						</p>
					</div>
					<div class="ml-auto">
						{#if sources.find((d) => d.index == index)}
							{#key index}
								<p transition:slide>{@html sources.find((d) => d.index == index).label}</p>
							{/key}
						{/if}
					</div>
				</div>
			</div>
		</div>
		<div slot="foreground" class="co2b-foreground">
			<section>
				<div class="co2b-section-background">
					<h1 class="text-2xl md:text-3xl font-light max-w-xl">
						Von 1750 bis <span class="tabular-nums">{currentYear}</span> hat Deutschland
						<nobr
							><span class="tabular-nums">{formatNumber(currentYearTotalEmissions)}</span> Millionen
							Tonnen CO<sub>2</sub></nobr
						>
						ausgestoßen.
					</h1>
					<h2 class="text-2xl md:text-3xl text-energy" in:fade={{ delay: 5000 }}>
						Deutschlands faires CO<sub>2</sub>-Budget für die Einhaltung der
						<nobr>1,5 °C-Grenze</nobr> wurde jetzt überschritten.
					</h2>
					<div in:fade={{ delay: 5200 }} class="flex mt-4">
						<p class="font-bold leading-tight">
							Scrolle, um mehr zu erfahren <br /><span class="font-normal opacity-60"
								>oder drücke die Leertaste</span
							>
						</p>
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
							class=""
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg
						>
					</div>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						Kohlenstoffdioxid (CO₂) entsteht hauptsächlich durch die Verbrennung von fossilen
						Brennstoffen wie Kohle, Öl und Gas, zum Beispiel um Energie zu erzeugen, Gebäude zu
						heizen oder Autos und LKWs anzutreiben.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						Deutschland stößt seit dem 18. Jahrhundert CO₂ aus. Der Höhepunkt wurde 1979 erreicht.
						Seitdem sind die Emissionen gesunken, zuletzt 2023 um -11% gegenüber dem Vorjahr.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						2015 wurde das Pariser Klimaabkommen verabschiedet. Darin haben sich 197 Staaten – auch
						Deutschland – völkerrechtlich bindend geeinigt, die Erderhitzung auf 1,5 Grad bzw. weit
						unter 2 Grad zu begrenzen.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<p class="text-lg">
						Der Weltklimarat (IPCC) hat ermittelt, wie viel CO₂ weltweit noch maximal ausgestoßen
						werden darf, um die 1,5-Grad-Grenze mit einer Wahrscheinlichkeit von 67% einzuhalten.
						Der Sachverständigenrat für Umweltfragen (SRU) hat wiederum den fairen Anteil
						Deutschlands am globalen CO₂-Budget berechnet.
					</p>
					<p class="text-lg my-2">
						Ab 2016 durfte Deutschland demnach maximal <strong class="bg-economy bg-opacity-50 p-1"
							>5.012 Millionen Tonnen CO₂</strong
						> ausstoßen.
					</p>
				</div>
			</section>
			<section>
				<div class="co2b-section-background w-full">
					<div class={selectedBudgetYear.budget < 0 ? 'text-energy' : 'text-industry'}>
						<p class="text-6xl font-light tabular-nums">
							{formatNumber(selectedBudgetYear.budget)}
						</p>
						<p>
							Millionen Tonnen CO<sub>2</sub><br />
							verbleibendes Budget ab {selectedBudgetYear.year}
						</p>
					</div>
					<div
						class="text-energy transition {selectedBudgetYear == budgets[budgets.length - 1]
							? 'opacity-100'
							: 'opacity-0'}"
					>
						<p class="text-lg mt-4">
							Anfang 2023 hat Deutschland sein faires CO₂-Budget überschritten.
						</p>
						<p>bei 67% Wahrscheinlichkeit, dass das 1,5-Grad-Limit eingehalten wird</p>
					</div>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<p class="text-lg">
						Wenn man das Risiko erhöht und einen Münzwurf über die Einhaltung des 1,5-Grad-Limits
						entscheiden lässt, vergrößert sich Deutschlands CO₂-Budget etwas.
					</p>
					<div class="grid grid-cols-2 my-4 gap-4 leading-snug">
						<div class="text-energy">
							<h3 class="font-bold">
								CO₂-Budget bei <br /><span class="bg-energy text-white px-0.5">67%</span>
								Wahrscheinlichkeit,<br />das 1,5-Grad-Limit einzuhalten
							</h3>

							<p class="text-6xl font-light tabular-nums">{formatNumber(-575)}</p>
							<p>Millionen Tonnen CO₂ <br />verbleibend ab 2024</p>
						</div>
						<div>
							<h3 class="font-bold">
								CO₂-Budget bei <br /><span class="bg-industry text-white px-0.5">50%</span>
								Wahrscheinlichkeit,<br />das 1,5-Grad-Limit einzuhalten
							</h3>

							<p class="text-6xl font-light tabular-nums">{formatNumber(125)}</p>
							<p>Millionen Tonnen CO₂ <br />verbleibend ab 2024</p>
						</div>
					</div>
				</div>
				<div class="co2b-section-background mt-8">
					<p class="text-lg">
						Auch das risikoreichere CO₂-Budget (50%) haben wir im Frühling 2024 bereits
						aufgebraucht. <span class="text-energy"
							>Damit hat Deutschland seine fairen 1,5-Grad-Budgets endgültig überschritten.</span
						>
					</p>
				</div>
			</section>
			<section>
				<div class="co2b-section-background text-lg space-y-2 mb-80">
					<h2 class="text-2xl">Was bedeutet das für Deutschland?</h2>
					<p>
						Mit der Überschreitung des nationalen CO₂-Budgets ist es wichtig, <strong
							>Deutschlands Rolle in der Welt</strong
						>
						kritisch zu beleuchten. Als Land mit besonders starker
						<strong>historischer Verantwortung</strong> sollte Deutschland und die gesamte
						europäische Union die eigene Verantwortung für Schäden und Verlusten klar anerkennen. Im
						Sinne der Klimagerechtigkeit sollte eine
						<strong>Erhöhung internationaler Klimafinanzierung</strong> angedacht werden. Zukünftig könnte
						sich auch das Völkerrecht weiterentwickeln, wodurch eine Überschreitung des CO₂-Budgets zum
						Haftungsrisiko wird.
					</p>
					<p>
						Kontrovers diskutiert werden <strong>alternative Mechanismen</strong>, um das nationale
						CO₂-Budget noch einzuhalten. Durch technologische Lösungen wie Carbon Capture and
						Storage (CCS) sollen Negativemissionen ermöglicht werden, also mehr CO<sub>2</sub>
						gespeichert als ausgestoßen werden. Diese Technologien haben allerdings noch keinen Reifegrad
						erreicht, der großflächige Anwendung sinnvoll machen würde. Ein anderer Vorschlag ist, Emissionsminderungen
						im Ausland quasi als Ausgleich für Deutschlands Überschreitungen zu finanzieren. Oft dienen
						diese Argumente als
						<strong>Ablenkung von wirksamen und bereits umsetzbaren Klimaschutzmaßnahmen</strong> und
						widersprechen den Grundsätzen der Klimagerechtigkeit.
					</p>
					<p>
						Die Überschreitung des 1,5 °C-Budgets bedeutet nicht, dass alles verloren wäre. Es ist
						umso wichtiger, dass der Klimaschutz auf nationaler und internationaler Ebene weiter
						vorangetrieben wird. Denn: <strong>mit jedem Zehntel Grad</strong> wird die Anpassung an
						die Erhitzung zunehmend schwieriger, die Anzahl der überschrittenen Kipppunkte steigt und
						die unbewohnbaren Bereiche des Planeten (durch Meeresspiegelanstieg, Dürre oder andere Faktoren)
						werden größer.
					</p>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						Wenn nur 1,75 Grad statt 1,5 Grad bis 2100 erreicht werden sollen, wird das deutsche
						CO₂-Budget größer, die Auswirkungen der globalen Erhitzung aber auch schwerwiegender.
					</h2>
					<div class="my-4 leading-tight">
						<h3 class="font-bold">
							1,75-Grad-Budget bei <br /><span class="bg-industry text-white p-0.5">67%</span> Wahrscheinlichkeit
						</h3>

						<p class="text-6xl font-light tabular-nums">{formatNumber(3859)}</p>
						<p>Millionen Tonnen CO₂ <br />verbleibend ab 2024</p>
					</div>
					<h2 class="text-lg">
						Wenn Deutschland weiterhin so viel emittiert wie im Jahr 2023 (594 Millionen Tonnen CO₂)
						hätten wir dieses Budget <strong class="bg-economy bg-opacity-50 p-1"
							>im Jahr 2030 aufgebraucht</strong
						>.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						Reduzieren wir jedes Jahr dieselbe Menge an CO₂, nämlich 46 Millionen Tonnen, ist das
						Budget <strong class="bg-economy bg-opacity-50 p-1">im Jahr 2036</strong> aufgebraucht.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<p class="text-lg">
						Die Bundesregierung plant jedoch, erst 2045 Klimaneutralität zu erreichen. Somit müssten
						die CO₂-Emissionen <strong class="bg-economy bg-opacity-50 p-1"
							>jedes Jahr bis 2045 um 12,7%</strong
						>
						im Vergleich zum Vorjahr sinken.
					</p>
					<p class="text-lg mt-4">
						Seit 1990 gab es keinen so starken Emissionsrückgang. 2023 gab es einen Rückgang von
						11,1%, ein Rekordwert in den vergangenen Jahrzehnten. Es sind also mehr politische
						Maßnahmen notwendig, um auf einen Pfad zu kommen, der mit dem 1,75-Grad-Budget
						kompatibel ist.
					</p>
				</div>
			</section>
		</div>
	</Scroller>
</div>
