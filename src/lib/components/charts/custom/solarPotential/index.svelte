<script lang="ts">
	import { GEMEINDE, AWARDS } from './data';
	import GemeindeKPIs from './GemeindeKPIs.svelte';
	import AwardsSection from './AwardsSection.svelte';
	import RankingTable from './RankingTable.svelte';
	import SolarPotentialRanking from './SolarPotentialRanking.svelte';
</script>

<!-- ══ PAGE HEADER ══════════════════════════════════════════════ -->
<div class="mb-6 flex flex-col gap-1 border-b border-gray-200 pb-5 dark:border-gray-700">
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-2xl" aria-hidden="true">☀</span>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
			Solarpotential {GEMEINDE.name}
		</h1>
		<span class="rounded-full bg-amber-100 px-3 py-0.5 text-sm font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
			{GEMEINDE.bez}
		</span>
	</div>
	<p class="text-sm text-gray-500 dark:text-gray-400">
		{GEMEINDE.kreis} · {GEMEINDE.land} · {GEMEINDE.ew.toLocaleString('de-DE')} Einwohner · {GEMEINDE.flaeche} km²
	</p>
</div>

<!-- ══ KPI CARDS ════════════════════════════════════════════════ -->
<section aria-labelledby="kpi-heading">
	<h2 id="kpi-heading" class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
		Kennzahlen
	</h2>
	<GemeindeKPIs gemeinde={GEMEINDE} />
</section>

<!-- ══ AWARDS ═══════════════════════════════════════════════════ -->
<section aria-labelledby="awards-heading">
	<h2 id="awards-heading" class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
		Meilensteine
	</h2>
	<AwardsSection awards={AWARDS} gemeineName={GEMEINDE.name} />
</section>

<!-- ══ RANKING (Nachbarn / Land / Mittelstädte) ═════════════════ -->
<section aria-labelledby="ranking-heading">
	<h2 id="ranking-heading" class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
		Vergleich
	</h2>
	<RankingTable gemeinde={GEMEINDE} />
</section>

<!-- ══ FULL DEUTSCHLAND RANKING ═════════════════════════════════ -->
<section aria-labelledby="de-ranking-heading">
	<h2 id="de-ranking-heading" class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
		Deutschlandweites Ranking
	</h2>
	<SolarPotentialRanking />
</section>
