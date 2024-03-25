<script>
	import dayjs from 'dayjs';
	import 'dayjs/locale/de-at';
	import RelativeTime from 'dayjs/plugin/relativeTime';

	dayjs.extend(RelativeTime);
	dayjs.locale('de-at');

	const items = [
		{
			date: dayjs('2024-03-25T11:00:00'),
			title: 'Faires 1,5°C-CO₂-Budget für Deutschland überschritten',
			text: 'Neue Daten des Sachverständigenrats für Umweltfragen, visualisiert vom Klimadashboard',
			url: '/emissionen/co2-budget'
		},
		{
			date: dayjs('2024-03-23'),
			title: 'Außergewöhnlich heißer Jahresstart',
			text: 'Über 200 Wetterstationen zeigen Erhitzung in Deutschland in regionaler Ausprägung',
			url: '/auswirkungen/temperatur'
		},
		{
			date: dayjs('2024-03-15'),
			title: 'Emissionen 2023 um 10,1% gesunken',
			text: 'Größter Rückgang seit 1990 in produktionsbasierten Emissionen: neueste Daten des UBA',
			url: '/emissionen'
		},
		{
			date: dayjs('2024-02-01'),
			title: 'Nur 2 von 27 EU-Ländern auf Klimaneutralitätskurs',
			text: 'EU Emission Tracker zeigt Klimaprojektionen und Detailemissionen aller EU-Mitgliedsstaaten',
			url: 'https://emission-tracker.eu'
		},
		{
			date: dayjs('2023-12-31'),
			title: 'Der Großteil der Bevölkerung in Deutschland ist für mehr Klimaschutz.',
			text: 'Die Gesellschaftsseite zeigt: es gibt eine ökologische Mehrheit',
			url: '/gesellschaft'
		}
	];

	$: firstItem = items[0];
</script>

<div class="container mb-4">
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 grid-flow-row news-grid">
		<a class="row-span-2 flex flex-col" href={firstItem.url}>
			<h3 class="text-4xl leading-9">{firstItem.title}</h3>
			<p class="mt-auto leading-tight text-xl">
				{firstItem.text} <span class="opacity-70">{dayjs().to(firstItem.date)}</span>
			</p>
		</a>
		{#each items.splice(1) as item}
			<a href={item.url} class="border-t pt-4">
				<h3 class="text-xl leading-6">{item.title}</h3>
				<p class="mt-1 leading-tight">
					{item.text} <span class="opacity-70">{dayjs().to(item.date)}</span>
				</p>
			</a>
		{/each}
	</div>
	<div class="grid gap-4 lg:grid-cols-3 pt-4 border-t mt-16 leading-tight">
		<h1 class="text-3xl leading-none">
			Die Daten und Fakten zur <br />Klimakrise in Deutschland
		</h1>
		<p>
			Datensätze und Grafiken zu Herausforderungen, Auswirkungen und Lösungen der Klimakrise. Nach
			wissenschaftlichen Standards, frei zugänglich für alle.
		</p>
		<p>
			Daten u.a. vom Umweltbundesamt, Sachverständigenrat für Umweltfragen, Deutscher Wetterdienst.
			Bekannt aus Stern, ORF, STANDARD. <a
				href="https://klimadashboard.org"
				class="underline underline-offset-4">Mehr erfahren</a
			>
		</p>
	</div>
</div>

<style>
	.news-grid h3 {
		@apply font-bold;
	}
</style>
