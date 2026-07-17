<!--
	Concise provenance for the target lines, shown under each panel that draws them. The EU
	targets are always cited; a benchmark is cited only while its toggle is on. Links point at
	the landing page's "Data & methodology" section rather than repeating external URLs here.
	This lives in the component rather than ChartData.meta.note because note renders as plain
	text (no links) and cannot react to the toggles, which are client state.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { TARGETS, SOURCES, type ReferenceTarget } from '$lib/utils/electrification';
	import { strings, refLabel, sourceLabel, formatters, toLang } from '$lib/utils/electrification.i18n';

	/** The reference targets currently visible. */
	export let refs: ReferenceTarget[] = [];

	$: lang = toLang($page.data.language?.code);
	$: t = strings(lang);
	$: f = formatters(lang);

	$: joiner = lang === 'de' ? ' und ' : ' and ';
	$: points = (pts: { year: number; value: number }[]) =>
		pts.map((p) => t.byYear(f.pct(p.value), p.year)).join(joiner);
	$: euTargets = TARGETS.map(
		(tg) => `${t.byYear(f.pct(tg.value), tg.year)}${tg.status === 'proposed' ? ` (${t.proposed})` : ''}`
	).join(joiner);
</script>

<p class="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
	<span class="font-semibold">{t.euTargets}:</span>
	{euTargets} —
	<a class="underline underline-offset-2" href={SOURCES.ec.anchor}>{sourceLabel('ec', lang)}</a>,
	<a class="underline underline-offset-2" href={SOURCES.eap.anchor}>{sourceLabel('eap', lang)}</a>.
	{#each refs as r (r.id)}
		<span>
			<span class="font-semibold">{refLabel(r.id, lang)}:</span>
			{points(r.points)} —
			<a class="underline underline-offset-2" href={SOURCES[r.sourceKey].anchor}
				>{sourceLabel(r.sourceKey, lang)}</a
			>.
		</span>
	{/each}
</p>
