<script lang="ts">
	import type { GEMEINDE } from './data';
	import { NAECHSTE, BAYERN_TOP, ALL_MITTEL_BY } from './data';

	export let gemeinde: typeof GEMEINDE;

	type Tab = 'nachbarn' | 'land' | 'mittelBY';
	type SortCol = 'potential' | 'trend' | 'daecher' | 'mwp' | null;

	let activeTab: Tab = 'nachbarn';
	let sortCol: SortCol = null;
	let sortDir: 'asc' | 'desc' = 'desc';

	let searchLand = '';
	let pageLand = 1;
	let searchMittel = '';
	let pageMittel = 1;

	const PER_PAGE = 10;
	const MEDALS = ['🥇', '🥈', '🥉'];

	const naechsteRanked = NAECHSTE.map((n, i) => ({ ...n, origRank: i + 1 }));
	const selbstRang = NAECHSTE.findIndex((n) => n.self) + 1;

	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'desc' ? 'asc' : 'desc';
		else { sortCol = col; sortDir = 'desc'; }
	}

	type AnyRow = { potential: number; trend: number; daecher: number; mwp: number };
	function sortRows<T extends AnyRow>(rows: T[]): T[] {
		if (!sortCol) return rows;
		const key = sortCol;
		return [...rows].sort((a, b) => {
			const va = (a[key] as number) ?? -Infinity;
			const vb = (b[key] as number) ?? -Infinity;
			return sortDir === 'desc' ? vb - va : va - vb;
		});
	}

	function formatEW(ew: number): string {
		return ew >= 100_000 ? `${(ew / 1000).toFixed(0)}k EW` : `${ew.toLocaleString('de-DE')} EW`;
	}

	// ── Land ──────────────────────────────────────────────────
	$: landQuery = searchLand.toLowerCase().trim();
	$: isSearchingLand = landQuery.length >= 2;
	$: if (searchLand) pageLand = 1;

	const bayernRows = BAYERN_TOP.map((t, i) => ({ ...t, origRank: i + 1, self: false }));
	const bayernWithSelf = [...bayernRows, {
		name: gemeinde.name, potential: gemeinde.potential, trend: gemeinde.trend,
		daecher: gemeinde.daecher, mwp: gemeinde.dachPV, ew: gemeinde.ew,
		rc: 0, origRank: gemeinde.rankLand, self: true
	}];

	$: landDisplayRows = sortRows(
		isSearchingLand
			? bayernWithSelf.filter((c) => c.name.toLowerCase().includes(landQuery))
			: bayernRows
	);
	$: landTotalPages = Math.ceil(gemeinde.rankLandGesamt / PER_PAGE);

	// ── Mittelstädte ──────────────────────────────────────────
	$: mittelQuery = searchMittel.toLowerCase().trim();
	$: isSearchingMittel = mittelQuery.length >= 2;
	$: if (searchMittel) pageMittel = 1;

	$: mittelFiltered = isSearchingMittel
		? ALL_MITTEL_BY.filter((c) => c.name.toLowerCase().includes(mittelQuery))
		: ALL_MITTEL_BY;
	$: mittelSorted = sortRows(mittelFiltered.map((c) => ({ ...c, origRank: c.rank })));
	$: mittelPage = mittelSorted.slice((pageMittel - 1) * PER_PAGE, pageMittel * PER_PAGE);
	$: mittelTotalPages = Math.ceil(mittelFiltered.length / PER_PAGE);
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
		class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 leading-tight whitespace-pre-line
			{sortable ? 'cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-300' : ''}"
		on:click={() => sortable && toggleSort(key)}
		on:keydown={(e) => e.key === 'Enter' && sortable && toggleSort(key)}
	>
		{label}{#if sortable}<span class="ml-0.5 opacity-60">{active ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ' ⇅'}</span>{/if}
	</div>
{/snippet}

{#snippet tableHeader()}
	<div role="row" class="mb-1 grid grid-cols-[56px_1fr_88px_92px_80px_96px] gap-x-2 border-b-2 border-gray-200 pb-2 pr-1 dark:border-gray-700">
		{@render colHeader(null,        'Rang')}
		{@render colHeader(null,        'Gemeinde')}
		{@render colHeader('potential', 'Potential\n(%)')}
		{@render colHeader('trend',     'Änd.\n(6 Mon.)')}
		{@render colHeader('daecher',   'Dächer\nmit PV (%)')}
		{@render colHeader('mwp',       'Leistung\n(MWp)')}
	</div>
{/snippet}

{#snippet tableRow(
	rank: number, name: string, sub: string,
	potential: number, trend: number | null, daecher: number, mwp: number,
	rc: number, isSelf: boolean
)}
	<div
		role="row"
		aria-label="{name}, Rang {rank}"
		class="mb-0.5 grid grid-cols-[56px_1fr_88px_92px_80px_96px] gap-x-2 items-start rounded-lg px-1 py-2
			{isSelf
				? 'border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
				: 'border border-transparent hover:bg-white dark:hover:bg-gray-800'}"
	>
		<!-- Rang -->
		<div role="cell" class="flex items-center gap-0.5 pt-0.5">
			{#if rank <= 3}<span aria-hidden="true" class="text-base leading-none">{MEDALS[rank - 1]}</span>{/if}
			<span class="font-mono text-lg font-bold leading-none {rank <= 3 ? 'text-amber-500' : 'text-gray-400'}">{rank}</span>
			{#if rc !== 0}
				<span class="text-[9px] leading-none {rc > 0 ? 'text-green-600' : 'text-red-500'}"
					aria-label="{rc > 0 ? rc + ' Plätze gestiegen' : Math.abs(rc) + ' Plätze gefallen'}">{rc > 0 ? '▲' : '▼'}</span>
			{/if}
		</div>

		<!-- Name + sub -->
		<div role="cell">
			<div class="text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</div>
			{#if sub}<div class="text-xs text-gray-400">{sub}</div>{/if}
		</div>

		<!-- Potential -->
		<div role="cell" aria-label="Genutztes Potential: {potential.toFixed(1)} Prozent">
			<div class="font-mono text-base font-bold text-gray-900 dark:text-gray-100">{potential.toFixed(1)}</div>
			<div class="mt-0.5 h-1 rounded-full bg-amber-500"
				style="width: {Math.max(Math.min((potential / 60) * 48, 48), 2)}px"></div>
		</div>

		<!-- Trend badge -->
		<div role="cell">
			{#if trend != null}
				<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold
					{trend > 0
						? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
						: trend < 0
							? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
							: 'bg-gray-100 text-gray-500 dark:bg-gray-800'}">
					<svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none"
						style={trend < 0 ? 'transform:scaleY(-1)' : ''}>
						<path d="M11.5 3L6.75 7.75L4.25 5.25L0.5 9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M8.5 3H11.5V6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{trend > 0 ? '+' : ''}{trend.toFixed(1)}
				</span>
			{:else}
				<span class="text-xs text-gray-400">—</span>
			{/if}
		</div>

		<!-- Dächer -->
		<div role="cell" aria-label="Dächer mit PV: {daecher.toFixed(1)} Prozent">
			<div class="font-mono text-base text-gray-600 dark:text-gray-300">{daecher.toFixed(1)}</div>
			<div class="mt-0.5 h-1 rounded-full bg-purple-500"
				style="width: {Math.max(Math.min((daecher / 60) * 48, 48), 2)}px"></div>
		</div>

		<!-- MWp -->
		<div role="cell" aria-label="Installierte Leistung: {mwp.toFixed(1)} MWp">
			<span class="font-mono text-base text-gray-600 dark:text-gray-300">{mwp.toFixed(1)}</span>
		</div>
	</div>
{/snippet}

<!-- ════════════════ WRAPPER ════════════════ -->
<div class="mb-3.5 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900">

	<!-- Tab pills -->
	<div class="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Ranking-Kategorien">
		{#each [
			{ id: 'nachbarn', label: '📍 Nachbarn',     rank: gemeinde.rankNachbarn, color: 'blue'   },
			{ id: 'land',     label: gemeinde.land,      rank: gemeinde.rankLand,     color: 'cyan'   },
			{ id: 'mittelBY', label: 'Mittelstädte BY', rank: gemeinde.rankMittelBY, color: 'purple' }
		] as tab (tab.id)}
			<button
				role="tab"
				aria-selected={activeTab === tab.id}
				on:click={() => { activeTab = tab.id as Tab; sortCol = null; }}
				class="inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors
					{activeTab === tab.id
						? tab.color === 'blue'
							? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
							: tab.color === 'cyan'
								? 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
								: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300'
						: 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'}"
			>
				{tab.label}
				<span class="font-mono text-base font-bold">#{tab.rank}</span>
			</button>
		{/each}
	</div>

	<!-- ══ NACHBARN ══ -->
	{#if activeTab === 'nachbarn'}
		<h3 class="mb-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">
			{gemeinde.name} belegt Platz {selbstRang} unter den Nachbargemeinden
		</h3>
		<p class="mb-4 text-sm text-gray-500">Rangliste der 10 nächsten Gemeinden nach genutztem Solarpotential</p>
		<div class="overflow-x-auto">
			<div class="min-w-[600px]" role="table" aria-label="Ranking Nachbargemeinden">
				{@render tableHeader()}
				{#each sortRows(naechsteRanked) as row (row.name)}
					{@render tableRow(row.origRank, row.name,
						`${formatEW(row.ew)}${row.self ? '' : ` · ${row.km} km`}`,
						row.potential, row.trend, row.daecher, row.mwp, row.rc, !!row.self)}
				{/each}
			</div>
		</div>
		<p class="mt-2 text-xs text-gray-400">Entfernung = Luftlinie zwischen Gemeindemittelpunkten</p>

	<!-- ══ LAND ══ -->
	{:else if activeTab === 'land'}
		<h3 class="mb-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">
			{gemeinde.name} belegt Platz {gemeinde.rankLand} von {gemeinde.rankLandGesamt.toLocaleString('de-DE')} in {gemeinde.land}
		</h3>
		<p class="mb-3 text-sm text-gray-500">Rangliste bayerischer Gemeinden nach genutztem Solarpotential</p>

		<div class="mb-3 flex flex-wrap items-center gap-3">
			<div class="relative min-w-[180px] flex-1">
				<svg aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
				<input type="text" bind:value={searchLand} placeholder="Suche in {gemeinde.land}..." aria-label="Suche in Bayern"
					class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
			</div>
			{#if !isSearchingLand}
				<div class="flex shrink-0 items-center gap-2">
					<span class="text-sm text-gray-500">
						{(pageLand - 1) * PER_PAGE + 1}–{Math.min(pageLand * PER_PAGE, gemeinde.rankLandGesamt)} von {gemeinde.rankLandGesamt.toLocaleString('de-DE')}
					</span>
					<button on:click={() => (pageLand = Math.max(1, pageLand - 1))} disabled={pageLand === 1}
						aria-label="Vorherige Seite" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700">‹</button>
					<button on:click={() => (pageLand = Math.min(landTotalPages, pageLand + 1))} disabled={pageLand === landTotalPages}
						aria-label="Nächste Seite" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700">›</button>
				</div>
			{/if}
		</div>

		<div class="overflow-x-auto">
			<div class="min-w-[600px]" role="table" aria-label="Ranking Bayern">
				{@render tableHeader()}
				{#each landDisplayRows as row (row.name)}
					{@render tableRow(row.origRank, row.name, formatEW(row.ew),
						row.potential, row.trend, row.daecher, row.mwp, row.rc, row.self)}
				{/each}
			</div>
		</div>
		{#if !isSearchingLand && pageLand > 1}
			<p class="py-10 text-center text-sm text-gray-400">
				Platz {((pageLand - 1) * PER_PAGE + 1).toLocaleString('de-DE')}–{Math.min(pageLand * PER_PAGE, gemeinde.rankLandGesamt).toLocaleString('de-DE')}
				· Daten werden in der Live-Version aus der API geladen
			</p>
		{/if}
		{#if isSearchingLand && landDisplayRows.length === 0}
			<p class="py-8 text-center text-sm text-gray-400">
				„{searchLand}" nicht im Prototyp — in der Live-Version werden alle {gemeinde.rankLandGesamt.toLocaleString('de-DE')} Gemeinden durchsucht.
			</p>
		{/if}

	<!-- ══ MITTELSTÄDTE BY ══ -->
	{:else if activeTab === 'mittelBY'}
		<h3 class="mb-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">
			{gemeinde.name} belegt Platz {gemeinde.rankMittelBY} von {gemeinde.rankMittelBYGesamt} unter bayerischen Mittelstädten
		</h3>
		<p class="mb-3 text-sm text-gray-500">
			Rangliste aller {gemeinde.rankMittelBYGesamt} Mittelstädte (20k–99k EW) in Bayern
		</p>

		<div class="mb-3 flex flex-wrap items-center gap-3">
			<div class="relative min-w-[180px] flex-1">
				<svg aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
				<input type="text" bind:value={searchMittel} placeholder="Suche eine Mittelstadt in Bayern..." aria-label="Suche Mittelstadt"
					class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
			</div>
			{#if !isSearchingMittel}
				<div class="flex shrink-0 items-center gap-2">
					<span class="text-sm text-gray-500">
						{(pageMittel - 1) * PER_PAGE + 1}–{Math.min(pageMittel * PER_PAGE, mittelFiltered.length)} von {mittelFiltered.length}
					</span>
					<button on:click={() => (pageMittel = Math.max(1, pageMittel - 1))} disabled={pageMittel === 1}
						aria-label="Vorherige Seite" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700">‹</button>
					<button on:click={() => (pageMittel = Math.min(mittelTotalPages, pageMittel + 1))} disabled={pageMittel === mittelTotalPages}
						aria-label="Nächste Seite" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700">›</button>
				</div>
			{/if}
		</div>

		<div class="overflow-x-auto">
			<div class="min-w-[600px]" role="table" aria-label="Ranking Mittelstädte Bayern">
				{@render tableHeader()}
				{#each mittelPage as row (row.name)}
					{@render tableRow(row.origRank, row.name, formatEW(row.ew),
						row.potential, row.trend, row.daecher, row.mwp, row.rc,
						row.name === gemeinde.name)}
				{/each}
			</div>
		</div>
		{#if isSearchingMittel && mittelPage.length === 0}
			<p class="py-8 text-center text-sm text-gray-400">„{searchMittel}" nicht gefunden.</p>
		{/if}
	{/if}
</div>
