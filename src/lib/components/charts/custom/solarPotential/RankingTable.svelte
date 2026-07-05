<script lang="ts">
	import type { SolarRankEntry, SolarNeighbourEntry, RegionCase } from './types';
	import Switch from '$lib/components/Switch.svelte';
	import { Toggle } from '$lib/components/ui';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { PUBLIC_VERSION } from '$env/static/public';
	import {
		IconBuildingCommunity,
		IconSearch,
		IconChevronLeft,
		IconChevronRight,
		IconSortAscending,
		IconSortDescending,
		IconArrowsSort,
		IconTrendingUp,
		IconTrendingDown
	} from '@tabler/icons-svelte-runes';

	export let allDEweit: SolarRankEntry[] = [];
	export let byLand: SolarRankEntry[] = [];
	export let neighbours: SolarNeighbourEntry[] = [];
	export let regionId: string = '';
	export let regionName: string = '';
	export let stateName: string = 'Bundesland';
	export let regionCase: RegionCase = 'mittelstadt';
	export let isStadtstaat: boolean = false;
	export let population: number | undefined = undefined;
	export let rankDE: number = 0;
	export let rankDEGesamt: number = 0;
	export let rankLand: number = 0;
	export let rankLandGesamt: number = 0;
	export let rankAll: number = 0;
	export let peerRankById: Map<string, number> = new Map();
	export let loading: boolean = false;
	export let clickable: boolean = false;

	type Tab = 'de' | 'land' | 'nachbar';
	type SortCol = 'potential' | 'trend' | 'daecher' | 'mwp' | null;

	$: showDETab = true;
	$: showLandTab = regionCase !== 'bundesland' && !isStadtstaat;
	$: showNachbarTab = neighbours.length > 0 && regionCase !== 'bundesland' && regionCase !== 'grossstadt' && regionCase !== 'mittelstadt' && regionCase !== 'kleinstadt' && regionCase !== 'kreis' && !isStadtstaat;

	$: deTabLabel =
		regionCase === 'grossstadt'  ? 'Großstädte' :
		regionCase === 'mittelstadt' ? 'Mittelstädte' :
		regionCase === 'kreis'       ? 'Kreise in Deutschland' :
		regionCase === 'bundesland'  ? 'Bundesländer' :
		'Dörfer und Kleinstädte';

	$: deTabDescription =
		regionCase === 'grossstadt'
			? 'Städte in Deutschland mit 100.000 oder mehr Einwohnern, sortiert nach genutztem Solarpotential.'
			: regionCase === 'mittelstadt'
				? 'Städte und Gemeinden in Deutschland mit 20.000–99.999 Einwohnern, sortiert nach genutztem Solarpotential.'
				: regionCase === 'kreis'
					? 'Alle Landkreise und kreisfreien Städte in Deutschland, sortiert nach genutztem Solarpotential.'
					: regionCase === 'bundesland'
						? 'Alle Bundesländer in Deutschland, sortiert nach genutztem Solarpotential.'
						: 'Alle Gemeinden und Dörfer in Deutschland mit weniger als 20.000 Einwohnern, sortiert nach genutztem Solarpotential.';

	$: neighbourDescription =
		regionCase === 'kleinstadt'
			? 'Die nächstgelegenen Gemeinden nach Luftlinie.'
			: regionCase === 'grossstadt'
				? 'Die nächstgelegenen Großstädte (≥100.000 EW) nach Luftlinie, sortiert nach Rang.'
				: regionCase === 'kreis'
					? 'Die nächstgelegenen Landkreise und kreisfreien Städte nach Luftlinie.'
					: 'Die nächstgelegenen Gemeinden nach Luftlinie.';

	function getDefaultTab(): Tab {
		if (regionCase === 'bundesland') return 'de';
		if (regionCase === 'grossstadt') return 'de';
		return 'land'; // mittelstadt, kleinstadt, kreis
	}

	let activeTab: Tab = getDefaultTab();
	let sortCol: SortCol = null;
	let sortDir: 'asc' | 'desc' = 'desc';

	const PER_PAGE = 10;

	let searchMittel = '';
	let pageMittel = 1;
	let pageMittelUserSet = false;
	let searchLand = '';
	let pageLand = 1;
	let pageLandUserSet = false;

	$: rankDEFiltered = (mittelBaseFiltered?.findIndex((r) => r.region.id === regionId) ?? -1) + 1 || 0;
	$: if (rankDEFiltered > 0 && !pageMittelUserSet) pageMittel = Math.ceil(rankDEFiltered / PER_PAGE);
	$: if (rankDE > 0 && !rankDEFiltered && !pageMittelUserSet) pageMittel = Math.ceil(rankDE / PER_PAGE);
	$: if (rankLand > 0 && !pageLandUserSet) pageLand = Math.ceil(rankLand / PER_PAGE);
	const MEDALS = ['🥇', '🥈', '🥉'];

	$: landTabLabel = regionCase === 'kreis' ? `Kreise in ${stateName}` : stateName;

	$: nachbarLabel =
		regionCase === 'kreis' ? 'Nachbarkreise' :
		regionCase === 'kleinstadt' ? 'Nachbargemeinden' :
		regionCase === 'grossstadt' ? 'Nachbarstädte' :
		'Nachbargemeinden';

	$: tabViews = (() => {
		const deEntry = showDETab
			? [{
					key: 'de',
					label: rankDE > 0
						? `${deTabLabel}: #${rankDE} / ${rankDEGesamt.toLocaleString('de-DE')}`
						: deTabLabel,
					iconComponent: IconBuildingCommunity,
					iconSize: 16
				}]
			: [];
		const landEntry = showLandTab
			? [{
					key: 'land',
					label: rankLand > 0
						? `${landTabLabel}: #${rankLand} / ${rankLandGesamt.toLocaleString('de-DE')}`
						: landTabLabel
				}]
			: [];
		const nachbarEntry = showNachbarTab ? [{ key: 'nachbar', label: nachbarLabel }] : [];
		if (regionCase === 'mittelstadt' || regionCase === 'kleinstadt' || regionCase === 'kreis') return [...landEntry, ...deEntry];
		return [...deEntry, ...landEntry, ...nachbarEntry];
	})();

	type ExtEntry = SolarRankEntry & { origRank: number; trend: number; distKm?: number };

	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'desc' ? 'asc' : 'desc';
		else {
			sortCol = col;
			sortDir = 'desc';
		}
	}

	function sortEntries(entries: ExtEntry[], col: SortCol, dir: 'asc' | 'desc'): ExtEntry[] {
		if (!col) return entries;
		return [...entries].sort((a, b) => {
			const va = col === 'trend' ? (a.trend ?? -Infinity) : (a[col] as number);
			const vb = col === 'trend' ? (b.trend ?? -Infinity) : (b[col] as number);
			return dir === 'desc' ? vb - va : va - vb;
		});
	}

	function formatEW(ew: number | undefined): string {
		if (!ew) return '';
		if (ew >= 1_000_000) return `${(ew / 1_000_000).toFixed(1)} Mio. EW`;
		if (ew >= 100_000) return `${(ew / 1000).toFixed(0)}k EW`;
		return `${ew.toLocaleString('fr-FR')} EW`;
	}

	// ── Nachbar-Toggle (Mittelstadt, Kleinstadt, Kreis — im Land-Tab) ───────
	$: showNachbarToggle = (regionCase === 'mittelstadt' || regionCase === 'kleinstadt' || regionCase === 'kreis') && neighbours.length > 0;
	let showNachbarInLand = true;
	$: if (showNachbarInLand !== undefined) { searchLand = ''; }

	// ── ≥500k-Toggle (nur für Großstädte) ────────────────────────
	$: showBigFilter = regionCase === 'grossstadt' && ((population ?? 0) >= 500_000 || isStadtstaat);
	let showOnlyBig = (population ?? 0) >= 500_000 || isStadtstaat;
	$: if (!showBigFilter) showOnlyBig = false;
	$: if (showOnlyBig !== undefined) { pageMittelUserSet = false; }

	// ── Tab 1: DE-weit ───────────────────────────────────────────
	$: mittelQuery = searchMittel.toLowerCase().trim();
	$: isSearchingMittel = mittelQuery.length >= 2;
	$: if (searchMittel) { pageMittel = 1; pageMittelUserSet = false; }

	$: mittelWithRank = allDEweit.map(
		(r, i): ExtEntry => ({ ...r, origRank: i + 1, trend: r.trend ?? 0 })
	);
	$: mittelBaseFiltered = showOnlyBig
		? mittelWithRank.filter((r) => (r.region.population ?? 0) >= 500_000)
		: mittelWithRank;
	$: mittelFiltered = isSearchingMittel
		? mittelBaseFiltered.filter((r) => r.region.name.toLowerCase().includes(mittelQuery))
		: mittelBaseFiltered;
	$: mittelSorted = sortEntries(mittelFiltered, sortCol, sortDir);
	$: mittelPage = mittelSorted.slice((pageMittel - 1) * PER_PAGE, pageMittel * PER_PAGE);
	$: mittelTotalPages = Math.ceil(mittelFiltered.length / PER_PAGE);

	// ── Tab 2: Bundesland ─────────────────────────────────────────
	$: landQuery = searchLand.toLowerCase().trim();
	$: isSearchingLand = landQuery.length >= 2;
	$: if (searchLand) { pageLand = 1; pageLandUserSet = false; }

	$: landWithRank = byLand.map(
		(r, i): ExtEntry => ({ ...r, origRank: i + 1, trend: r.trend ?? 0 })
	);
	$: landFiltered = isSearchingLand
		? landWithRank.filter((r) => r.region.name.toLowerCase().includes(landQuery))
		: landWithRank;
	$: landSorted = sortEntries(landFiltered, sortCol, sortDir);
	$: landPage = landSorted.slice((pageLand - 1) * PER_PAGE, pageLand * PER_PAGE);
	$: landTotalPages = Math.ceil(landFiltered.length / PER_PAGE);

	// ── Global search fallback ───────────────────────────────────
	let globalSuggestions: Array<{ id: string; title: string; subtitle: string; source: string }> = [];
	let globalLoading = false;
	let globalDebounce: ReturnType<typeof setTimeout>;

	$: {
		const q = activeTab === 'de' ? mittelQuery : activeTab === 'land' ? landQuery : '';
		const filtered = activeTab === 'de' ? mittelFiltered : activeTab === 'land' ? landFiltered : [];
		if (q.length >= 2 && filtered.length === 0) {
			scheduleGlobalSearch(q);
		} else {
			clearTimeout(globalDebounce);
			globalSuggestions = [];
			globalLoading = false;
		}
	}

	async function scheduleGlobalSearch(query: string) {
		clearTimeout(globalDebounce);
		globalDebounce = setTimeout(async () => {
			globalLoading = true;
			try {
				const lang = $page.data.language?.code ?? 'de';
				const res = await fetch(
					`https://base.klimadashboard.org/get-search-results?q=${encodeURIComponent(query)}&lang=${lang}&site=${PUBLIC_VERSION}&country=${PUBLIC_VERSION.toUpperCase()}`
				);
				const results: Array<{ id: string; title: string; subtitle: string; source: string }> =
					await res.json();
				globalSuggestions = results.filter((r) =>
					['municipality', 'district', 'region'].includes(r.source)
				);
			} catch {
				globalSuggestions = [];
			} finally {
				globalLoading = false;
			}
		}, 200);
	}

	// ── Tab 3: Nachbargemeinden ───────────────────────────────────
	$: landRankById = new Map(landWithRank.map((r) => [r.region.id, r.origRank]));
	$: landRcById = new Map(landWithRank.map((r) => [r.region.id, r.rc]));
	$: neighboursWithRank = neighbours
		.map((n): ExtEntry => {
			const isSelf = n.region.id === regionId;
			const useLandRank = regionCase === 'mittelstadt' || regionCase === 'kleinstadt' || regionCase === 'kreis';
			const origRank = isSelf
				? (useLandRank ? rankLand : rankDE) || rankAll
				: useLandRank
					? landRankById.get(n.region.id) ?? 0
					: peerRankById.get(n.region.id) ?? 0;
			const rc = useLandRank
				? (landRcById.get(n.region.id) ?? null)
				: n.rc;
			return { ...n, origRank, rc, trend: n.trend ?? 0, distKm: n.distKm };
		})
		.sort((a, b) => {
			if (regionCase === 'mittelstadt' || regionCase === 'kleinstadt' || regionCase === 'kreis') return b.potential - a.potential;
			if (a.origRank > 0 && b.origRank > 0) return a.origRank - b.origRank;
			return (a.distKm ?? 0) - (b.distKm ?? 0);
		});
	$: neighboursSorted = sortEntries(neighboursWithRank, sortCol, sortDir);
