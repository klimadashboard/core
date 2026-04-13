<script lang="ts">
	import { page } from '$app/state';
	// @ts-ignore
	import domtoimage from 'dom-to-image';
	import type { GEMEINDE } from './data';
	import { ALL_MITTEL_DE, ALL_GEMEINDEN_BY, NAECHSTE } from './data';

	export let gemeinde: typeof GEMEINDE;

	type Tab = 'mittelDE' | 'land';
	type SortCol = 'rank' | 'potential' | 'trend' | 'daecher' | 'mwp' | null;

	let activeTab: Tab = 'mittelDE';
	let sortCol: SortCol = null;
	let sortDir: 'asc' | 'desc' = 'desc';

	let searchMittel = '';
	let pageMittel = 1;
	let searchLand = '';
	let pageLand = 1;

	const PER_PAGE = 10;
	const MEDALS = ['🥇', '🥈', '🥉'];

	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'desc' ? 'asc' : 'desc';
		else { sortCol = col; sortDir = 'desc'; }
	}

	type AnyRow = { rank: number; potential: number; trend: number; daecher: number; mwp: number };
	function sortRows<T extends AnyRow>(rows: T[], col: SortCol, dir: 'asc' | 'desc'): T[] {
		if (!col) return rows;
		const key = col;
		return [...rows].sort((a, b) => {
			const va = (a[key] as number) ?? -Infinity;
			const vb = (b[key] as number) ?? -Infinity;
			return dir === 'desc' ? vb - va : va - vb;
		});
	}

	function formatEW(ew: number): string {
		return ew >= 100_000 ? `${(ew / 1000).toFixed(0)}k EW` : `${ew.toLocaleString('de-DE')} EW`;
	}

	// ── Tab 1: Mittelstädte DE ────────────────────────────────────
	$: mittelQuery = searchMittel.toLowerCase().trim();
	$: isSearchingMittel = mittelQuery.length >= 2;
	$: if (searchMittel) pageMittel = 1;

	$: mittelFiltered = isSearchingMittel
		? ALL_MITTEL_DE.filter(
				(c) =>
					c.name.toLowerCase().includes(mittelQuery) ||
					c.bundesland.toLowerCase().includes(mittelQuery)
		  )
		: ALL_MITTEL_DE;
	$: mittelSorted = sortRows(mittelFiltered.map((c) => ({ ...c, origRank: c.rank })), sortCol, sortDir);
	$: mittelPage = mittelSorted.slice((pageMittel - 1) * PER_PAGE, pageMittel * PER_PAGE);
	$: mittelTotalPages = Math.ceil(mittelFiltered.length / PER_PAGE);

	// ── Tab 2: Alle Gemeinden Bayern ─────────────────────────────
	let showNachbarn = true;
	$: nachbarnByRank = [...NAECHSTE].sort((a, b) => (a.rankLand ?? 0) - (b.rankLand ?? 0));

	$: landQuery = searchLand.toLowerCase().trim();
	$: isSearchingLand = landQuery.length >= 2;
	$: if (searchLand) pageLand = 1;

	$: landFiltered = isSearchingLand
		? ALL_GEMEINDEN_BY.filter(
				(c) =>
					c.name.toLowerCase().includes(landQuery) ||
					c.bez.toLowerCase().includes(landQuery)
		  )
		: ALL_GEMEINDEN_BY;
	$: landSorted = sortRows(landFiltered.map((c) => ({ ...c, origRank: c.rank })), sortCol, sortDir);
	$: landPage = landSorted.slice((pageLand - 1) * PER_PAGE, pageLand * PER_PAGE);
	$: landTotalPages = Math.ceil(landFiltered.length / PER_PAGE);

	// ── Wrapper state ────────────────────────────────────────────
	let wrapperEl: any = null;
	let showNotices = false;

	const copyEmbedCode = () => {
		const code = `<iframe src="${window.location.origin}/embed/solar-potential-ranking" width="1200" height="400">`;
		const dummy = document.createElement('textarea');
		document.body.appendChild(dummy);
		dummy.value = code;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);
		alert('Der iFrame-Code wurde in die Zwischenablage kopiert.');
	};

	const exportImage = async () => {
		domtoimage.toBlob(wrapperEl, {
			filter: (e: any) => !Object.keys(e.dataset || {}).includes('shareIgnore'),
			width: wrapperEl.clientWidth * 4,
			height: wrapperEl.clientHeight * 4,
			style: { transform: 'scale(4)', transformOrigin: 'top left' }
		}).then(async (blob: Blob) => {
			const filesArray = [new File([blob], 'Solarpotential-Ranking.png', { type: blob.type, lastModified: Date.now() })];
			try {
				await navigator.share({ files: filesArray });
			} catch {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'Solarpotential-Ranking.png';
				a.click();
			}
		});
	};
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
						<svg class="mt-0.5 h-4 w-4 shrink-0 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 6l9 0" /><path d="M4 12l7 0" /><path d="M4 18l7 0" /><path d="M15 15l3 3l3 -3" /><path d="M18 6l0 12" />
						</svg>
					{:else}
						<svg class="mt-0.5 h-4 w-4 shrink-0 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 6l7 0" /><path d="M4 12l7 0" /><path d="M4 18l9 0" /><path d="M15 9l3 -3l3 3" /><path d="M18 6l0 12" />
						</svg>
					{/if}
				{:else}
					<svg class="mt-0.5 h-4 w-4 shrink-0 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M4 6l9 0" /><path d="M4 12l7 0" /><path d="M4 18l7 0" /><path d="M15 15l3 3l3 -3" /><path d="M18 6l0 12" />
					</svg>
				{/if}
			{/if}
		</div>
	</div>
{/snippet}

