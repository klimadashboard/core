<script>
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from './SmallLineChart.svelte';
	import { colors } from './scales';

	export let selectedRegionData;
	export let region;
	export let selectedPeriod;

	$: dataAvailableForPeriod =
		selectedRegionData[0].history.find((d) => d.period == selectedPeriod)?.absolute > 0;
	$: biggestShare = selectedRegionData.find(
		(d) =>
			d.history.find((h) => h.period == selectedPeriod)?.percentage ==
			Math.max(
				...selectedRegionData.map(
					(d) => d.history.find((h) => h.period == selectedPeriod)?.percentage
				)
			)
	);
</script>

{#if region && dataAvailableForPeriod}
	<h2 class="text-2xl">
		In <span
			class="underline underline-offset-4"
			style="text-decoration-color: {colors.electric[1]}">{region.name}</span
		>
		werden die meisten Autos mit {biggestShare.label} angetrieben. Elektroautos machten im Jahr {selectedPeriod}
		nur
		{Math.round(
			selectedRegionData
				.find((d) => d.key == 'Elektro')
				?.history.find((d) => d.period == selectedPeriod)?.percentage
		)}% des PKW-Bestands aus.
	</h2>
	<div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
		{#each selectedRegionData as view}
			<div style="color: {view.color}" class="dark:brightness-175">
				<div class={view.selected ? 'font-bold' : ''}>{view.label}</div>

				<p class="text-4xl sm:text-5xl font-light">
					{Math.round(view.history.find((d) => d.period == selectedPeriod)?.percentage)}<span
						class="text-xl font-bold">%</span
					>
				</p>
				<p>{formatNumber(view.history.find((d) => d.period == selectedPeriod)?.absolute)} PKWs</p>

				<SmallLine {selectedPeriod} data={view.history} />
			</div>
		{/each}
	</div>
	<p class="mt-4 text-lg">
		Autos mit Diesel- oder Benzinantrieb verursachen durch das Verbrennen im Motor direkte
		Emissionen. Die Visualisierung zeigt den Bestand, also die aktuell zugelassenen PKWs in der
		jeweiligen Region. Der Bestand beinhaltet Firmenwägen wie auch privat genutzte PKWs und wird zum
		Wohnort bzw. Firmensitz zugeteilt. Auch wenn der Anteil der neuzugelassenen Elektroautos steigt,
		ist die Gesamtflotte immer noch größtenteils fossil. Die Wende hin zu Elektroautos ist für die
		Reduktion von Emissionen im Verkehrsbereich essentiell.
	</p>
{:else}
	<p>
		Für diese Region sind aufgrund von Gemeindezusammenlegungen in diesem Zeitraum keine Daten
		verfügbar.
	</p>
{/if}