</script>

<!-- ════════════════ REUSABLE SNIPPETS ════════════════ -->

{#snippet colHeader(key: SortCol, label: string)}
	{@const active = sortCol === key}
	{@const sortable = key !== null}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		role="columnheader"
		tabindex={sortable ? 0 : undefined}
		aria-sort={active ? (sortDir === 'desc' ? 'descending' : 'ascending') : undefined}
		class="px-3 py-3 text-xs font-semibold text-gray-700 leading-tight
			{sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}"
		on:click={() => sortable && toggleSort(key)}
		on:keydown={(e) => e.key === 'Enter' && sortable && toggleSort(key)}
	>
		<div class="flex items-start gap-1">
			<span class="whitespace-nowrap">{label}</span>
			{#if sortable}
				{#if active}
					{#if sortDir === 'desc'}
						<IconSortDescending class="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
					{:else}
						<IconSortAscending class="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
					{/if}
				{:else}
					<IconArrowsSort class="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
				{/if}
			{/if}
		</div>
	</div>
{/snippet}

{#snippet tableHeader()}
	<div
		role="row"
		class="mb-1 grid grid-cols-[60px_minmax(130px,1fr)_200px_230px_215px_210px] gap-x-3 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
	>
		{@render colHeader(null, 'Rang')}
		{@render colHeader(null, 'Gemeinde')}
		{@render colHeader('potential', 'Genutztes Potential (%)')}
		{@render colHeader('trend', 'Veränderung letzter Monat (%P)')}
		{@render colHeader('daecher', 'Dächer mit Photovoltaik (%)')}
		{@render colHeader('mwp', 'Installierte Leistung (MWp)')}
	</div>
{/snippet}

{#snippet rankRow(row: ExtEntry, isSelf: boolean)}
	{@const isClickable = clickable && !isSelf}
	<div
		role="row"
		aria-label="{row.region.name}, Rang {row.origRank}"
		class="grid grid-cols-[60px_minmax(130px,1fr)_200px_230px_215px_210px] gap-x-3 items-start px-1 py-3
			{isSelf
			? 'rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
			: 'border-b border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'}"
	>
		<div role="cell" class="flex flex-col items-start gap-0.5 pt-0.5">
			{#if row.origRank > 0}
				<div class="flex items-center gap-0.5">
					{#if row.origRank <= 3}<span aria-hidden="true" class="text-base leading-none"
							>{MEDALS[row.origRank - 1]}</span
						>{/if}
					<span
						class="text-lg font-bold leading-none {row.origRank <= 3
							? 'text-amber-500'
							: 'text-[#19191c] dark:text-gray-400'}">{row.origRank}</span
					>
				</div>
				{#if row.rc != null && row.rc !== 0}
					<span
						class="text-xs pt-0.5 font-bold leading-none {row.rc > 0 ? 'text-green-500' : 'text-red-500'}"
					>
						{row.rc > 0 ? '▲' : '▼'}{' '}{Math.abs(row.rc)}
					</span>
				{/if}
			{/if}
		</div>
		<div role="cell">
			{#if isClickable}
				<button
					on:click={() => goto(`/charts/4aeb0e15-91a3-4ef9-a975-c2b0ee19f459?region=${row.region.id}`)}
					class="text-sm font-semibold text-[#19191c] dark:text-gray-100 hover:underline text-left"
				>{row.region.name}</button>
			{:else}
				<div class="text-sm font-semibold text-[#19191c] dark:text-gray-100">{row.region.name}</div>
			{/if}
			<div class="text-xs text-gray-400">
				{#if row.distKm != null && row.distKm > 0}{row.distKm.toFixed(0)} km ·{/if}
				{#if row.region.population}{formatEW(row.region.population)}{/if}
				{#if row.region.layer_label}
					· {row.region.layer_label}{/if}
			</div>
		</div>
		<div role="cell" aria-label="Genutztes Potential: {row.potential.toFixed(1)} Prozent">
			<div class="space-y-1">
				<div class="text-base font-bold text-[#19191c] dark:text-gray-100">
					{row.potential.toFixed(1)}
				</div>
				<div class="h-1 w-full rounded bg-gray-100">
					<div
						class="h-full rounded bg-gradient-to-r from-yellow-400 to-yellow-500"
						style="width: {Math.min((row.potential / 60) * 80, 80)}%"
					></div>
				</div>
			</div>
		</div>
		<div role="cell">
			{#if row.trend != null}
				<span
					class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold
					{row.trend > 0
						? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
						: row.trend < 0
							? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
							: 'bg-gray-100 text-gray-500 dark:bg-gray-800'}"
				>
					{#if row.trend >= 0}
						<IconTrendingUp aria-hidden="true" size={12} />
					{:else}
						<IconTrendingDown aria-hidden="true" size={12} />
					{/if}
					{row.trend > 0 ? '+' : ''}{row.trend.toFixed(2)}
				</span>
			{:else}
				<span class="text-xs text-gray-400">—</span>
			{/if}
		</div>
		<div role="cell" aria-label="Dächer mit PV: {row.daecher.toFixed(1)} Prozent">
			<div class="space-y-1">
				<div class="text-base text-[#19191c] dark:text-gray-300">
					{row.daecher.toFixed(1)}
				</div>
				<div class="h-1 w-full rounded bg-gray-100">
					<div
						class="h-full rounded bg-gradient-to-r from-blue-400 to-blue-500"
						style="width: {Math.min((row.daecher / 60) * 80, 80)}%"
					></div>
				</div>
			</div>
		</div>
		<div role="cell" aria-label="Installierte Leistung: {row.mwp.toFixed(1)} MWp">
			<span class="text-base text-[#19191c] dark:text-gray-300">{row.mwp.toFixed(1)}</span
			>
		</div>
	</div>
{/snippet}

{#snippet searchPaginate({
	value,
	onChange,
	isSearching,
	page,
	setPage,
	totalPages,
	filteredCount,
	totalCount,
	placeholder,
	ariaLabel
}: {
	value: string;
	onChange: (v: string) => void;
	isSearching: boolean;
	page: number;
	setPage: (p: number) => void;
	totalPages: number;
	filteredCount: number;
	totalCount: number;
	placeholder: string;
	ariaLabel: string;
})}
	<div class="mb-3 flex flex-wrap items-center gap-3">
		<div class="relative min-w-[180px] flex-1">
			<IconSearch
				aria-hidden="true"
				class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
			/>
			<input
				type="text"
				{value}
				on:input={(e) => onChange(e.currentTarget.value)}
				{placeholder}
				aria-label={ariaLabel}
				class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
			/>
		</div>
		{#if !isSearching}
			<div class="flex shrink-0 items-center gap-2">
				<span class="text-sm font-medium text-gray-600">
					{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredCount)} von {totalCount.toLocaleString(
						'de-DE'
					)}
				</span>
				<button
					on:click={() => setPage(Math.max(1, page - 1))}
					disabled={page === 1}
					aria-label="Vorherige Seite"
					class="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					<IconChevronLeft class="size-4" />
				</button>
				<button
					on:click={() => setPage(Math.min(totalPages, page + 1))}
					disabled={page === totalPages}
					aria-label="Nächste Seite"
					class="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					<IconChevronRight class="size-4" />
				</button>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet globalFallback(searchTerm: string)}
	<div class="py-6 text-center">
		<p class="text-gray-500 mb-3">„{searchTerm}" nicht in dieser Ansicht gefunden.</p>
		{#if globalLoading}
			<p class="text-sm text-gray-400">Suche in allen Regionen…</p>
		{:else if globalSuggestions.length > 0}
			<p class="text-sm text-gray-500 mb-2">Andere Regionen mit diesem Namen:</p>
			<ul class="inline-flex flex-col gap-1 text-left">
				{#each globalSuggestions as s}
					<li>
						<button
							on:click={() => goto(`/charts/4aeb0e15-91a3-4ef9-a975-c2b0ee19f459?region=${s.id}`)}
							class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
						>
							<span class="font-semibold text-[#19191c] dark:text-gray-100">{s.title}</span>
							{#if s.subtitle}<span class="text-xs text-gray-400">{s.subtitle}</span>{/if}
							<IconChevronRight class="ml-auto size-4 text-gray-400" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/snippet}

{#snippet skeletonRows()}
	{#each Array(5) as _}
		<div
			class="grid grid-cols-[60px_minmax(130px,1fr)_200px_230px_215px_210px] gap-x-3 border-b border-gray-100 dark:border-gray-700 px-1 py-3"
		>
			<div class="h-5 w-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
			<div class="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
			<div class="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
			<div class="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
			<div class="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
			<div class="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
		</div>
	{/each}
{/snippet}

<!-- ════════════════ WRAPPER ════════════════ -->

<!-- Tab switcher -->
{#if tabViews.length > 1}
<div class="mb-4">
	<Switch
		views={tabViews}
		activeView={activeTab}
		label="Ranking-Kategorien"
		on:itemClick={(e) => {
			const next = e.detail as Tab;
			if (next === 'de')   { const r = rankDEFiltered > 0 ? rankDEFiltered : rankDE; pageMittel = r > 0 ? Math.ceil(r / PER_PAGE) : 1; pageMittelUserSet = false; }
			if (next === 'land') { pageLand   = rankLand  > 0 ? Math.ceil(rankLand / PER_PAGE) : 1; pageLandUserSet   = false; }
			activeTab = next;
			sortCol = null;
			sortDir = 'desc';
		}}
	/>
</div>
{/if}

<!-- ══ TAB 1: DE-WEIT ══ -->
{#if activeTab === 'de'}
	{#if rankDE > 0}
		<h3 class="mb-0.5 text-lg font-bold text-[#19191c] dark:text-gray-100">
			{regionName} belegt Platz {rankDE} von {rankDEGesamt.toLocaleString('de-DE')} ({deTabLabel})
		</h3>
	{/if}
	<p class="mb-3 text-sm text-gray-500">{deTabDescription}</p>

	{#if showBigFilter}
		<div class="mb-3">
			<Toggle label="Großstädte ≥ 500.000 EW" bind:checked={showOnlyBig} />
		</div>
	{/if}

	{#if loading && allDEweit.length === 0}
		<div class="overflow-x-auto">
			<div class="min-w-[1060px]" role="table" aria-label="Ranking {deTabLabel}">
				{@render tableHeader()}
				{@render skeletonRows()}
			</div>
		</div>
	{:else if !loading && allDEweit.length === 0}
		<p class="py-8 text-center text-sm text-gray-400">Ranking-Daten konnten nicht geladen werden.</p>
	{:else}
		{@render searchPaginate({
			value: searchMittel,
			onChange: (v) => (searchMittel = v),
			isSearching: isSearchingMittel,
			page: pageMittel,
			setPage: (p) => { pageMittel = p; pageMittelUserSet = true; },
			totalPages: mittelTotalPages,
			filteredCount: mittelFiltered.length,
			totalCount: rankDEGesamt,
			placeholder: 'Stadt oder Gemeinde suchen…',
			ariaLabel: 'Gemeinde suchen'
		})}
		{#if mittelPage.length > 0}
			<div class="overflow-x-auto">
				<div class="min-w-[1060px]" role="table" aria-label="Ranking {deTabLabel}">
					{@render tableHeader()}
					{#each mittelPage as row (row.region.id)}
						{@render rankRow(row, row.region.id === regionId)}
					{/each}
				</div>
			</div>
		{:else if isSearchingMittel}
			{@render globalFallback(searchMittel)}
		{/if}
	{/if}

	<!-- ══ TAB 2: BUNDESLAND ══ -->
{:else if activeTab === 'land'}
	{#if rankLand > 0}
		<h3 class="mb-0.5 text-lg font-bold text-[#19191c] dark:text-gray-100">
			{regionName} belegt Platz {rankLand} von {rankLandGesamt.toLocaleString('de-DE')} in {stateName}
		</h3>
	{/if}
	<p class="mb-3 text-sm text-gray-500">
		{regionCase === 'kreis'
			? `Alle Landkreise und kreisfreien Städte in ${stateName}, sortiert nach genutztem Solarpotential.`
			: `Alle Gemeinden in ${stateName}, sortiert nach genutztem Solarpotential.`}
	</p>

	{#if showNachbarToggle}
		<div class="mb-3">
			<Toggle label="Nachbar-Ranking" bind:checked={showNachbarInLand} />
		</div>
	{/if}

	{#if showNachbarInLand && showNachbarToggle}
		<!-- Nachbar-Ansicht -->
		<p class="mb-3 text-sm text-gray-500">{neighbourDescription}</p>
		<div class="overflow-x-auto">
			<div class="min-w-[1060px]" role="table" aria-label="Nachbargemeinden">
				{@render tableHeader()}
				{#each neighboursSorted as row (row.region.id)}
					{@render rankRow(row, row.region.id === regionId)}
				{/each}
			</div>
		</div>
		{#if neighboursSorted.length === 0}
			<p class="py-8 text-center text-sm text-gray-400">Keine Standortdaten verfügbar.</p>
		{/if}
	{:else if loading && byLand.length === 0}
		<div class="overflow-x-auto">
			<div class="min-w-[1060px]" role="table" aria-label="Ranking Gemeinden {stateName}">
				{@render tableHeader()}
				{@render skeletonRows()}
			</div>
		</div>
	{:else if !loading && byLand.length === 0}
		<p class="py-8 text-center text-sm text-gray-400">Ranking-Daten konnten nicht geladen werden.</p>
	{:else}
		{@render searchPaginate({
			value: searchLand,
			onChange: (v) => (searchLand = v),
			isSearching: isSearchingLand,
			page: pageLand,
			setPage: (p) => { pageLand = p; pageLandUserSet = true; },
			totalPages: landTotalPages,
			filteredCount: landFiltered.length,
			totalCount: rankLandGesamt,
			placeholder: 'Gemeinde suchen…',
			ariaLabel: 'Gemeinde suchen'
		})}
		{#if landPage.length > 0}
			<div class="overflow-x-auto">
				<div class="min-w-[1060px]" role="table" aria-label="Ranking Gemeinden {stateName}">
					{@render tableHeader()}
					{#each landPage as row (row.region.id)}
						{@render rankRow(row, row.region.id === regionId)}
					{/each}
				</div>
			</div>
		{:else if isSearchingLand}
			{@render globalFallback(searchLand)}
		{/if}
	{/if}

	<!-- ══ TAB 3: NACHBARGEMEINDEN ══ -->
{:else if activeTab === 'nachbar'}
	<p class="mb-3 text-sm text-gray-500">{neighbourDescription}</p>
	<div class="overflow-x-auto">
		<div class="min-w-[1060px]" role="table" aria-label="Nachbargemeinden">
			{@render tableHeader()}
			{#each neighboursSorted as row (row.region.id)}
				{@render rankRow(row, row.region.id === regionId)}
			{/each}
		</div>
	</div>
	{#if neighboursSorted.length === 0}
		<p class="py-8 text-center text-sm text-gray-400">Keine Standortdaten verfügbar.</p>
	{/if}
{/if}
