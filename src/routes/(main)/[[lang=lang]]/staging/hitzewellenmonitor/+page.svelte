<script lang="ts">
	import HeatwavesKysely from '$lib/components/charts/custom/heatwavesKysely/index.svelte';

	// Internal to-do list for this page (staging only)
	const todos: { group: string; items: { text: string; note?: string }[] }[] = [
		{
			group: 'Daten & Qualität',
			items: [
				{
					text: 'Klären, ob es realistisch ist, dass es in den 1850er/1860er-Jahren schon so viele Hitzetage und Hitzewellen gab (Wien Hohe Warte).',
					note: 'Auswertung: 1860er 14,4 Kysely-Tage/Jahr, 1900er 0,0, 1960er 6,1, 2010er 26,7. Vermutung: früher Messfehler (ungeschützte Thermometer, „early instrumental warm bias“) und/oder Standortwechsel – Hohe Warte vermutlich erst ab 1872. Bei GeoSphere nachfragen bzw. Stationsgeschichte prüfen; danach entscheiden: frühe Jahre ausblenden, blass darstellen oder mit Hinweis.'
				},
				{
					text: 'Festlegen, ab welchem Jahr gewertet wird (z. B. ab 1900) – wichtig für Rangliste „über alle Messjahre“.'
				},
				{
					text: 'Prüfen, ob homogenisierte Daten (z. B. HISTALP) verfügbar und sinnvoll sind.'
				},
				{ text: 'Deutsche Version mit DWD-Daten testen (PUBLIC_VERSION=de).' },
				{
					text: 'Stationsfilter „Hitzewelle gestern / letzte 7 Tage“ im Sommer mit echten Treffern testen.'
				}
			]
		},
		{
			group: 'Rangliste (Top 10 Stationen)',
			items: [
				{ text: 'Tabelle 1: längste Hitzewelle am Stück.' },
				{ text: 'Tabelle 2: meiste Kysely-Tage in einem Jahr – über alle Messjahre und für ein gewähltes Jahr.' },
				{
					text: 'Vorberechnung für alle Stationen (5,2 Mio. Tageswerte, 181 Stationen AT) per Skript, Ergebnis als Tabelle in Directus; täglich aktualisieren.'
				}
			]
		},
		{
			group: 'Texte (für jede Grafik)',
			items: [
				{ text: 'Headline reviewen' },
				{ text: 'Eyebrow reviewen' },
				{ text: 'Infotext schreiben (Platzhalter im Diagramm: „Text follows later“)' },
				{ text: 'Quelle reviewen (GeoSphere Austria / DWD, Datenstand)' },
				{ text: 'Methoden aufschreiben: wie analysiert wurde (Definition, Rechnung in Zehntelgrad, Datenlücken, Mittel 1991–2020 ±15 Tage, frühe Messjahre)' }
			]
		},
		{
			group: 'Seite',
			items: [
				{ text: 'Erklärung, wie Hitzewelle hier definiert ist – evtl. Schaubild (Zahlenbeispiel Tag für Tag).' },
				{ text: 'Link zur Hitzetote-Seite (AT) eintragen – derzeit Platzhalter (HEAT_DEATHS_URL in config.ts).' },
				{ text: 'Entscheiden: Monitor als eine Grafik oder zusätzlich einzelne einbettbare Grafiken.' },
				{ text: 'Seite und Diagramm-Eintrag in Directus anlegen.' }
			]
		},
		{
			group: 'Technik',
			items: [
				{ text: 'Dark Mode prüfen.' },
				{ text: 'Ungeklärte Konsolenfehler „400“ untersuchen.' },
				{
					text: 'MapLibre-Stylesheet besser direkt in WeatherStationMap.svelte importieren (derzeit in der Hitzewellen-Komponente).'
				},
				{ text: 'Vor dem Mergen: Staging-Route (src/routes/(main)/[[lang=lang]]/staging) löschen.' }
			]
		}
	];
</script>

<svelte:head>
	<title>Hitzewellenmonitor (Staging)</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="container max-w-5xl mx-auto px-4 py-8">
	<p
		class="inline-block mb-4 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100"
	>
		Staging · nur lokal sichtbar · nicht öffentlich
	</p>

	<h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Hitzewellenmonitor</h1>

	<div class="rounded-2xl bg-white dark:bg-gray-900 p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
		<HeatwavesKysely />
	</div>

	<section
		class="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-6 text-gray-900 dark:border-amber-800 dark:bg-gray-900 dark:text-gray-100"
	>
		<h2 class="text-xl font-bold mb-1">To-do (intern)</h2>
		<p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
			Nur auf der Staging-Seite sichtbar. Liste in
			<code class="text-xs">staging/hitzewellenmonitor/+page.svelte</code> pflegen.
		</p>
		{#each todos as block}
			<h3 class="font-semibold mt-4 mb-1">{block.group}</h3>
			<ul class="space-y-1.5">
				{#each block.items as item}
					<li class="flex gap-2">
						<span aria-hidden="true" class="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400">☐</span>
						<span>
							{item.text}
							{#if item.note}
								<span class="block text-sm text-gray-600 dark:text-gray-400">{item.note}</span>
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		{/each}
	</section>
</div>
