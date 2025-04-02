<script>
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from './SmallLineChart.svelte';
	import { colors } from './scales';

	export let region;
	console.log(region);
	export let selectedPeriod;
</script>

{#if region}
	<h2 class="text-2xl">
		Autos in <span class="underline underline-offset-4 decoration-current/50">{region.name}</span>
	</h2>
	<div class="grid grid-cols-2 gap-4 mt-2">
		<div style="color: {colors.electric[1]}">
			<div class="font-bold">Anteil der Elektromobilität</div>

			<div class="flex">
				<p class="text-5xl font-light tabular-nums">
					{formatNumber(region.carsElectricShare.find((d) => d.period == selectedPeriod)?.value)}%
				</p>
				<SmallLine {selectedPeriod} data={region.carsElectricShare} />
			</div>
		</div>
		<div style="color: {colors.pop[1]}">
			<div class="font-bold">Autos pro 1000 Einwohner:innen</div>

			<div class="flex">
				<p class="text-5xl font-light tabular-nums">
					{formatNumber(
						region.carsPer1000Inhabitants.find((d) => d.period == selectedPeriod)?.value
					)}
				</p>
				<SmallLine {selectedPeriod} data={region.carsPer1000Inhabitants} />
			</div>
		</div>
	</div>
{/if}
