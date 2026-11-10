<script>
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import { RadioGroup } from '$lib/components/ui';

	let selectedRegion;
	let selectedTiles;

	const gueteklassColors = {
		none: '#f0f0f0',
		G: '#d73027',
		F: '#fc8d59',
		E: '#fee08b',
		D: '#d9ef8b',
		C: '#91cf60',
		B: '#1a9850',
		A: '#006837'
	};

	// Haltestellenkategorie I–VIII nach ÖROK Heft 10, Tab. 1: I ist das dichteste
	// Angebot am höchstrangigen Verkehrsmittel, VIII das dünnste (Bus im 120- bis
	// 210-Minuten-Takt). Eigene Blau-Rampe, weil Blau in der Rot-Gelb-Grün-Skala
	// der Flächen nicht vorkommt — die Punkte sind eine andere Größe als die
	// Güteklassen und sollen nicht mit ihnen verwechselt werden. Der Radius bildet
	// die Rangfolge zusätzlich ab, damit sie nicht allein an der Farbe hängt.
	const stopCategories = [
		{ category: 'I', color: '#08306B', radius: 7.5 },
		{ category: 'II', color: '#08519C', radius: 7 },
		{ category: 'III', color: '#2171B5', radius: 6.5 },
		{ category: 'IV', color: '#4292C6', radius: 6 },
		{ category: 'V', color: '#6BAED6', radius: 5.5 },
		{ category: 'VI', color: '#9ECAE1', radius: 5 },
		{ category: 'VII', color: '#C6DBEF', radius: 4.5 },
		{ category: 'VIII', color: '#DEEBF7', radius: 4 },
		{ category: 'Keine Hst-Kategorie', label: 'ohne', color: '#D1D5DB', radius: 3 }
	];

	// Die ÖROK erhebt pro Jahr zwei Stichtage: einen Werktag in der Woche vor den
	// Herbstferien und einen Werktag in den Herbstferien. Beide sind Mittwoche —
	// der Unterschied ist Schulbetrieb, nicht Werktag gegen Wochenende.
	const surveys = [
		{
			value: '20251022',
			label: 'Normalwoche',
			date: '22.10.2025',
			description:
				'Werktag in der Woche vor den Herbstferien: regulärer Fahrplan inklusive Schulverkehr.'
		},
		{
			value: '20251029',
			label: 'Herbstferien',
			date: '29.10.2025',
			description:
				'Werktag in den Herbstferien: ohne Schulverkehr, vielerorts deutlich ausgedünnter Fahrplan.'
		}
	];

	let selectedDate = surveys[0].value;
	let stopsVisible = false;

	$: selectedSurvey = surveys.find((s) => s.value === selectedDate) ?? surveys[0];
</script>

<div class="min-h-[50vh] relative">
	<div
		class="absolute top-3 left-3 z-20 max-w-xs rounded-xl bg-white/95 dark:bg-gray-900/95 border border-current/10 shadow p-3 backdrop-blur"
	>
		<RadioGroup
			label="Stichtag der Erhebung"
			bind:value={selectedDate}
			options={surveys.map((s) => ({ value: s.value, label: s.label }))}
		/>
		<p class="mt-2 text-xs leading-snug text-gray-600 dark:text-gray-400">
			<span class="font-bold">{selectedSurvey.date}</span> — {selectedSurvey.description}
		</p>

		{#if stopsVisible}
			<div class="mt-3 pt-3 border-t border-current/10">
				<p class="text-sm font-medium text-gray-700 dark:text-gray-300">Haltestellenkategorie</p>
				<ul class="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1">
					{#each stopCategories as stopCategory}
						<li class="flex flex-col items-center gap-1">
							<span
								class="block rounded-full border border-gray-700 dark:border-gray-300"
								style="background-color: {stopCategory.color}; width: {stopCategory.radius *
									2}px; height: {stopCategory.radius * 2}px"
							></span>
							<span class="text-[11px] leading-none text-gray-600 dark:text-gray-400"
								>{stopCategory.label ?? stopCategory.category}</span
							>
						</li>
					{/each}
				</ul>
				<p class="mt-1.5 text-xs leading-snug text-gray-600 dark:text-gray-400">
					I = dichtestes Angebot am höchstrangigen Verkehrsmittel, VIII = dünnstes. „ohne" liegt
					unter dem Angebotsmindeststandard.
				</p>
			</div>
		{/if}
	</div>

	<Map
		bind:selectedRegion
		bind:selectedTiles
		bind:stopsVisible
		{gueteklassColors}
		{selectedDate}
		{stopCategories}
	/>
	<Inspector bind:selectedRegion bind:selectedTiles {gueteklassColors} survey={selectedSurvey} />
</div>
