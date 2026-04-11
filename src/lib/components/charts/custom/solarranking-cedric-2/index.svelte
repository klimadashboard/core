<script lang="ts">
	import { GEMEINDE, AWARDS, BADGES } from './data';
	import GemeindeKPIs from './GemeindeKPIs.svelte';
	import RankingTable from './RankingTable.svelte';
	import AwardsSection from './AwardsSection.svelte';
	import BadgesSection from './BadgesSection.svelte';

	// Standard chart props (CLAUDE.md)
	export let region: unknown = null;
	export let onChartData: ((data: unknown) => void) | undefined = undefined;

	// Notify parent that this chart renders static/mock data
	onChartData?.({
		raw: [],
		meta: { source: 'MaStR / DLR EO Solar', updateDate: '09.04.2026' }
	});

	const g = GEMEINDE;
</script>

<div class="space-y-0">
	<!-- Gemeinde header -->
	<div class="mb-5 flex flex-wrap items-start justify-between gap-4">
		<!-- Left: name + meta -->
		<div>
			<h2 class="mb-1.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
				{g.name}
			</h2>
			<div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
				<span class="flex items-center gap-1">
					<svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
					{g.bez}
				</span>
				<span class="flex items-center gap-1">
					<svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
					{g.ew.toLocaleString('de-DE')} EW
				</span>
				<span class="flex items-center gap-1">
					<svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
					{g.flaeche} km²
				</span>
				<span class="text-gray-400">{g.kreis}, {g.land}</span>
			</div>
		</div>

		<!-- Right: rank badges -->
		<div class="flex flex-wrap gap-2">
			{#each [
				{ label: 'Nachbarn',       rank: g.rankNachbarn, gesamt: g.rankNachbarnGesamt, color: 'text-blue-600',   bg: 'bg-blue-50   border-blue-200   dark:bg-blue-950   dark:border-blue-800'   },
				{ label: g.land,           rank: g.rankLand,     gesamt: g.rankLandGesamt,     color: 'text-cyan-600',   bg: 'bg-cyan-50   border-cyan-200   dark:bg-cyan-950   dark:border-cyan-800'   },
				{ label: 'Mittelstädte BY', rank: g.rankMittelBY, gesamt: g.rankMittelBYGesamt, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800' }
			] as b (b.label)}
				<div class="rounded-xl border px-4 py-2.5 text-center {b.bg}">
					<div class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{b.label}</div>
					<div class="font-mono text-2xl font-bold {b.color}">#{b.rank.toLocaleString('de-DE')}</div>
					<div class="text-xs font-semibold text-gray-400">von {b.gesamt.toLocaleString('de-DE')}</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Info box -->
	<div class="mb-3.5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/40">
		<span class="mt-0.5 text-lg leading-none" aria-hidden="true">ℹ️</span>
		<div>
			<p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
				Dieses Ranking basiert ausschließlich auf der Solarleistung von Hausdächern.
			</p>
			<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
				Solaranlagen auf Freiflächen oder Balkonen werden nicht berücksichtigt, um einen fairen Vergleich zwischen Städten und Gemeinden zu ermöglichen.
			</p>
		</div>
	</div>

	<!-- KPI cards -->
	<GemeindeKPIs gemeinde={g} />

	<!-- Ranking table -->
	<RankingTable gemeinde={g} />

	<!-- Awards -->
	<AwardsSection awards={AWARDS} />

	<!-- Badges -->
	<BadgesSection badges={BADGES} />
</div>