{#snippet tableHeaderMittel()}
	<div role="row" class="mb-1 grid grid-cols-[60px_minmax(130px,1fr)_200px_230px_215px_210px] gap-x-3 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
		{@render colHeader('rank',       'Rang')}
		{@render colHeader(null,        'Gemeinde')}
		{@render colHeader('potential', 'Genutztes Potential (%)')}
		{@render colHeader('trend',     'Veränderung letzte 6 Monate (%P)')}
		{@render colHeader('daecher',   'Dächer mit Photovoltaik (%)')}
		{@render colHeader('mwp',       'Installierte Leistung (MWp)')}
	</div>
{/snippet}

{#snippet tableHeaderLand()}
	<div role="row" class="mb-1 grid grid-cols-[60px_minmax(130px,1fr)_200px_230px_215px_210px] gap-x-3 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
		{@render colHeader('rank',       'Rang')}
		{@render colHeader(null,        'Gemeinde')}
		{@render colHeader('potential', 'Genutztes Potential (%)')}
		{@render colHeader('trend',     'Veränderung letzte 6 Monate (%P)')}
		{@render colHeader('daecher',   'Dächer mit Photovoltaik (%)')}
		{@render colHeader('mwp',       'Installierte Leistung (MWp)')}
	</div>
{/snippet}

{#snippet rowMittel(
	rank: number, name: string, bundesland: string, ew: number,
	potential: number, trend: number | null, daecher: number, mwp: number,
	rc: number, isSelf: boolean
)}
	<div
		role="row"
		aria-label="{name}, Rang {rank}"
		class="grid grid-cols-[60px_minmax(130px,1fr)_200px_230px_215px_210px] gap-x-3 items-start px-1 py-3
			{isSelf
				? 'rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
				: 'border-b border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'}"
	>
		<div role="cell" class="flex items-center gap-0.5 pt-0.5">
			{#if rank <= 3}<span aria-hidden="true" class="text-base leading-none">{MEDALS[rank - 1]}</span>{/if}
			<span class="font-mono text-lg font-bold leading-none {rank <= 3 ? 'text-amber-500' : 'text-[#19191c] dark:text-gray-400'}">{rank}</span>
			{#if rc !== 0}
				<span class="text-[9px] leading-none {rc > 0 ? 'text-green-600' : 'text-red-500'}"
					aria-label="{rc > 0 ? rc + ' Plätze gestiegen' : Math.abs(rc) + ' Plätze gefallen'}">{rc > 0 ? '▲' : '▼'}</span>
			{/if}
		</div>
		<div role="cell">
			<div class="text-sm font-semibold text-[#19191c] dark:text-gray-100">{name}</div>
			<div class="text-xs text-gray-400">{formatEW(ew)} · {bundesland}</div>
		</div>
		<div role="cell" aria-label="Genutztes Potential: {potential.toFixed(1)} Prozent">
			<div class="space-y-1">
				<div class="font-mono text-base font-bold text-[#19191c] dark:text-gray-100">{potential.toFixed(1)}</div>
				<div class="h-1 w-full rounded bg-gray-100">
					<div class="h-full rounded bg-gradient-to-r from-yellow-400 to-yellow-500"
						style="width: {Math.min((potential / 60) * 80, 80)}%"></div>
				</div>
			</div>
		</div>
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
					{trend > 0 ? '+' : ''}{trend.toFixed(2)}
				</span>
			{:else}
				<span class="text-xs text-gray-400">—</span>
			{/if}
		</div>
		<div role="cell" aria-label="Dächer mit PV: {daecher.toFixed(1)} Prozent">
			<div class="space-y-1">
				<div class="font-mono text-base text-[#19191c] dark:text-gray-300">{daecher.toFixed(1)}</div>
				<div class="h-1 w-full rounded bg-gray-100">
					<div class="h-full rounded bg-gradient-to-r from-blue-400 to-blue-500"
						style="width: {Math.min((daecher / 60) * 80, 80)}%"></div>
				</div>
			</div>
		</div>
		<div role="cell" aria-label="Installierte Leistung: {mwp.toFixed(1)} MWp">
			<span class="font-mono text-base text-[#19191c] dark:text-gray-300">{mwp.toFixed(1)}</span>
		</div>
	</div>
{/snippet}

{#snippet rowLand(
	rank: number, name: string, ew: number,
	potential: number, trend: number | null, daecher: number, mwp: number,
	rc: number, isSelf: boolean
)}
	<div
		role="row"
		aria-label="{name}, Rang {rank}"
		class="grid grid-cols-[60px_minmax(130px,1fr)_200px_230px_215px_210px] gap-x-3 items-start px-1 py-3
			{isSelf
				? 'rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
				: 'border-b border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'}"
	>
		<div role="cell" class="flex items-center gap-0.5 pt-0.5">
			{#if rank <= 3}<span aria-hidden="true" class="text-base leading-none">{MEDALS[rank - 1]}</span>{/if}
			<span class="font-mono text-lg font-bold leading-none {rank <= 3 ? 'text-amber-500' : 'text-[#19191c] dark:text-gray-400'}">{rank}</span>
			{#if rc !== 0}
				<span class="text-[9px] leading-none {rc > 0 ? 'text-green-600' : 'text-red-500'}">{rc > 0 ? '▲' : '▼'}</span>
			{/if}
		</div>
		<div role="cell">
			<div class="text-sm font-semibold text-[#19191c] dark:text-gray-100">{name}</div>
			<div class="text-xs text-gray-400">{formatEW(ew)}</div>
		</div>
		<div role="cell">
			<div class="space-y-1">
				<div class="font-mono text-base font-bold text-[#19191c] dark:text-gray-100">{potential.toFixed(1)}</div>
				<div class="h-1 w-full rounded bg-gray-100">
					<div class="h-full rounded bg-gradient-to-r from-yellow-400 to-yellow-500"
						style="width: {Math.min((potential / 60) * 80, 80)}%"></div>
				</div>
			</div>
		</div>
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
					{trend > 0 ? '+' : ''}{trend.toFixed(2)}
				</span>
			{:else}
				<span class="text-xs text-gray-400">—</span>
			{/if}
		</div>
		<div role="cell">
			<div class="space-y-1">
				<div class="font-mono text-base text-[#19191c] dark:text-gray-300">{daecher.toFixed(1)}</div>
				<div class="h-1 w-full rounded bg-gray-100">
					<div class="h-full rounded bg-gradient-to-r from-blue-400 to-blue-500"
						style="width: {Math.min((daecher / 60) * 80, 80)}%"></div>
				</div>
			</div>
		</div>
		<div role="cell">
			<span class="font-mono text-base text-[#19191c] dark:text-gray-300">{mwp.toFixed(1)}</span>
		</div>
	</div>
{/snippet}

<!-- ════════════════ WRAPPER ════════════════ -->
<div bind:this={wrapperEl} class="relative mb-3.5 rounded-2xl border border-gray-200 bg-white p-5 pb-16 dark:border-gray-700 dark:bg-[#19191c]">

	<!-- KD-style header: title + actions -->
	<div class="mb-4 flex items-center justify-between transition">
		<h2 class="font-bold">Solarpotential-Ranking</h2>
		<div class="flex items-center gap-3 transition" data-share-ignore>
			<button on:mousedown={exportImage} class="cursor-pointer opacity-80 transition hover:opacity-100" aria-label="Als Bild exportieren">
				<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-photo-share" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 8h.01"/><path d="M12 21h-6a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v7"/><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l3 3"/><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0"/><path d="M16 22l5 -5"/><path d="M21 21.5v-4.5h-4.5"/>
				</svg>
			</button>
			<button on:mousedown={copyEmbedCode} class="cursor-pointer opacity-80 transition hover:opacity-100" aria-label="Einbetten">
				<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-code" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none"/><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/><line x1="14" y1="4" x2="10" y2="20"/>
				</svg>
			</button>
			<a href="https://klimadashboard.at" class="ml-2" target="_blank" rel="noopener" aria-label="Klimadashboard.at">
				<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 rounded-sm">
					<rect width="256" height="256" fill="url(#kd-ranking-gradient)"/>
					<path d="M119.45 88H53C50.7909 88 49 89.7909 49 92V164C49 166.209 50.7909 168 53 168H119.45C122.998 168 124.79 163.723 122.3 161.194L92.3872 130.806C90.8547 129.249 90.8547 126.751 92.3872 125.194L122.3 94.8061C124.79 92.2773 122.998 88 119.45 88Z" fill="#DBF0E0"/>
					<path opacity="0.6" d="M162.95 88H134.808C133.732 88 132.701 88.4337 131.948 89.203L96.7358 125.203C95.2152 126.758 95.2152 129.242 96.7358 130.797L131.948 166.797C132.701 167.566 133.732 168 134.808 168H162.95C166.498 168 168.29 163.723 165.8 161.194L135.887 130.806C134.355 129.249 134.355 126.751 135.887 125.194L165.8 94.8061C168.29 92.2773 166.498 88 162.95 88Z" fill="#DBF0E0"/>
					<path opacity="0.2" d="M197.95 88H178.808C177.732 88 176.701 88.4337 175.948 89.203L140.736 125.203C139.215 126.758 139.215 129.242 140.736 130.797L175.948 166.797C176.701 167.566 177.732 168 178.808 168H197.95C201.498 168 203.29 163.723 200.8 161.194L170.887 130.806C169.355 129.249 169.355 126.751 170.887 125.194L200.8 94.8061C203.29 92.2773 201.498 88 197.95 88Z" fill="#DBF0E0"/>
					<defs><linearGradient id="kd-ranking-gradient" x1="425" y1="8.00003" x2="16" y2="248" gradientUnits="userSpaceOnUse"><stop stop-color="#A3D58A"/><stop offset="1" stop-color="#28A889"/></linearGradient></defs>
				</svg>
			</a>
		</div>
	</div>

	{#if !showNotices}

	<!-- Tab pills -->
	<div class="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Ranking-Kategorien">
		<!-- Tab 1: Mittelstädte DE -->
		<button
			role="tab"
			aria-selected={activeTab === 'mittelDE'}
			on:click={() => { activeTab = 'mittelDE'; sortCol = null; }}
			class="inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors
				{activeTab === 'mittelDE'
					? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
					: 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'}"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M8 9l5 5v7h-5v-4m0 4h-5v-7l5 -5m1 1v-6a1 1 0 0 1 1 -1h10a1 1 0 0 1 1 1v17h-8" />
				<path d="M13 7l0 .01" />
				<path d="M17 7l0 .01" />
				<path d="M17 11l0 .01" />
				<path d="M17 15l0 .01" />
			</svg>
			Mittelstädte DE
			<span class="font-mono text-base font-bold">#{gemeinde.rankMittelDE}</span>
			<span class="text-xs font-normal opacity-60">/ {gemeinde.rankMittelDEGesamt.toLocaleString('de-DE')}</span>
		</button>
		<!-- Tab 2: Bundesland -->
		<button
			role="tab"
			aria-selected={activeTab === 'land'}
			on:click={() => { activeTab = 'land'; sortCol = null; }}
			class="inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors
				{activeTab === 'land'
					? 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
					: 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'}"
		>
			{gemeinde.land}
			<span class="font-mono text-base font-bold">#{gemeinde.rankLand}</span>
			<span class="text-xs font-normal opacity-60">/ {gemeinde.rankLandGesamt.toLocaleString('de-DE')}</span>
		</button>
	</div>

	<!-- ══ TAB 1: MITTELSTÄDTE DE ══ -->
	{#if activeTab === 'mittelDE'}
		<h3 class="mb-0.5 text-lg font-bold text-[#19191c] dark:text-gray-100">
			{gemeinde.name} belegt Platz {gemeinde.rankMittelDE} von {gemeinde.rankMittelDEGesamt.toLocaleString('de-DE')} deutschen Mittelstädten
		</h3>
		<p class="mb-3 text-sm text-gray-500">
			Alle Städte und Gemeinden in Deutschland mit 20.000–99.999 Einwohnerinnen, sortiert nach genutztem Solarpotential.
		</p>

		<div class="mb-3 flex flex-wrap items-center gap-3">
			<div class="relative min-w-[180px] flex-1">
				<svg aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
					viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
				</svg>
				<input type="text" bind:value={searchMittel}
					placeholder="Stadt oder Bundesland suchen…"
					aria-label="Mittelstadt oder Bundesland suchen"
					class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
			</div>
			{#if !isSearchingMittel}
				<div class="flex shrink-0 items-center gap-2">
					<span class="text-sm font-medium text-gray-600">
						{(pageMittel - 1) * PER_PAGE + 1}–{Math.min(pageMittel * PER_PAGE, mittelFiltered.length)} von {gemeinde.rankMittelDEGesamt.toLocaleString('de-DE')}
					</span>
					<button on:click={() => (pageMittel = Math.max(1, pageMittel - 1))} disabled={pageMittel === 1}
						aria-label="Vorherige Seite"
						class="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
						<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
						</svg>
					</button>
					<button on:click={() => (pageMittel = Math.min(mittelTotalPages, pageMittel + 1))} disabled={pageMittel === mittelTotalPages}
						aria-label="Nächste Seite"
						class="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
						<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
						</svg>
					</button>
				</div>
			{/if}
		</div>

		<div class="overflow-x-auto">
			<div class="min-w-[1060px]" role="table" aria-label="Ranking Mittelstädte Deutschland">
				{@render tableHeaderMittel()}
				{#each mittelPage as row (row.name)}
					{@render rowMittel(row.origRank, row.name, row.bundesland, row.ew,
						row.potential, row.trend, row.daecher, row.mwp, row.rc,
						row.name === gemeinde.name)}
				{/each}
			</div>
		</div>
		{#if isSearchingMittel && mittelPage.length === 0}
			<p class="py-8 text-center text-sm text-gray-400">„{searchMittel}" nicht gefunden.</p>
		{/if}
		{#if !isSearchingMittel}
			<p class="mt-2 text-xs text-gray-400">
				Prototyp-Datensatz · In der Live-Version werden alle {gemeinde.rankMittelDEGesamt.toLocaleString('de-DE')} Mittelstädte über die API geladen.
			</p>
		{/if}

	<!-- ══ TAB 2: ALLE GEMEINDEN BUNDESLAND ══ -->
	{:else if activeTab === 'land'}
		<h3 class="mb-0.5 text-lg font-bold text-[#19191c] dark:text-gray-100">
			{gemeinde.name} belegt Platz {gemeinde.rankLand} von {gemeinde.rankLandGesamt.toLocaleString('de-DE')} in {gemeinde.land}
		</h3>
		<p class="mb-3 text-sm text-gray-500">
			{#if showNachbarn}
				9 Nachbargemeinden mit ihrem bayernweiten Rang.
			{:else}
				Alle Gemeinden, Märkte und Städte in {gemeinde.land}, sortiert nach genutztem Solarpotential.
			{/if}
		</p>
		<label class="mb-3 flex items-center gap-2">
			<input
				type="checkbox"
				bind:checked={showNachbarn}
				on:change={() => (sortCol = null)}
			/>
			<span class="text-sm text-gray-700 dark:text-gray-300">Zeige Nachbargemeinden</span>
		</label>

		{#if showNachbarn}
			<!-- Nachbarn-Ansicht: bayernweiter Rang, nach rankLand sortiert -->
			<div class="overflow-x-auto">
				<div class="min-w-[1060px]" role="table" aria-label="Nachbargemeinden mit bayernweitem Rang">
					{@render tableHeaderLand()}
					{#each nachbarnByRank as row (row.name)}
						{@render rowLand(
							row.rankLand ?? 0, row.name, row.ew,
							row.potential, row.trend, row.daecher, row.mwp, row.rc,
							!!row.self
						)}
					{/each}
				</div>
			</div>
			<p class="mt-2 text-xs text-gray-400">Rang bezieht sich auf alle {gemeinde.rankLandGesamt.toLocaleString('de-DE')} Gemeinden in {gemeinde.land}.</p>

		{:else}
			<!-- Normale Listenansicht -->
			<div class="mb-3 flex flex-wrap items-center gap-3">
				<div class="relative min-w-[180px] flex-1">
					<svg aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
						viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
					</svg>
					<input type="text" bind:value={searchLand}
						placeholder="Gemeinde oder Typ suchen…"
						aria-label="Gemeinde suchen"
						class="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
				</div>
				{#if !isSearchingLand}
					<div class="flex shrink-0 items-center gap-2">
						<span class="text-sm font-medium text-gray-600">
							{(pageLand - 1) * PER_PAGE + 1}–{Math.min(pageLand * PER_PAGE, landFiltered.length)} von {gemeinde.rankLandGesamt.toLocaleString('de-DE')}
						</span>
						<button on:click={() => (pageLand = Math.max(1, pageLand - 1))} disabled={pageLand === 1}
							aria-label="Vorherige Seite"
							class="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
							<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</button>
						<button on:click={() => (pageLand = Math.min(landTotalPages, pageLand + 1))} disabled={pageLand === landTotalPages}
							aria-label="Nächste Seite"
							class="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
							<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
							</svg>
						</button>
					</div>
				{/if}
			</div>

			<div class="overflow-x-auto">
				<div class="min-w-[1060px]" role="table" aria-label="Ranking Gemeinden Bayern">
					{@render tableHeaderLand()}
					{#each landPage as row (row.name)}
						{@render rowLand(row.origRank, row.name, row.ew,
							row.potential, row.trend, row.daecher, row.mwp, row.rc,
							row.name === gemeinde.name)}
					{/each}
				</div>
			</div>
			{#if isSearchingLand && landPage.length === 0}
				<p class="py-8 text-center text-sm text-gray-400">„{searchLand}" nicht gefunden.</p>
			{/if}
			{#if !isSearchingLand}
				<p class="mt-2 text-xs text-gray-400">
					Prototyp-Datensatz · In der Live-Version werden alle {gemeinde.rankLandGesamt.toLocaleString('de-DE')} Gemeinden in {gemeinde.land} über die API geladen.
				</p>
			{/if}
		{/if}
	{/if}
</div>
