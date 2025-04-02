<script>
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from './SmallLineChart.svelte';
	import { colors } from './scales';

	export let region;
	export let selectedPeriod;

	let yearFullElectric = 0;

	$: {
		const data = region.carsElectricShare?.filter((d) => isFinite(d.value));
		if (data?.length >= 2) {
			const prev = data[data.length - 2];
			const last = data[data.length - 1];
			const growth = last.value - prev.value;

			if (growth > 0) {
				const remaining = 100 - last.value;
				const yearsTo100 = Math.ceil(remaining / growth);
				yearFullElectric = last.period + yearsTo100;
			} else {
				yearFullElectric = 0;
			}
		} else {
			yearFullElectric = 0;
		}
	}
</script>

{#if region}
	<h2 class="text-2xl">
		Autos in <span
			class="underline underline-offset-4"
			style="text-decoration-color: {colors.electric[1]}">{region.name}</span
		>
	</h2>
	<div class="grid grid-cols-2 gap-3 mt-2">
		<div style="color: {colors.electric[1]}">
			<div class="font-bold">Anteil der Elektromobilität</div>

			<div class="flex">
				<p class="text-5xl font-light tabular-nums">
					{formatNumber(region.carsElectricShare.find((d) => d.period == selectedPeriod)?.value)}%
				</p>
				<SmallLine {selectedPeriod} data={region.carsElectricShare} />
			</div>
			<div class="mt-1 bg-current/10 rounded-full h-2 relative overflow-hidden">
				<div
					class="h-full relative left-0"
					style="width: {region.carsElectricShare.find((d) => d.period == selectedPeriod)
						?.value}%; background: {colors.electric[1]}"
				></div>
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
			<div class="mt-1 bg-current/10 rounded-full h-2 relative overflow-hidden">
				<div
					class="h-full w-1 absolute"
					style="left: {region.carsPer1000Inhabitants.find((d) => d.period == selectedPeriod)
						?.value / 10}%; background: {colors.pop[1]}"
				></div>
			</div>
		</div>
	</div>
	{#if yearFullElectric > 0}
		<p class="mb-4 mt-2">
			Wenn der Anteil der E-Mobilität im Tempo des letzten Jahres weiter ansteigt, wird 100%
			Elektromobilität in {region.name} im Jahr {yearFullElectric} erreicht.
		</p>
	{/if}
{/if}
