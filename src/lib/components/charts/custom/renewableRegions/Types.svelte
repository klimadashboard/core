<script>
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let colors;
	export let region;

	let types = [
		{
			label: 'PV-Freiflächenanlagen',
			image: '7c1e1b42-2734-442d-bcab-b904e3ebc974',
			type: '852'
		},
		{
			label: 'PV-Dachanlagen',
			image: '1dd45bda-e254-41e9-9bbb-5018ba925be0',
			type: '853'
		},
		{
			label: 'Balkonkraftwerke',
			image: '1e6120a1-538c-4d68-8506-8d711558adbf',
			type: '2961'
		}
	];

	// Calculate totals for percentages
	$: totalUnits = Object.values(data || {}).reduce((sum, d) => sum + (d.units || 0), 0);
	$: totalPower = Object.values(data || {}).reduce((sum, d) => sum + (d.power_kw || 0), 0);

	// Map selected types with enriched stats
	$: enrichedTypes = types.map((t) => {
		const entry = data?.[t.type];
		return {
			...t,
			units: entry?.units || 0,
			power_kw: entry?.power_kw || 0,
			unit_pct: totalUnits ? Math.round(((entry?.units || 0) / totalUnits) * 100) : 0,
			power_pct: totalPower ? Math.round(((entry?.power_kw || 0) / totalPower) * 100) : 0
		};
	});

	// Derive 'other' types
	$: knownTypes = new Set(types.map((t) => t.type));
	$: other = Object.entries(data || {})
		.filter(([type]) => !knownTypes.has(type))
		.reduce(
			(acc, [_, val]) => {
				acc.units += val.units || 0;
				acc.power_kw += val.power_kw || 0;
				return acc;
			},
			{ units: 0, power_kw: 0 }
		);

	$: other.unit_pct = totalUnits ? Math.round((other.units / totalUnits) * 100) : 0;
	$: other.power_pct = totalPower ? Math.round((other.power_kw / totalPower) * 100) : 0;
</script>

<div class="grid md:grid-cols-3 gap-1 mt-1 leading-none" style="color: {colors[1]}">
	{#each enrichedTypes as type}
		<div class="border rounded-2xl overflow-hidden">
			<div class="text-white px-3 py-2 text-xl font-bold" style="background: {colors[1]}">
				<h3>{type.label}</h3>
			</div>
			<img
				src="https://base.klimadashboard.org/assets/{type.image}?key=medium"
				alt=""
				class="w-full h-36 object-cover"
			/>
			<div class="border-b border-current px-3 py-2">
				<p class="text-4xl font-light">
					{formatNumber(type.units)}
					<span class="text-lg font-normal -translate-x-1 inline-block">Anlagen</span>
				</p>
				<p>{type.unit_pct}% aller Einheiten</p>
			</div>
			<div class="px-3 py-2">
				<p class="text-4xl font-light">
					{formatNumber(type.power_kw)}
					<span class="text-lg font-normal -translate-x-1 inline-block">kW</span>
				</p>
				<p>{type.power_pct}% der Gesamtleistung</p>
			</div>
		</div>
	{/each}
</div>

<div class="mt-4">
	<p>
		Neben den Freiflächenanlagen, Dachanlagen und Balkonkraftwerken, gibt es noch weitere Arten von
		PV-Anlagen. Diese sind den Kategorien "Bauliche Anlage (Sonstige)", "Gewässer" und
		"Großparkplatz" zuzuordnen. In {region.name} gibt es {formatNumber(other.units)} Anlagen, die dieser
		Kategorie zuzuordnen sind. Diese haben eine Leistung von {formatNumber(other.power_kw)} kW, was einen
		Anteil an der Gesamtleistung von {formatNumber(other.power_pct)} Prozent ausmacht.
	</p>
</div>
