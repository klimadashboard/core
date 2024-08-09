<script>
	let blocks = [
		{
			value: 61.1,
			unit: '€',
			label: 'ETS-Preis',
			description: 'Aktueller CO2-Preis im EU-Emissionshandel',
			source: 'Trading Economics, vor X Stunden'
		},
		{
			value: 101,
			unit: '%',
			label: 'Erneuerbare Stromerzeugung',
			description: 'als Anteil des Gesamtverbrauchs der letzten 24 Stunden',
			source: 'ENTSOE, vor 5 Minuten'
		},
		{
			value: 23,
			label: 'Hitzetage',
			description: 'bisher in diesem Jahr in Wien',
			source: 'Geosphere, bis gestern'
		}
	];
</script>

<div class="container">
	<h3 class="border-b mb-2 pb-2 uppercase font-bold flex items-center gap-2">
		<div class="bg-energy bg-opacity-20 w-3 h-3 rounded-full p-1">
			<div class="bg-energy w-1 h-1 rounded-full animate-ping" />
		</div>
		<span>Live</span>
	</h3>
	<ul class="flex gap-4">
		{#each blocks as block}
			<li class="bg-gray-100 p-4 flex-1">
				<div class="flex items-end">
					<p class="text-5xl font-light">{block.value}</p>
					<p class="text-3xl">{block.unit}</p>
				</div>
				<div>
					<p><b>{block.label}</b> {block.description}</p>
					<p class="opacity-70">{block.source}</p>
				</div>
			</li>
		{/each}
	</ul>
</div>
