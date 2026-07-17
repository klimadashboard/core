<!--
	Concise provenance for the target lines, shown under each panel that draws them. The EU
	targets are always cited; a benchmark is cited only while its toggle is on. Links point at
	the landing page's "Data & methodology" section rather than repeating external URLs here.
	This lives in the component rather than ChartData.meta.note because note renders as plain
	text (no links) and cannot react to the toggles, which are client state.
-->
<script lang="ts">
	import { TARGETS, SOURCES, type ReferenceTarget } from '$lib/utils/electrification';

	/** The reference targets currently visible. */
	export let refs: ReferenceTarget[] = [];

	function points(pts: { year: number; value: number }[]): string {
		return pts.map((p) => `${p.value}% by ${p.year}`).join(' and ');
	}

	$: euTargets = TARGETS.map(
		(t) => `${t.value}% by ${t.year}${t.status === 'proposed' ? ' (proposed)' : ''}`
	).join(' and ');
</script>

<p class="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
	<span class="font-semibold">EU targets:</span>
	{euTargets} —
	<a class="underline underline-offset-2" href={SOURCES.ec.anchor}>{SOURCES.ec.label}</a>,
	<a class="underline underline-offset-2" href={SOURCES.eap.anchor}>{SOURCES.eap.label}</a>.
	{#each refs as r (r.id)}
		<span>
			<span class="font-semibold">{r.label}:</span>
			{points(r.points)} —
			<a class="underline underline-offset-2" href={SOURCES[r.sourceKey].anchor}
				>{SOURCES[r.sourceKey].label}</a
			>.
		</span>
	{/each}
</p>
