<script>
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from './SmallLineChart.svelte';

	export let region;
	export let regions;
	export let views;
	export let selectedPeriod;
	export let selectedView;
</script>

{#if region && region.cars.find((d) => d.period == selectedPeriod)?.value}
	<h2 class="text-2xl text-balance leading-tight">
		In <span class="underline underline-offset-4" style="text-decoration-color: "
			>{region.name}</span
		>
		kommen {formatNumber(region.cars.find((d) => d.period == selectedPeriod)?.value)} Autos auf {formatNumber(
			region.population
		)} Einwohner:innen.
	</h2>

	<div class="grid md:grid-cols-3 gap-3 mt-4">
		{#each views as view}
			<div style="color: {view.color}" class="dark:brightness-175">
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
				<div class="font-bold leading-tight">{@html view.description}</div>
			</div>
		{/each}
	</div>
{:else}
	<p class="text-lg leading-snug">
		Wähle eine Region auf der Karte, um mehr zur PKW-Dichte zu erfahren. Für manche Regionen sind
		aufgrund von Gemeindezusammenlegungen keine Daten verfügbar.
	</p>
{/if}
