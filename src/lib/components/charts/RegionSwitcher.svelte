<!--
	RegionSwitcher — the regions "around" a region, for switching or comparing.
	One component for all charts (started as the modal split pilot, 5e47759e).

	Regions come from getRegionContext ($lib/utils/regionContext):
	  - levels: Kreis → Metropolregion → Bundesland → Deutschland
	  - peers:  the Kreise of the Metropolregion (Landkreise / Kreisfreie Städte),
	            the Gemeinden of the Kreis, …
	  - plus a free search over all regions (compare mode)

	mode="switch"  — one region at a time (native <Select>), shown only inside an
	                 aggregate region (Metropolregion) so other charts keep behaving.
	                 on:change → Region
	mode="compare" — add/remove comparison lines; the chart owns the series and
	                 passes the ids it shows as `selectedIds`.
	                 on:add → ContextRegion[] · on:remove → ContextRegion
	    variant="chips" — levels as one-click toggle chips, peers in a disclosure
	    variant="menu"  — one "Region hinzufügen" button opening a checklist popover

	`rank` (optional): sorts regions by the chart's own metric, best first, for the
	"Spitzenreiter" shortcut ("wir zeigen lieber, wer führt").

	Usage:
		<RegionSwitcher {region} bind:selectedId on:change={(e) => (activeRegion = e.detail)} />
		<RegionSwitcher {region} mode="compare" selectedIds={ids} max={7} {rank}
			on:add={(e) => addSeries(e.detail)} on:remove={(e) => removeSeries(e.detail)} />
