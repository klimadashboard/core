<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { GEMEINDE } from './data';

	export let gemeinde: typeof GEMEINDE;

	const animPotential = new Tween(0, { duration: 1400, easing: cubicOut });
	const animDaecher = new Tween(0, { duration: 1400, easing: cubicOut });
	const animDachPV = new Tween(0, { duration: 1400, easing: cubicOut });

	$: animPotential.target = gemeinde.potential;
	$: animDaecher.target = gemeinde.daecher;
	$: animDachPV.target = gemeinde.dachPV;
</script>

<div class="mb-3.5 grid grid-cols-1 gap-3 md:grid-cols-3">
	<!-- Genutztes Solarpotential -->
	<div
		class="flex flex-col rounded-2xl border p-5"
		style="background: #0C2A1A; border-color: #1A4D30;"
	>
		<div class="mb-4 flex items-center justify-between">
			<span class="text-sm font-semibold" style="color: #34D399;">Genutztes Solarpotential</span>
			<span class="text-base opacity-60" aria-hidden="true">☀</span>
		</div>
		<div class="mb-2 flex items-baseline gap-1">
			<span class="font-bold leading-none tracking-tight" style="font-size:52px;color:#34D399;">
				{animPotential.current.toFixed(1)}
			</span>
			<span class="font-medium opacity-70" style="font-size:24px;color:#6EE7B7;">%</span>
		</div>
		<p class="mb-3 text-sm leading-relaxed opacity-70" style="color:#6EE7B7;">
			Anteil des genutzten Solardach-Potentials durch installierte PV-Anlagen
		</p>
		<div class="flex flex-1 flex-col gap-1 border-t pt-2.5" style="border-color:#1A4D30;">
			<div class="text-xs opacity-60" style="color:#34D399;">↑ Letzte 6 Monate: +{gemeinde.trend} %P</div>
			<div class="text-xs opacity-60" style="color:#34D399;">Ø Bayern: 11,8 %, Deutschland: 10,7 %</div>
		</div>
		<p class="mt-2.5 text-xs opacity-50" style="color:#6EE7B7;">
			MaStR / DLR EO Solar · Datenstand: 09.04.2026
		</p>
	</div>

	<!-- Dächer mit PV -->
	<div
		class="flex flex-col rounded-2xl border p-5"
		style="background: #0B1E2E; border-color: #163A54;"
	>
		<div class="mb-4 flex items-center justify-between">
			<span class="text-sm font-semibold" style="color:#38BDF8;">Dächer mit PV</span>
			<span class="text-base opacity-60" aria-hidden="true">🏠</span>
		</div>
		<div class="mb-2 flex items-baseline gap-1">
			<span class="font-bold leading-none tracking-tight" style="font-size:52px;color:#38BDF8;">
				{animDaecher.current.toFixed(1)}
			</span>
			<span class="font-medium opacity-70" style="font-size:24px;color:#7DD3FC;">%</span>
		</div>
		<p class="mb-3 text-sm leading-relaxed opacity-70" style="color:#7DD3FC;">
			{gemeinde.gebaeudeMitPV.toLocaleString('de-DE')} von {gemeinde.anzahlGeb.toLocaleString('de-DE')} Gebäuden
			haben eine PV-Anlage auf dem Dach
		</p>
		<div class="flex flex-1 flex-col gap-1 border-t pt-2.5" style="border-color:#163A54;">
			<div class="text-xs opacity-60" style="color:#38BDF8;">↑ Letzte 6 Monate: +{gemeinde.neuAnlagenMonat} Dächer</div>
			<div class="text-xs opacity-60" style="color:#38BDF8;">Ø Bayern: 14,2 %, Deutschland: 11,4 %</div>
		</div>
		<p class="mt-2.5 text-xs opacity-50" style="color:#7DD3FC;">
			MaStR / DLR EO Solar · Datenstand: 09.04.2026
		</p>
	</div>

	<!-- Installierte Dach-Leistung -->
	<div
		class="flex flex-col rounded-2xl border p-5"
		style="background: #1A0F2E; border-color: #2D1B4E;"
	>
		<div class="mb-4 flex items-center justify-between">
			<span class="text-sm font-semibold" style="color:#C084FC;">Installierte Dach-Leistung</span>
			<span class="text-base opacity-60" aria-hidden="true">⚡</span>
		</div>
		<div class="mb-2 flex items-baseline gap-1">
			<span class="font-bold leading-none tracking-tight" style="font-size:52px;color:#C084FC;">
				{animDachPV.current.toFixed(1)}
			</span>
			<span class="font-medium opacity-70" style="font-size:24px;color:#D8B4FE;">MWp</span>
		</div>
		<p class="mb-3 text-sm leading-relaxed opacity-70" style="color:#D8B4FE;">
			Nettonennleistung aller als Gebäudesolaranlage registrierten PV-Anlagen
		</p>
		<div class="flex flex-1 flex-col gap-1 border-t pt-2.5" style="border-color:#2D1B4E;">
			<div class="text-xs opacity-60" style="color:#C084FC;">
				↑ Letzte 6 Monate: +{(gemeinde.neuLeistungMonat / 1000).toFixed(1)} MWp
			</div>
			<div class="text-xs opacity-60" style="color:#C084FC;">
				Nicht im Ranking: Balkon-PV ({gemeinde.balkonPV} MWp) &amp; Freifläche ({gemeinde.freiPV} MWp)
			</div>
		</div>
		<p class="mt-2.5 text-xs opacity-50" style="color:#D8B4FE;">
			Marktstammdatenregister · Datenstand: 09.04.2026
		</p>
	</div>
</div>
