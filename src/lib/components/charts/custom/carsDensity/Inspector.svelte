<script>
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from './SmallLineChart.svelte';
	import { colors } from './scales';

	export let region;
	export let views;
	export let selectedPeriod;
</script>

{#if region}
	<h2 class="text-2xl max-w-lg text-balance leading-tight">
		Im Jahr {selectedPeriod} gab es {formatNumber(
			region.cars.find((d) => d.period == selectedPeriod)?.value
		)} Autos bei {formatNumber(region.population)} Einwohner:innen in
		<span class="underline underline-offset-4" style="text-decoration-color: ">{region.name}</span>.
	</h2>

	<div class="grid md:grid-cols-3 gap-3 mt-2">
		{#each views as view}
			<div style="color: {view.color}" class="dark:brightness-175">
				<div class="font-bold leading-tight">{view.description}</div>

				<div class="flex">
					<p class="text-4xl sm:text-5xl font-light tabular-nums">
						{Math.round(
							region[view.dataKey].find((d) => d.period == selectedPeriod)?.value
						)}{view.unit}
					</p>
					{#if region[view.dataKey].length > 1}
						<SmallLine {selectedPeriod} data={region[view.dataKey]} />
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<p class="text-lg mt-4">
		Autos sind vor allem im ländlichen Raum ein zentraler Bestandteil der Mobilität – nicht zuletzt,
		weil alternative Verkehrsmittel oft fehlen. Gleichzeitig sind sie mit Nachteilen verbunden: Sie
		verursachen Infrastrukturkosten, tragen zur Luftverschmutzung bei und beanspruchen viel
		öffentlichen Raum. Das wirkt sich direkt auf die Aufenthaltsqualität in Orten aus. Die Zahl der
		PKWs pro Kopf liefert daher wichtige Hinweise auf Mobilitätsgewohnheiten und die Abhängigkeit
		vom Auto.
	</p>
{/if}