-->
<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { page } from '$app/state';
	import { fetchRegion, type Region } from '$lib/utils/getRegion';
	import { getRegions } from '$lib/utils/regions';
	import {
		getRegionContext,
		type ContextRegion,
		type RegionContext
	} from '$lib/utils/regionContext';
	import { Select, Checkbox } from '$lib/components/ui';
	import { t } from '$lib/utils/t';

	/** The region of the page/card (the starting point) */
	export let region: Region | null = null;
	export let mode: 'switch' | 'compare' = 'switch';
	export let variant: 'chips' | 'menu' = 'chips';
	/** switch: currently shown region id (defaults to `region`) */
	export let selectedId: string | null = null;
	/** compare: ids of the comparison regions shown (without `region` itself) */
	export let selectedIds: string[] = [];
	/** compare: maximum number of comparison regions */
	export let max = 7;
	export let disabled = false;
	/** compare: free search over all regions */
	export let searchable = true;
	/** compare: sort regions by the chart's metric, best first */
	export let rank: ((regions: ContextRegion[]) => Promise<ContextRegion[]>) | null = null;
	export let rankCount = 3;
	/** e.g. "pro km²" — what the ranking is based on, shown on the button */
	export let rankBasis = '';

	const dispatch = createEventDispatcher<{
		change: Region;
		add: ContextRegion[];
		remove: ContextRegion;
	}>();
	const uid = Math.random().toString(36).slice(2, 8);

	let context: RegionContext | null = null;
	let loadedFor: string | null = null;
	let announcement = '';

	$: translations = page.data.translations;
	$: if (region?.id && region.id !== loadedFor) load(region.id);
	$: if (mode === 'switch' && region?.id && !selectedId) selectedId = region.id;

	async function load(id: string) {
		loadedFor = id;
		const ctx = await getRegionContext({ id });
		if (loadedFor === id) context = ctx;
	}

	$: levels = context?.levels ?? [];
	$: peerGroups = context?.peers ?? [];
	$: allPeers = peerGroups.flatMap((g) => g.regions);
	// Rank like with like, per group: Landkreise against Landkreise (cities always lead per km²)
	const rankLabel = (g: { label: string }) =>
		`Top ${rankCount} ${g.label} ${rankBasis}`.replace(/\s+/g, ' ').trim();
	$: selected = new Set(selectedIds);
	$: atMax = selectedIds.length >= max;
	$: contextRegions = [...levels, ...allPeers];

	function isSelected(r: ContextRegion, sel: Set<string>) {
		return sel.has(r.id);
	}

	function toggle(r: ContextRegion) {
		if (selected.has(r.id)) {
			dispatch('remove', r);
			announcement = `${r.name} entfernt`;
		} else if (!atMax) {
			dispatch('add', [r]);
			announcement = `${r.name} hinzugefügt`;
		}
	}

	// ---------------------------------------------------------------- switch mode
	$: switchOptions = context
		? [
				...(context.levels.some((l) => l.id === context!.self.id) ? [] : [context.self]).map((r) => ({
					value: r.id,
					label: r.name,
					group: r.layer_label || r.name
				})),
				...context.levels.map((r) => ({
					value: r.id,
					label: r.name,
					group: t(translations, 'ui.regionSwitcher.comparison')
				})),
				...context.peers.flatMap((g) =>
					g.regions.map((r) => ({ value: r.id, label: r.name, group: g.label || context!.peersTitle || '' }))
				)
			]
		: [];

	async function handleSwitch(e: CustomEvent<string>) {
		const next = e.detail === region?.id ? region : await fetchRegion(e.detail);
		if (next) dispatch('change', next);
	}

	// ---------------------------------------------------------------- spitzenreiter
	let rankLoading: string | null = null;
	async function addLeaders(pool: ContextRegion[], key: string) {
		if (!rank || rankLoading) return;
		rankLoading = key;
		try {
			const ranked = await rank(pool);
			const room = Math.max(0, max - selectedIds.length);
			const leaders = ranked.filter((r) => !selected.has(r.id)).slice(0, Math.min(rankCount, room));
			if (leaders.length) {
				dispatch('add', leaders);
				announcement = `${leaders.map((r) => r.name).join(', ')} hinzugefügt`;
			}
		} finally {
			rankLoading = null;
		}
	}

	// ---------------------------------------------------------------- free search
	let query = '';
	let searchPool: ContextRegion[] = [];
	let searchLoading = false;
	let searchOpen = false;
	let activeIndex = -1;

	async function ensureSearchPool() {
		if (searchPool.length || searchLoading) return;
		searchLoading = true;
		try {
			searchPool = ((await getRegions()) ?? []) as ContextRegion[];
		} finally {
			searchLoading = false;
		}
	}

	$: searchResults = (() => {
		const q = query.trim().toLowerCase();
		if (q.length < 2) return [] as ContextRegion[];
		const seen = new Set<string>([region?.id ?? '']);
		const out: ContextRegion[] = [];
		// Context regions first (they include hidden ones like kreisfreie Städte)
		for (const r of [...contextRegions, ...searchPool]) {
			if (seen.has(r.id) || r.name.toLowerCase().indexOf(q) === -1) continue;
			seen.add(r.id);
			out.push(r);
		}
		return out
			.sort((a, b) => {
				const pa = a.name.toLowerCase().startsWith(q) ? 0 : 1;
				const pb = b.name.toLowerCase().startsWith(q) ? 0 : 1;
				return pa - pb;
			})
			.slice(0, 12);
	})();
	$: if (activeIndex >= searchResults.length) activeIndex = searchResults.length - 1;

	function pickResult(r: ContextRegion) {
		toggle(r);
		query = '';
		searchOpen = false;
		activeIndex = -1;
	}

	function onSearchKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			searchOpen = true;
			activeIndex = Math.min(activeIndex + 1, searchResults.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (e.key === 'Enter' && activeIndex >= 0 && searchResults[activeIndex]) {
			e.preventDefault();
			pickResult(searchResults[activeIndex]);
		} else if (e.key === 'Escape') {
			if (query || searchOpen) e.stopPropagation();
			query = '';
			searchOpen = false;
			activeIndex = -1;
		}
	}

	// ---------------------------------------------------------------- peers filter
	let peersOpen = false;
	let peerFilter = '';
	$: filteredPeerGroups = filterGroups(peerGroups, variant === 'menu' ? query : peerFilter);

	function filterGroups(groups: typeof peerGroups, q: string) {
		const s = q.trim().toLowerCase();
		if (!s) return groups;
		return groups
			.map((g) => ({ ...g, regions: g.regions.filter((r) => r.name.toLowerCase().includes(s)) }))
			.filter((g) => g.regions.length);
	}
	$: filteredLevels = variant === 'menu' && query.trim()
		? levels.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
		: levels;
	// Menu: search results not already shown in the lists above
	$: menuExtra = searchResults.filter((r) => !contextRegions.some((c) => c.id === r.id));

	// ---------------------------------------------------------------- menu popover
	let menuOpen = false;
	let menuButton: HTMLButtonElement;
	let menuEl: HTMLDivElement;
	let menuSearch: HTMLInputElement;

	async function openMenu() {
		menuOpen = true;
		ensureSearchPool();
		await tick();
		menuSearch?.focus();
	}
	function closeMenu(returnFocus = true) {
		menuOpen = false;
		query = '';
		if (returnFocus) menuButton?.focus();
	}
	function onWindowPointer(e: PointerEvent) {
		if (menuOpen && menuEl && !menuEl.contains(e.target as Node) && !menuButton.contains(e.target as Node))
			closeMenu(false);
	}
	function onMenuKey(e: KeyboardEvent) {
		if (menuOpen && e.key === 'Escape') {
			e.preventDefault();
			closeMenu();
		}
	}

	const chipBase =
		'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50';
	const chipOff =
		'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700';
	const chipOn =
		'bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white';
	const inputBase =
		'w-full rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400';
