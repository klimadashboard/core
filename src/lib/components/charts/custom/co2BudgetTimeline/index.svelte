<script>
	import Papa from 'papaparse';
	import Scroller from '@sveltejs/svelte-scroller';
	import Chart from './Chart.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	export let v;

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

	$: if (currentYear > 2023) {
		clearInterval(timer);
	}

	const budgets = [
		{
			year: 2016,
			budget: 4830,
			offset: 0.1
		},
		{
			year: 2017,
			budget: 4031,
			offset: 0.15
		},
		{
			year: 2018,
			budget: 3251,
			offset: 0.18
		},
		{
			year: 2019,
			budget: 2417,
			offset: 0.22
		},
		{
			year: 2020,
			budget: 1644,
			offset: 0.27
		},
		{
			year: 2021,
			budget: 927,
			offset: 0.31
		},
		{
			year: 2022,
			budget: 195,
			offset: 0.35
		},
		{
			year: 2023,
			budget: -541,
			offset: 0.38
		},
		{ year: 2024, budget: -1195, offset: 0.41 },
		{ year: 2025, budget: -1810, offset: 0.45 }
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
			label: 'Gütschow et al. (2025): PRIMAP / UBA (2025)'
		},
		{
			index: 3,
			label: 'Gütschow et al. (2025): PRIMAP / UBA (2025)'
		},
		{
			index: 4,
			label: 'SRU (2025): 1,5 Grad, 67%'
		},
		{
			index: 5,
			label: 'SRU (2025): 1,5 Grad, 67%'
		},
		{
			index: 6,
			label: 'SRU (2025): 1,5 Grad, 50%'
		},
		{
			index: 9,
			label: 'SRU (2025): 1,75 Grad, 67%'
		},
		{
			index: 10,
			label: 'SRU (2025): 1,75 Grad, 67%'
		},
		{
			index: 11,
			label: 'SRU (2025): 1,75 Grad, 67%'
		}
	];

	$: illustrationPosition = progress > 0 ? progress * -3500 : 0;
</script>

