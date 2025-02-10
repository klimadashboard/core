<script>
	import Loader from '$lib/components/Loader.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import LineChart from '$lib/components/charts/chartLine.svelte';
	import BarChart from '$lib/components/charts/chartBar.svelte';

	export let dataUsage;
	export let selectedSource;
	export let selectedUnit;

	let texts = [
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
			heading:
				'Der Öl-Verbrauch in Österreich ist in den letzten Jahren nicht signifikant gesunken.',
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

	const keys = ['value'];
	$: labels = [selectedSector.replaceAll('_', ' ').replace('TWh', '')];
	const colors = ['#7CBAB3'];

	const round = function (value, noDecimals) {
		var roundedValues = 0;
		if (noDecimals) {
			roundedValues = Math.round(value);
		} else {
			roundedValues = Math.round(value * 10) / 10;
		}
		if (roundedValues == 0) {
			return value;
		} else {
			return roundedValues;
		}
	};

	$: austriaDataset = dataUsage.find((d) => d.year == 2023 && d.region == 'austria');

	$: data = dataUsage
		.filter((d) => d.region == selectedRegion && d[selectedSector] > 0)
		.map((entry, i) => {
			return {
				x: i,
				label: entry.year,
				value:
					selectedUnit == 'wattHours'
						? round(entry[selectedSector])
						: round(entry[selectedSector] * 3600, true)
			};
		});

	$: selectedRegion = 'austria';
	$: selectedSector = 'bruttoinlandsverbrauch_TWh';

	$: formatCategory = function (category) {
		var string = category
			.replaceAll('_', ' / ')
			.toLowerCase()
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.substring(1))
			.join(' ');
		string = string
			.replaceAll('Energeendverbrauch', 'Energetischer Endverbrauch')
			.replaceAll('Evu', 'Energieversorgungsunternehmen')
			.replaceAll('Uea', 'Unternehmenseigene Anlagen')
			.replaceAll('Verbrauchdessektorsenergie', 'Eigenverbrauch des Sektors Energie')
			.replaceAll('Nichtenergetischerverbrauch', 'Nicht-energetischer Verbrauch')
			.replaceAll('Energetischerendverbrauch', 'Energetischer Endverbrauch');
		return string;
	};

	$: readMore = false;
</script>

<div class="mt-16">
	<div class="md:flex items-end justify-between">
		<div>
			<h3 class="uppercase tracking-wide text-sm font-semibold mb-2">
				{texts.find((t) => t.key == selectedSource).eyebrow}
			</h3>
			<h2 class="text-2xl max-w-md">
				{texts.find((t) => t.key == selectedSource).heading}
			</h2>
		</div>

		<div class="flex flex-wrap items-center gap-4 mt-6 text-sm">
			<div class="relative text-gray-600 max-w-full">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="absolute pointer-events-none h-full right-2"
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
					name="selectedRegion"
					bind:value={selectedRegion}
					class="block appearance-none bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-gray-400 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-xs w-full"
				>
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
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="absolute pointer-events-none h-full right-2"
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
					name="selectedRegion"
					bind:value={selectedSector}
					class="block appearance-none bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 dark:text-gray-400 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-xs w-full"
				>
					<option value="bruttoinlandsverbrauch_TWh">Bruttoinlandsverbrauch</option>
					{#each Object.keys(austriaDataset)
						.splice(3)
						.filter((entry, index) => {
							return Object.values(austriaDataset).splice(3)[index] > 0;
						}) as category}
						<option value={category}>{formatCategory(category)}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
</div>

<div class="w-full h-64 mt-4 md:-mx-5">
	{#if data}
		<LineChart
			{data}
			{colors}
			{keys}
			{labels}
			showAreas={true}
			showDots={true}
			showTotal={false}
			unit={selectedUnit == 'wattHours' ? 'TWh' : 'TJ'}
		/>
	{:else}
		<Loader />
	{/if}
</div>

<div class="flex flex-col md:flex-row gap-2 justify-between mt-8">
	<div>
		<p class="max-w-lg">
			{texts.find((t) => t.key == selectedSource).text}
		</p>

		<div class="mt-4">
			{#each texts.find((t) => t.key == selectedSource).faq as faq, index}
				<details class="my-2">
					<summary class="text-gray-800 dark:text-gray-200 border-b">{faq.question}</summary>
					<p class="max-w-lg">{@html faq.answer}</p>
				</details>
			{/each}
		</div>
	</div>

	<p class="text-gray-400 max-w-xs text-sm md:border-l border-gray-300 md:pl-4">
		{@html texts.find((t) => t.key == selectedSource).data}
		{#if texts.find((t) => t.key == selectedSource).data_readmore}
			{#if readMore}
				{@html texts.find((t) => t.key == selectedSource).data_readmore}
			{/if}

			<button
				on:click={() => (readMore = !readMore)}
				type="button"
				class="text-gray-400 dark:text-gray-400"
			>
				{#if readMore}
					Weniger lesen &uarr;
				{:else}
					Mehr lesen &darr;
				{/if}
			</button>
		{/if}
	</p>
</div>
