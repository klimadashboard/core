<script>
	import Papa from 'papaparse';
	import Scroller from '@sveltejs/svelte-scroller';
	import Chart from './Chart.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { fade } from 'svelte/transition';
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
			budget: 5012
		},
		{
			year: 2017,
			budget: 4231
		},
		{
			year: 2018,
			budget: 3460
		},
		{
			year: 2019,
			budget: 2707
		},
		{
			year: 2020,
			budget: 2007
		},
		{
			year: 2021,
			budget: 1361
		},
		{
			year: 2022,
			budget: 687
		},
		{
			year: 2023,
			budget: 19
		}
	];

	let yearsHighlighted = [];

	const sources = [
		{
			index: 2,
			label:
				"Emissionen: Gütschow et al. (2023) PRIMAP / <a href='https://www.umweltbundesamt.de/presse/pressemitteilungen/klimaemissionen-sinken-2023-um-101-prozent'>UBA</a>"
		},
		{
			index: 3,
			label:
				"Emissionen: Gütschow et al. (2023) PRIMAP / <a href='https://www.umweltbundesamt.de/presse/pressemitteilungen/klimaemissionen-sinken-2023-um-101-prozent'>UBA</a>"
		}
	];
</script>

<div class="-mt-24">
	<Scroller bind:index bind:offset bind:progress>
		<div
			slot="background"
			class="p-4 w-screen relative bg-gray-100 grid background"
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
					{yearsHighlighted}
				/>
			{:else}
				Loading...
			{/if}
			<div class="absolute bottom-2 left-0 right-0">
				<p class="text-xs left-4 absolute" />
				<div class="max-w-3xl mx-auto flex justify-between text-sm text-gray-600">
					<div class="flex items-center space-x-1">
						<div class="w-1.5 h-1.5 rounded-xl bg-current" />
						<p class="">
							entspricht {blockValue} Millionen Tonnen CO2.
						</p>
					</div>
					<div>
						{#if sources.find((d) => d.index == index)}
							{#key index}
								<p transition:fade>{@html sources.find((d) => d.index == index).label}</p>
							{/key}
						{/if}
					</div>
				</div>
			</div>
		</div>
		<div slot="foreground" class="foreground">
			<section>
				<h1 class="text-2xl md:text-3xl font-light">
					Von 1750 bis <span class="tabular-nums">{currentYear}</span> hat Deutschland
					<nobr
						><span class="tabular-nums">{formatNumber(currentYearTotalEmissions)}</span> Millionen Tonnen
						CO2</nobr
					> ausgestoßen.
				</h1>
				<h2 class="text-2xl md:text-3xl text-energy" in:fade={{ delay: 5000 }}>
					Deutschlands faires CO₂-Budget für die Einhaltung der <nobr>1,5 °C-Grenze</nobr> wurde jetzt
					überschritten.
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
			</section>
			<section>
				<div class="section-background">
					<h2 class="text-xl">
						Kohlenstoffdioxid (CO₂) entsteht hauptsächlich durch die Verbrennung von fossilen
						Brennstoffen wie Kohle, Öl und Gas. Dies geschieht bspw. Bei der Energieerzeugung, in
						der Industrie oder im Verkehr.
					</h2>
				</div>
			</section>
			<section>
				<div class="section-background">
					<h2 class="text-xl">
						Deutschland stößt seit dem 18. Jahrhundert CO₂ aus. Der Höhepunkt wurde 1979 erreicht.
						Seitdem sind die Emissionen gesunken, zuletzt 2023 um -11% gegenüber dem Vorjahr.
					</h2>
				</div>
			</section>
			<section>
				<div class="section-background">
					<h2 class="text-xl">
						2015 wurde das Pariser Klimaabkommen verabschiedet. Darin haben sich 197 Staaten – auch
						Deutschland – völkerrechtlich bindend geeinigt, die Erderhitzung auf 1,5 Grad bzw. weit
						unter 2 Grad zu begrenzen.
					</h2>
				</div>
			</section>
			<section>
				<div class="section-background">
					<p class="text-xl">
						Der Weltklimarat (IPCC) hat ermittelt, wie viel CO₂ weltweit noch maximal ausgestoßen
						werden darf, um die 1,5-Grad-Grenze mit einer Wahrscheinlichkeit von 67% einzuhalten.
						Der Sachverständigenrat für Umweltfragen (SRU) hat wiederum den fairen Anteil
						Deutschlands am globalen CO₂-Budget berechnet.
					</p>
					<p class="text-xl my-2">
						Ab 2016 durfte Deutschland demnach maximal <strong class="bg-economy bg-opacity-50 p-1"
							>5 012 Millionen Tonnen CO₂</strong
						> ausstoßen.
					</p>
					<div class="my-2">
						<p class="text-4xl font-light">{formatNumber(budgets[0].budget)}</p>
						<p>
							Verbleibendes Budget im Jahr {budgets[0].year}
						</p>
					</div>
					<p class="text-xl text-energy my-2">
						Deutschland hat Anfang 2023 sein faires 1,5-Grad-Budget überschritten. (67%
						Wahrscheinlichkeit)
					</p>
				</div>
			</section>
			<section>
				<div class="section-background">
					<h2 class="text-xl">
						Wenn die Wahrscheinlichkeit, die 1,5-Grad-Grenze einzuhalten, auf 50% reduziert wird,
						vergrößert sich Deutschlands CO₂-Budget geringfügig. In 2 von 4 Fällen würde die Grenze
						überschritten werden, was verheerende Folgen nach sich ziehen würde.
					</h2>
				</div>
			</section>
			<section>
				<div class="section-background">
					<p>
						Deutschlands maximales CO2-Budget für die Einhaltung der 1,5 °C-Grenze ist
						überschritten. Was bedeutet das konkret? Es wäre falsch zu behaupten, Deutschland könne
						nun klimapolitisch den Kopf in den Sand stecken, weil das eigene 1,5°C-Budget bereits
						überschritten ist. Gerade jetzt hat die Bundesregierung eine besondere Verantwortung,
						den Klimaschutz auf nationaler und internationaler Ebene deutlich voranzutreiben. Jedes
						Zehntelgrad zählt. Mit jedem Zehntelgrad Temperaturanstieg nehmen Extremwetterereignisse
						zu. XXX mehr davon
					</p>
				</div>
			</section>
			<section>
				<div class="section-background">
					<h2 class="text-xl">
						Das maximale deutsche CO₂-Budget wird größer, wenn der Grenzwert für die Erderhitzung
						bis 2100 nicht bei 1,5 Grad, sondern bei 1,75 Grad liegt.
					</h2>
					<h2 class="text-xl">
						Wenn wir weiterhin so viel emittieren wie im Jahr 2023 (594 Millionen Tonnen CO₂)
						überschreiten wir das Budget bereits Mitte 2030.
					</h2>
				</div>
			</section>
			<section>
				<div class="section-background">
					<h2 class="text-xl">
						Reduzieren wir jedes Jahr dieselbe Menge an CO₂, nämlich 46 Millionen Tonnen, wird das
						Budget in 12 Jahren - 2036 - überschritten.
					</h2>
				</div>
			</section>
			<section>
				<div class="section-background">
					<h2 class="text-xl">
						Die Bundesregierung plant jedoch, erst 2045 Klimaneutralität zu erreichen. Um das
						verbleibende Budget bis 2045 zu strecken, müssten die CO₂-Emissionen jedes Jahr um 12.7%
						im Vergleich zum Vorjahr sinken.
					</h2>
				</div>
			</section>
		</div>
	</Scroller>
</div>

<style>
	.background {
		@apply h-screen;
	}

	.section-background {
		@apply bg-white bg-opacity-20 backdrop-blur-lg p-4 inline-block;
	}

	.foreground section {
		height: calc(100vh - 6rem);
		@apply p-16 pt-32 max-w-4xl mx-auto;
	}
</style>