<div class="-mt-52 text-black">
	<Scroller bind:index bind:offset bind:progress>
		<div
			slot="background"
			class="p-4 relative bg-gray-100 grid co2b-background overflow-hidden"
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
			<img
				src="/images/co2b-illustration.png"
				alt="CO2-Emissionen haben vielfältige Quellen, vom Flugzeug zur Fabrik, vom Auto bis zum Kraftwerk."
				class="absolute w-[120vw] -translate-x-[10vw] max-w-xl md:left-1/2 md:-translate-x-1/2"
				style="bottom: {illustrationPosition || 0}px;"
			/>
			<div class="absolute bottom-0 w-full">
				<div class="max-w-3xl mx-auto flex items-center text-xs text-gray-600 p-2 transition">
					<div class="flex items-center space-x-1 font-bold">
						<div class="w-1.5 h-1.5 rounded-xl bg-current"></div>
						<p class="">
							entspricht
							{blockValue} Mio. t CO<sub>2</sub>
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
							><span class="tabular-nums">{formatNumber(currentYearTotalEmissions)}</span>
							Millionen Tonnen CO<sub>2</sub></nobr
						>
						ausgestoßen.
					</h1>
					<h2 class="text-2xl md:text-3xl text-energy" in:fade={{ delay: 5000 }}>
						Deutschlands hat sein CO<sub>2</sub>-Budget für die Einhaltung der
						<nobr>1,5-Grad-Grenze</nobr> überschritten.
					</h2>
					<div in:fade={{ delay: 5200 }} class="flex mt-4">
						<p class="font-bold leading-tight">Scrolle, um mehr zu erfahren</p>
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
						Kohlenstoffdioxid (CO<sub>2</sub>) entsteht hauptsächlich durch die Verbrennung von
						fossilen Brennstoffen wie Kohle, Öl und Gas, zum Beispiel um Energie zu erzeugen,
						Gebäude zu heizen oder Autos und LKWs anzutreiben.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						Deutschland stößt seit dem 18. Jahrhundert CO<sub>2</sub> aus. Der Höhepunkt wurde 1979
						erreicht. Seitdem sind die CO<sub>2</sub>-Emissionen gesunken, zuletzt 2024 um -6%
						gegenüber dem Vorjahr.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						2015 wurde das Pariser Klimaabkommen verabschiedet. Darin haben sich 197 Staaten – auch
						Deutschland – völkerrechtlich bindend geeinigt, die Erderhitzung auf 1,5 Grad bzw. weit
						unter 2 Grad zu begrenzen.<br />
						2025 stellte der Internationale Gerichtshof in Den Haag in seinem Gutachten fest, dass die
						Begrenzung der Erderhitzung auf <b>höchstens 1,5 Grad</b> im Vergleich zur
						vorindustriellen Zeit als <b>primäres Temperaturziel</b> aus dem Pariser Klimaabkommen zu
						verstehen ist.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<p class="text-lg">
						Auf Grundlage des weltweit verbleibenden CO<sub>2</sub>-Budgets für die 1,5-Grad-Grenze
						hat der Sachverständigenrat für Umweltfragen (SRU) ein maximales CO<sub>2</sub>-Budget
						für Deutschland berechnet. Hierfür verwendete der SRU den Anteil Deutschlands an der
						Weltbevölkerung im Jahr 2016. Wieso der SRU den Pro-Kopf-Ansatz gewählt hat, erfährst du
						in der Methodik am Ende der Seite.
					</p>
					<p class="text-lg my-2">
						Ab 2016 durfte Deutschland demnach maximal <strong class="bg-economy/50 p-1"
							>4.830 Millionen Tonnen CO<sub>2</sub></strong
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
					{#if selectedBudgetYear == budgets[budgets.length - 1]}
						<div class="text-energy transition">
							<p class="text-lg mt-4">
								Mitte 2022 hat Deutschland sein CO<sub>2</sub>-Budget überschritten.
							</p>
							<p>bei 67% Wahrscheinlichkeit, dass das 1,5-Grad-Limit eingehalten wird</p>
						</div>
					{/if}
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<p class="text-lg">
						Wenn man die Eintrittswahrscheinlichkeit für 1,5 Grad von 67% auf 50% senkt, vergrößert
						sich Deutschlands CO<sub>2</sub>-Budget etwas.
						<b>Aber auch dieses Budget hat Deutschland bereits aufgebraucht.</b>
					</p>
					<div class="grid grid-cols-2 my-4 gap-4 leading-snug">
						<div class="text-energy">
							<h3 class="font-bold">
								CO<sub>2</sub>-Budget bei <br /><span class="bg-energy text-white px-0.5">67%</span>
								Wahrscheinlichkeit,<br />das 1,5-Grad-Limit einzuhalten
							</h3>

							<p class="text-6xl font-light tabular-nums">{formatNumber(-1810)}</p>
							<p>Millionen Tonnen CO<sub>2</sub> <br />verbleibend ab 2025</p>
						</div>
						<div class="text-[#A61E7E]">
							<h3 class="font-bold">
								CO<sub>2</sub>-Budget bei <br /><span class="bg-[#A61E7E] text-white px-0.5"
									>50%</span
								>
								Wahrscheinlichkeit,<br />das 1,5-Grad-Limit einzuhalten
							</h3>

							<p class="text-6xl font-light tabular-nums">{formatNumber(-1280)}</p>
							<p>Millionen Tonnen CO<sub>2</sub> <br />verbleibend ab 2025</p>
						</div>
					</div>
				</div>
				<div class="co2b-section-background mt-8">
					<p class="text-lg">
						Auch das risikoreichere CO<sub>2</sub>-Budget (50%) haben wir bereits Ende 2022
						aufgebraucht.
						<span class="text-[#A61E7E]"
							>Damit hat Deutschland seine 1,5-Grad-Budgets überschritten.</span
						>
					</p>
				</div>
			</section>
			<section>
				<div class="co2b-section-background text-lg space-y-2 mb-80 mt-80 md:mt-0">
					<h2 class="text-2xl">{@html v['5_title'].replace('<p>', '').replace('</p>', '')}</h2>
					{@html v['5_text']}
				</div>
			</section>
			<section>
				<div class="co2b-section-background text-lg mb-80 mt-80 md:mt-0">
					{@html v['6_text']}
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						Deshalb hat der SRU auch ein maximales CO<sub>2</sub>-Budget für 1,75 Grad Erderhitzung
						berechnet. Das Budget ist demnach zwar größer, die Auswirkungen der globalen Erhitzung
						aber auch verheerender.
					</h2>
					<div class="my-4 leading-tight">
						<h3 class="font-bold">
							1,75-Grad-Budget bei <br /><span class="bg-industry text-white p-0.5">67%</span> Wahrscheinlichkeit
						</h3>

						<p class="text-6xl font-light tabular-nums">{formatNumber(2520)}</p>
						<p>Millionen Tonnen CO<sub>2</sub> <br />verbleibend ab 2025</p>
					</div>
					<h2 class="text-lg">
						Wenn Deutschland weiterhin so viel emittiert wie im Jahr 2024 (615 Millionen Tonnen CO<sub
							>2</sub
						>) hätten wir dieses Budget
						<strong class="bg-economy/50 p-1">im Jahr 2029 aufgebraucht</strong>.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<h2 class="text-lg">
						Das Klimaschutzgesetz sieht vor, 2045 Klimaneutralität zu erreichen. Das Budget für 1,75
						Grad ist bei linearer Emissionsreduktion jedoch nicht 2045, sondern schon
						<strong class="bg-economy/50 p-1">im Jahr 2033</strong> aufgebraucht.
					</h2>
				</div>
			</section>
			<section>
				<div class="co2b-section-background">
					<p class="text-lg">
						Um das 2045-Ziel der Bundesregierung einzuhalten und das Budget bis dahin zu strecken,
						müssten die CO<sub>2</sub>-Emissionen
						<strong class="bg-economy/50 p-1">jedes Jahr bis 2045 um 19,4%</strong>
						im Vergleich zum Vorjahr sinken.
					</p>
					<p class="text-lg mt-4">
						Seit 1945 gab es keinen so starken Emissionsrückgang. 2024 sanken die Emissionen um
						5,9%. Es sind also deutlich mehr politische Maßnahmen notwendig, um auf einen Pfad zu
						kommen, der mit dem 1,75-Grad-Budget kompatibel ist.
					</p>
				</div>
			</section>
			<section>
				<div class="co2b-section-background text-lg">
					<h2 class="text-2xl">{v['7_title'].replace('<p>', '').replace('</p>', '')}</h2>
					{@html v['7_text']}
					<p class="font-bold leading-tight mt-4 text-sm flex">
						{@html v['7_text_small']}
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
							class="inline -translate-y-1"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg
						>
					</p>
				</div>
			</section>
		</div>
	</Scroller>
</div>
