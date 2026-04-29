<script>
	import { Chart, AxisX, AxisY, Line, Area, BarStack, Tooltip } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import Loader from '$lib/components/Loader.svelte';

	export let dataUsage;
	export let selectedSource;
	export let selectedUnit;

	const texts = [
		{
			key: 'gas',
			eyebrow: 'Historische Entwicklung',
			heading: 'Der Gesamt-Gasverbrauch sinkt in den letzten Jahren.',
			text: 'Obwohl Erdgas klimaschädlich ist, da es selber hauptsächlich aus klimaschädlichem Methan besteht und bei seiner Verbrennung CO2 entsteht, wird weiterhin viel Erdgas verbraucht – wenn auch weniger seit dem russischen Angriff auf die Ukraine. In dem Diagram kann die Gesamtmenge des Verbrauchs, der Bruttoinlandsverbrauch, sowie verschiedene Untersektoren im historischen Vergleich angeschaut werden.',
			faq: [],
			data: "Datenquelle -<br> <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a>. ",
			data_readmore:
				"Negative Werte können auftreten. Eine Erklärung dieser Werte bietet die <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Energiebilanz-Dokumentation der Statistik Austria</a>."
		},
		{
			key: 'oil',
			eyebrow: 'Historische Entwicklung',
			heading: 'Der Öl-Verbrauch in Österreich ist in den letzten Jahren nicht signifikant gesunken.',
			text: 'Über das Dropdown-Menü sind einzelne Regionen und Verbrauchskategorien auswählbar.',
			faq: [],
			data: "Datenquelle -<br> <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a>. ",
			data_readmore:
				"Negative Werte können auftreten. Eine Erklärung dieser Werte bietet die <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Energiebilanz-Dokumentation der Statistik Austria</a>."
		},
		{
			key: 'coal',
			eyebrow: 'Historische Entwicklung',
			heading: 'Österreichs Kohle-Verbrauch sinkt in den letzten Jahren.',
			text: 'Mit der Abschaltung des letzten Kohlekraftwerks im April 2020 spielt Kohle nur noch eine untergeordnete Rolle in Österreich.',
			faq: [],
			data: "Datenquelle -<br> <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a>.",
			data_readmore:
				"Negative Werte können auftreten. Eine Erklärung dieser Werte bietet die <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Energiebilanz-Dokumentation der Statistik Austria</a>."
		}
	];

	const round = (value, noDecimals) =>
		noDecimals ? Math.round(value) : Math.round(value * 10) / 10;

	const formatCategory = (category) => {
		let str = category
			.replaceAll('_', ' / ')
			.toLowerCase()
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.substring(1))
			.join(' ');
		return str
			.replaceAll('Energeendverbrauch', 'Energetischer Endverbrauch')
			.replaceAll('Evu', 'Energieversorgungsunternehmen')
			.replaceAll('Uea', 'Unternehmenseigene Anlagen')
			.replaceAll('Verbrauchdessektorsenergie', 'Eigenverbrauch des Sektors Energie')
			.replaceAll('Nichtenergetischerverbrauch', 'Nicht-energetischer Verbrauch')
			.replaceAll('Energetischerendverbrauch', 'Energetischer Endverbrauch');
	};

	let selectedRegion = 'austria';
	let selectedSector = 'bruttoinlandsverbrauch_TWh';
	let readMore = false;

	$: currentText = texts.find((t) => t.key === selectedSource);
	$: austriaDataset = dataUsage.find((d) => d.year === 2023 && d.region === 'austria');
	$: unit = selectedUnit === 'wattHours' ? 'TWh' : 'TJ';
	$: sectorLabel = selectedSector.replaceAll('_', ' ').replace('TWh', '');

	$: lineData = dataUsage
		.filter((d) => d.region === selectedRegion && d[selectedSector] > 0)
		.map((entry, i) => ({
			x: i,
			label: String(entry.year),
			value:
				selectedUnit === 'wattHours'
					? round(entry[selectedSector])
					: round(entry[selectedSector] * 3600, true)
		}));

	$: yMax = lineData.length ? Math.max(...lineData.map((d) => d.value)) * 1.15 : 100;
</script>

