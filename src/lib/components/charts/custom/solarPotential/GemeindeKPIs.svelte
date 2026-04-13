<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import type { GEMEINDE } from './data';

	export let gemeinde: typeof GEMEINDE;

	// Static values shown during SSR; animated only in the browser
	let potentialVal = gemeinde.potential;
	let daecherVal = gemeinde.daecher;
	let dachPVVal = gemeinde.dachPV;

	onMount(() => {
		animateTo(gemeinde.potential, (v) => (potentialVal = v));
		animateTo(gemeinde.daecher,   (v) => (daecherVal  = v));
		animateTo(gemeinde.dachPV,    (v) => (dachPVVal   = v));
	});

	function animateTo(target: number, set: (v: number) => void) {
		const duration = 1400;
		const start = performance.now();
		function tick(now: number) {
			const p = Math.min((now - start) / duration, 1);
			set(cubicOut(p) * target);
			if (p < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}
</script>

<div class="mb-3.5 grid grid-cols-1 gap-1 md:grid-cols-3">

	<!-- Genutztes Solarpotential -->
	<div class="rounded-2xl overflow-hidden">
		<div class="p-3 h-full leading-tight flex flex-col break-words hyphens-auto"
			style="background:#0C2A1A; color:#34D399;">
			<div class="flex justify-between font-bold border-b border-current pb-1">
				<h3>Genutztes Solarpotential</h3>
				<span aria-hidden="true">☀</span>
			</div>
			<div class="flex items-end gap-2 mt-1">
				<p class="text-5xl font-light font-condensed">
					{potentialVal.toFixed(1)}<span class="text-2xl font-normal"> %</span>
				</p>
			</div>
			<div class="text-balance opacity-70" style="color:#6EE7B7;">
				Anteil des genutzten Solardach-Potentials durch installierte PV-Anlagen
			</div>
			<ul class="card-list">
				<li>↑ Letzte 6 Monate: +{gemeinde.trend} %P</li>
				<li>Ø Bayern: 11,8 %, Deutschland: 10,7 %</li>
			</ul>
			<div class="text-xs leading-none mt-auto pt-2 opacity-50" style="color:#6EE7B7;">
				MaStR / DLR EO Solar · Datenstand: 09.04.2026
			</div>
		</div>
	</div>

	<!-- Dächer mit PV -->
	<div class="rounded-2xl overflow-hidden">
		<div class="p-3 h-full leading-tight flex flex-col break-words hyphens-auto"
			style="background:#0B1E2E; color:#38BDF8;">
			<div class="flex justify-between font-bold border-b border-current pb-1">
				<h3>Dächer mit PV</h3>
				<span aria-hidden="true">🏠</span>
			</div>
			<div class="flex items-end gap-2 mt-1">
				<p class="text-5xl font-light font-condensed">
					{daecherVal.toFixed(1)}<span class="text-2xl font-normal"> %</span>
				</p>
			</div>
			<div class="text-balance opacity-70" style="color:#7DD3FC;">
				{gemeinde.gebaeudeMitPV.toLocaleString('de-DE')} von {gemeinde.anzahlGeb.toLocaleString('de-DE')} Gebäuden
				haben eine PV-Anlage auf dem Dach
			</div>
			<ul class="card-list">
				<li>↑ Letzte 6 Monate: +{gemeinde.neuAnlagenMonat} Dächer</li>
				<li>Ø Bayern: 14,2 %, Deutschland: 11,4 %</li>
			</ul>
			<div class="text-xs leading-none mt-auto pt-2 opacity-50" style="color:#7DD3FC;">
				MaStR / DLR EO Solar · Datenstand: 09.04.2026
			</div>
		</div>
	</div>

	<!-- Installierte Dach-Leistung -->
	<div class="rounded-2xl overflow-hidden">
		<div class="p-3 h-full leading-tight flex flex-col break-words hyphens-auto"
			style="background:#1A0F2E; color:#C084FC;">
			<div class="flex justify-between font-bold border-b border-current pb-1">
				<h3>Installierte Dach-Leistung</h3>
				<span aria-hidden="true">⚡</span>
			</div>
			<div class="flex items-end gap-2 mt-1">
				<p class="text-5xl font-light font-condensed">
					{dachPVVal.toFixed(1)}<span class="text-2xl font-normal"> MWp</span>
				</p>
			</div>
			<div class="text-balance opacity-70" style="color:#D8B4FE;">
				Nettonennleistung aller als Gebäudesolaranlage registrierten PV-Anlagen
			</div>
			<ul class="card-list">
				<li>↑ Letzte 6 Monate: +{(gemeinde.neuLeistungMonat / 1000).toFixed(1)} MWp</li>
				<li>Nicht im Ranking: Balkon-PV ({gemeinde.balkonPV} MWp) &amp; Freifläche ({gemeinde.freiPV} MWp)</li>
			</ul>
			<div class="text-xs leading-none mt-auto pt-2 opacity-50" style="color:#D8B4FE;">
				Marktstammdatenregister · Datenstand: 09.04.2026
			</div>
		</div>
	</div>

</div>