</script>

<svelte:window on:pointerdown={onWindowPointer} on:keydown={onMenuKey} />

{#snippet icon(kind: 'plus' | 'check' | 'chevron' | 'star' | 'search')}
	<svg
		aria-hidden="true"
		class="h-3.5 w-3.5 shrink-0"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{#if kind === 'plus'}<path d="M12 5v14M5 12h14" />
		{:else if kind === 'check'}<path d="M20 6 9 17l-5-5" />
		{:else if kind === 'chevron'}<path d="m6 9 6 6 6-6" />
		{:else if kind === 'star'}<path
				d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
			/>
		{:else}<circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />{/if}
	</svg>
{/snippet}

{#snippet chip(r: ContextRegion, showLayer: boolean)}
	{@const on = isSelected(r, selected)}
	<button
		type="button"
		class="{chipBase} {on ? chipOn : chipOff}"
		aria-pressed={on}
		disabled={disabled || (!on && atMax)}
		on:click={() => toggle(r)}
	>
		{@render icon(on ? 'check' : 'plus')}
		<span>{r.name}</span>
		{#if showLayer && r.layer_label}
			<span class="text-xs {on ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}"
				>{r.layer_label}</span
			>
		{/if}
	</button>
{/snippet}

{#snippet rankButton(g: { label: string; regions: ContextRegion[] })}
	{#if rank && g.regions.length > rankCount}
		<button
			type="button"
			class="{chipBase} !py-1 text-xs border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
			disabled={disabled || atMax || !!rankLoading}
			aria-busy={rankLoading === g.label}
			on:click={() => addLeaders(g.regions, g.label)}
		>
			{@render icon('star')}
			{rankLoading === g.label ? 'Wird berechnet…' : rankLabel(g)}
		</button>
	{/if}
{/snippet}

{#snippet searchBox()}
	<div class="relative w-full sm:w-56">
		<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
			{@render icon('search')}
		</span>
		<input
			type="text"
			role="combobox"
			class="{inputBase} pl-8"
			placeholder="Andere Region suchen…"
			aria-label="Andere Region zum Vergleich suchen"
			aria-expanded={searchOpen && query.trim().length >= 2}
			aria-controls="{uid}-results"
			aria-autocomplete="list"
			aria-activedescendant={activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined}
			autocomplete="off"
			bind:value={query}
			{disabled}
			on:focus={() => {
				ensureSearchPool();
				searchOpen = true;
			}}
			on:input={() => {
				searchOpen = true;
				activeIndex = -1;
			}}
			on:blur={() => setTimeout(() => (searchOpen = false), 150)}
			on:keydown={onSearchKey}
		/>
		{#if searchOpen && query.trim().length >= 2}
			<ul
				id="{uid}-results"
				role="listbox"
				aria-label="Suchergebnisse"
				class="absolute left-0 top-full z-20 mt-1 max-h-64 w-full min-w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
			>
				{#each searchResults as r, i (r.id)}
					{@const on = isSelected(r, selected)}
					<li
						id="{uid}-opt-{i}"
						role="option"
						aria-selected={on}
						aria-disabled={!on && atMax}
						class="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
							{i === activeIndex ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'}"
						on:mousedown|preventDefault={() => pickResult(r)}
					>
						<span class="flex items-center gap-2">
							{#if on}{@render icon('check')}{/if}{r.name}
						</span>
						<span class="text-xs text-gray-500 dark:text-gray-400">{r.layer_label ?? ''}</span>
					</li>
				{:else}
					<li class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
						{searchLoading ? 'Regionen werden geladen…' : 'Keine Region gefunden'}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/snippet}

{#snippet maxNote()}
	{#if atMax}
		<p class="text-xs text-gray-600 dark:text-gray-400">
			Maximal {max} Vergleiche – entferne eine Linie, um weitere hinzuzufügen.
		</p>
	{/if}
{/snippet}

{#if mode === 'switch'}
	{#if context?.aggregate && switchOptions.length > 1}
		<div class="max-w-xs">
			<Select
				label={t(translations, 'ui.regionSwitcher.label')}
				bind:value={selectedId}
				options={switchOptions}
				small
				{disabled}
				on:change={handleSwitch}
			/>
		</div>
	{/if}
{:else if variant === 'chips'}
	<!-- ============================ Variant A: chips ============================ -->
	<div class="space-y-2" role="group" aria-labelledby="{uid}-label">
		<div class="flex items-baseline justify-between gap-2">
			<span id="{uid}-label" class="text-sm font-medium text-gray-700 dark:text-gray-300"
				>Vergleichen mit</span
			>
			<span class="text-xs tabular-nums text-gray-600 dark:text-gray-400"
				>{selectedIds.length}/{max} Vergleiche</span
			>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#each levels as r (r.id)}
				{@render chip(r, false)}
			{/each}
			{#if allPeers.length}
				<button
					type="button"
					class="{chipBase} {chipOff} border border-dashed border-gray-400 dark:border-gray-500"
					aria-expanded={peersOpen}
					aria-controls="{uid}-peers"
					on:click={() => (peersOpen = !peersOpen)}
				>
					<span>{context?.peersTitle}</span>
					<span class="text-xs text-gray-600 dark:text-gray-400">({allPeers.length})</span>
					<span class="transition-transform {peersOpen ? 'rotate-180' : ''}">{@render icon('chevron')}</span>
				</button>
			{/if}
			{#if searchable}
				{@render searchBox()}
			{/if}
		</div>
		{#if peersOpen && allPeers.length}
			<div
				id="{uid}-peers"
				class="space-y-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
			>
				{#if allPeers.length > 12}
				<div class="flex flex-wrap items-center gap-2">
						<input
							type="search"
							class="{inputBase} sm:w-48"
							placeholder="Filtern…"
							aria-label="{context?.peersTitle} filtern"
							bind:value={peerFilter}
						/>
				</div>
				{/if}
				<div class="max-h-64 space-y-3 overflow-y-auto pr-1">
				{#each filteredPeerGroups as g (g.label)}
					<div role="group" aria-labelledby="{uid}-g-{g.label}">
						<div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
							<h4
								id="{uid}-g-{g.label}"
								class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
							>
								{g.label}
							</h4>
							{@render rankButton(peerGroups.find((p) => p.label === g.label) ?? g)}
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each g.regions as r (r.id)}
								{@render chip(r, false)}
							{/each}
						</div>
					</div>
				{:else}
					<p class="text-sm text-gray-600 dark:text-gray-400">Keine Treffer</p>
				{/each}
				</div>
			</div>
		{/if}
		{@render maxNote()}
	</div>
{:else}
	<!-- ============================ Variant B: menu ============================ -->
	<div class="relative inline-block">
		<button
			bind:this={menuButton}
			type="button"
			class="{chipBase} {chipOff}"
			aria-haspopup="dialog"
			aria-expanded={menuOpen}
			aria-controls="{uid}-menu"
			{disabled}
			on:click={() => (menuOpen ? closeMenu() : openMenu())}
		>
			{@render icon('plus')}
			<span>Region vergleichen</span>
			{#if selectedIds.length}
				<span
					class="rounded-full bg-gray-900 px-1.5 text-xs tabular-nums text-white dark:bg-gray-100 dark:text-gray-900"
					>{selectedIds.length}</span
				>
			{/if}
			<span class="transition-transform {menuOpen ? 'rotate-180' : ''}">{@render icon('chevron')}</span>
		</button>

		{#if menuOpen}
			<div
				bind:this={menuEl}
				id="{uid}-menu"
				role="dialog"
				aria-label="Regionen zum Vergleich auswählen"
				tabindex="-1"
				class="absolute left-0 top-full z-30 mt-2 flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
			>
				<div class="border-b border-gray-200 p-3 dark:border-gray-700">
					<input
						bind:this={menuSearch}
						type="search"
						class={inputBase}
						placeholder="Region suchen…"
						aria-label="Regionen suchen und filtern"
						bind:value={query}
					/>
				</div>
				<div class="flex-1 space-y-4 overflow-y-auto p-3">
					{#if filteredLevels.length}
						<fieldset>
							<legend class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
								>Übergeordnete Ebenen</legend
							>
							<div class="flex flex-col gap-1.5">
								{#each filteredLevels as r (r.id)}
									<Checkbox
										label={r.layer_label ? `${r.name} · ${r.layer_label}` : r.name}
										checked={isSelected(r, selected)}
										disabled={disabled || (!isSelected(r, selected) && atMax)}
										on:change={() => toggle(r)}
									/>
								{/each}
							</div>
						</fieldset>
					{/if}
					{#if allPeers.length}
						<div class="space-y-2">
							<p class="text-sm font-medium text-gray-800 dark:text-gray-200">{context?.peersTitle}</p>
							{#each filteredPeerGroups as g (g.label)}
								<fieldset>
									<legend
										class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
										>{g.label}</legend
									>
									<div class="mb-2">
										{@render rankButton(peerGroups.find((p) => p.label === g.label) ?? g)}
									</div>
									<div class="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
										{#each g.regions as r (r.id)}
											<Checkbox
												label={r.name}
												checked={isSelected(r, selected)}
												disabled={disabled || (!isSelected(r, selected) && atMax)}
												on:change={() => toggle(r)}
											/>
										{/each}
									</div>
								</fieldset>
							{/each}
						</div>
					{/if}
					{#if menuExtra.length}
						<fieldset>
							<legend class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
								>Weitere Regionen</legend
							>
							<div class="flex flex-col gap-1.5">
								{#each menuExtra as r (r.id)}
									<Checkbox
										label={r.layer_label ? `${r.name} · ${r.layer_label}` : r.name}
										checked={isSelected(r, selected)}
										disabled={disabled || (!isSelected(r, selected) && atMax)}
										on:change={() => toggle(r)}
									/>
								{/each}
							</div>
						</fieldset>
					{:else if query.trim().length >= 2 && !filteredLevels.length && !filteredPeerGroups.length}
						<p class="text-sm text-gray-600 dark:text-gray-400">
							{searchLoading ? 'Regionen werden geladen…' : 'Keine Region gefunden'}
						</p>
					{/if}
				</div>
				<div
					class="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-700"
				>
					<span class="text-xs tabular-nums text-gray-600 dark:text-gray-400"
						>{selectedIds.length}/{max} Vergleiche{atMax ? ' – Maximum erreicht' : ''}</span
					>
					<button
						type="button"
						class="{chipBase} {chipOn}"
						on:click={() => closeMenu()}>Fertig</button
					>
				</div>
			</div>
		{/if}
	</div>
{/if}

{#if mode === 'compare'}
	<div class="sr-only" aria-live="polite">{announcement}</div>
{/if}