<div class="mt-16">
	<div class="md:flex items-end justify-between">
		<div>
			<h3 class="uppercase tracking-wide text-sm font-semibold mb-2">{currentText.eyebrow}</h3>
			<h2 class="text-2xl max-w-md">{currentText.heading}</h2>
		</div>

		<div class="flex flex-wrap items-center gap-4 mt-6 text-sm">
			<div class="relative text-gray-600 max-w-full">
				<svg xmlns="http://www.w3.org/2000/svg" class="absolute pointer-events-none h-full right-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<polyline points="8 9 12 5 16 9" />
					<polyline points="16 15 12 19 8 15" />
				</svg>
				<select name="selectedRegion" bind:value={selectedRegion} class="block appearance-none bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-gray-400 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-xs w-full">
					<option value="austria">Österreich</option>
					<option value="burgenland">Burgenland</option>
					<option value="steiermark">Steiermark</option>
					<option value="tirol">Tirol</option>
					<option value="vorarlberg">Vorarlberg</option>
					<option value="wien">Wien</option>
					<option value="niederoesterreich">Niederösterreich</option>
					<option value="oberoesterreich">Oberösterreich</option>
					<option value="salzburg">Salzburg</option>
					<option value="kaernten">Kärnten</option>
				</select>
			</div>

			<div class="relative text-gray-600">
				<svg xmlns="http://www.w3.org/2000/svg" class="absolute pointer-events-none h-full right-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<polyline points="8 9 12 5 16 9" />
					<polyline points="16 15 12 19 8 15" />
				</svg>
				<select name="selectedSector" bind:value={selectedSector} class="block appearance-none bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-gray-400 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-xs w-full">
					<option value="bruttoinlandsverbrauch_TWh">Bruttoinlandsverbrauch</option>
					{#if austriaDataset}
						{#each Object.keys(austriaDataset).splice(3).filter((entry, index) => Object.values(austriaDataset).splice(3)[index] > 0) as category}
							<option value={category}>{formatCategory(category)}</option>
						{/each}
					{/if}
				</select>
			</div>
		</div>
	</div>
</div>

<div class="w-full h-64 mt-4 md:-mx-5">
	{#if lineData.length}
		<Chart
			data={lineData}
			x="x"
			y="value"
			height={256}
			yMin={0}
			{yMax}
			margin={{ top: 10, right: 20, bottom: 35, left: 60 }}
		>
			<svelte:fragment
				slot="default"
				let:xScale
				let:yScale
				let:xDomain
				let:innerWidth
				let:innerHeight
				let:hover
			>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={(v) => lineData[Math.round(v)]?.label ?? ''}
					tickCount={6}
				/>
				<Area
					data={lineData}
					x="x"
					y="value"
					color="#7CBAB3"
					{xScale}
					{yScale}
					opacity={0.3}
					curve="monotone"
				/>
				<Line
					data={lineData}
					x="x"
					y="value"
					{xScale}
					{yScale}
					stroke="#7CBAB3"
					strokeWidth={2}
					dots={true}
					dotRadius={3}
					{hover}
				/>
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} unit={unit} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const pt = lineData.find((d) => d.x === hover.x)}
					{#if pt}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={pt.label}
							items={[{
								label: sectorLabel,
								value: formatNumber(pt.value, 1) + ' ' + unit,
								color: '#7CBAB3'
							}]}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>
	{:else}
		<Loader />
	{/if}
</div>

<div class="flex flex-col md:flex-row gap-2 justify-between mt-8">
	<div>
		<p class="max-w-lg">{currentText.text}</p>
		<div class="mt-4">
			{#each currentText.faq as faq}
				<details class="my-2">
					<summary class="text-gray-800 dark:text-gray-200 border-b">{faq.question}</summary>
					<p class="max-w-lg">{@html faq.answer}</p>
				</details>
			{/each}
		</div>
	</div>

	<p class="text-gray-400 max-w-xs text-sm md:border-l border-gray-300 md:pl-4">
		{@html currentText.data}
		{#if currentText.data_readmore}
			{#if readMore}{@html currentText.data_readmore}{/if}
			<button on:click={() => (readMore = !readMore)} type="button" class="text-gray-400 dark:text-gray-400">
				{#if readMore}Weniger lesen &uarr;{:else}Mehr lesen &darr;{/if}
			</button>
		{/if}
	</p>
</div>
