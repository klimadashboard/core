<script>
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import Loader from '$lib/components/Loader.svelte';

	export let dataUsage;
	export let selectedSource;
	export let selectedUnit;

	let texts = [
		{
			key: 'gas',
			eyebrow: 'Bundesländervergleich',
			heading: 'Wien, Ober- & Niederösterreich haben den höchsten Erdgasverbrauch.',
			text: 'In Ober- & Niederösterreich ist der Erdgasverbrauch durch die dort sitzende Industrie am höchsten, während in Wien der Erdgasverbrauch durch den Einsatz in Kraft-Wärme-Kopplungs-Anlagen erhöht ist. Beim Bundesländervergleich muss man jedoch beachten, dass verschiedene Sektoren innerhalb eines Bundeslandes Strom oder Industriegüter für andere Bundesländer mitproduzieren.',
			faq: [],
			data: "Datenquelle -<br> <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a>. ",
			data_readmore:
				"Negative Werte können auftreten. Eine Erklärung dieser Werte bietet die <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Energiebilanz-Dokumentation der Statistik Austria</a>."
		},
		{
			key: 'oil',
			eyebrow: 'Bundesländervergleich',
			heading: 'Niederösterreich hat den höchsten Öl-Verbrauch.',
			text: 'In diesem Diagram kann der Einsatz von Ölprodukten in den verschiedenen Sektoren betrachtet werden und zwischen den Bundesländern für 15 Jahre verglichen werden. Beim Bundesländervergleich muss man beachten, dass verschiedene Sektoren innerhalb eines Bundeslandes z. B. Industriegüter für andere Bundesländer mitproduzieren.',
			faq: [
				{
					question: 'Warum ist der Öl-Verbrauch in NÖ so hoch?',
					answer:
						"In Niederösterreich liegt die einzige Raffnerie Österreichs, wo viele Ölprodukte verarbeitet werden. Darunter fallen 'Sonstige Produkte der Erdölverarbeitung' (also: Schmiermittel, Bitumen, kalzinierter Petrolkoks und Kohlenwasserstoffe für die Petrochemie). Der Einsatz dieser Produkte bildet den erhöhten Verbrauch im Nicht-energetische Sektor ab. Zusätzlich liegt der Flughafen Wien in Niederösterreich, weshalb der Verbrauch im Verkehrssektor erhöht ist."
				}
			],
			data: "Datenquelle -<br> <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a>.",
			data_readmore:
				"Negative Werte können auftreten. Eine Erklärung dieser Werte bietet die <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Energiebilanz-Dokumentation der Statistik Austria</a>."
		},
		{
			key: 'coal',
			eyebrow: 'Bundesländervergleich',
			heading: 'Kohle wird hauptsächlich in Oberösterreich und in der Steiermark eingesetzt.',
			text: 'In der Steiermark wurde das letzte Kohlekraftwerk 2020 abgestellt, weshalb der Verbrauch zurückgeht. In Oberösterreich wird Kohle in der Stahlproduktion eingesetzt.',
			faq: [],
			data: "Datenquelle -<br> <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Statistik Austria Energiebilanz Österreichs & der Bundesländer</a>.",
			data_readmore:
				"Negative Werte können auftreten. Eine Erklärung dieser Werte bietet die <a href='https://www.statistik.at/statistiken/energie-und-umwelt/energie/energiebilanzen' class='underline'>Energiebilanz-Dokumentation der Statistik Austria</a>."
		}
	];

	$: selectedYear = 2023;

	const round = function (value, noDecimals) {
		if (noDecimals) {
			return Math.round(value);
		}
		return Math.round(value * 10) / 10;
	};

	const capitalize = (s) => {
		if (typeof s !== 'string') return '';
		return s.charAt(0).toUpperCase() + s.slice(1);
	};

	$: filteredDataset = dataUsage.filter((d) => d.year == selectedYear && d.region !== 'austria');
	$: austriaDataset = dataUsage.find((d) => d.year == selectedYear && d.region == 'austria');

	$: data = filteredDataset.map((entry, i) => {
		return {
			label: capitalize(entry.region)
				.replaceAll('Niederoesterreich', 'Niederösterreich')
				.replaceAll('Oberoesterreich', 'Oberösterreich')
				.replaceAll('Kaernten', 'Kärnten'),
			categories: [
				{
					label: selectedCategory.replaceAll('_', ' ').replace('TWh', ''),
					value:
						selectedUnit == 'wattHours'
							? round(entry[selectedCategory])
							: round(entry[selectedCategory] * 3600, true),
					color: '#7CBAB3'
				}
			]
		};
	});

	$: selectedCategory = 'bruttoinlandsverbrauch_TWh';

	$: freezeYAxis = false;

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
				{texts.find((d) => d.key == selectedSource).eyebrow}
			</h3>
			<h2 class="text-2xl max-w-md">
				{texts.find((d) => d.key == selectedSource).heading}
			</h2>
		</div>

		<div class="mt-6 flex justify-between items-end flex-wrap text-sm">
			<div class="flex items-center gap-4 flex-wrap">
				<div class="flex gap-2 items-center">
					<input
						type="range"
						min="2005"
						max="2023"
						bind:value={selectedYear}
						aria-label="Jahr auswählen"
						on:mousedown={() => (freezeYAxis = true)}
						on:mouseup={() => (freezeYAxis = false)}
					/>
					<span>{selectedYear}</span>
				</div>

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
						bind:value={selectedCategory}
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
	<div class="w-full h-80 mt-4 md:-mx-5">
		{#if data}
			<BarChart
				{data}
				{freezeYAxis}
				visualisation="stacked"
				unit={selectedUnit == 'wattHours' ? 'TWh' : 'TJ'}
			/>
		{:else}
			<Loader />
		{/if}
	</div>

	<div class="flex flex-col md:flex-row gap-2 justify-between mt-8">
		<div>
			<p class="max-w-lg">
				{texts.find((d) => d.key == selectedSource).text}
			</p>

			<div class="mt-4">
				{#each texts.find((d) => d.key == selectedSource).faq as faq, index}
					<details class="my-2">
						<summary class="text-gray-800 dark:text-gray-200 border-b">{faq.question}</summary>
						<p class="max-w-md">{@html faq.answer}</p>
					</details>
				{/each}
			</div>
		</div>

		<p class="text-gray-400 max-w-xs text-sm md:border-l border-gray-300 md:pl-4">
			{@html texts.find((d) => d.key == selectedSource).data}
			{#if texts.find((d) => d.key == selectedSource).data_readmore}
				{#if readMore}
					{@html texts.find((d) => d.key == selectedSource).data_readmore}
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
</div>
