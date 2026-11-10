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
	import { createEventDispatcher, tick, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { fetchRegion, type Region } from '$lib/utils/getRegion';
	import { getRegions } from '$lib/utils/regions';
	import { isAggregateRegion } from '$lib/utils/regionAggregation';
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
	/** Extra controls at the end of the row (e.g. the unit toggle) */
	export let end: Snippet | undefined = undefined;

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

	// ---------------------------------------------------------------- peers filter
	let peersOpen = false;
	let panelInput: HTMLInputElement;
	let peersButton: HTMLButtonElement;
	$: filteredPeerGroups = filterGroups(peerGroups, query);

	async function togglePanel() {
		peersOpen = !peersOpen;
		if (!peersOpen) return (query = '');
		ensureSearchPool();
		await tick();
		panelInput?.focus();
	}
	function onPanelKey(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		e.preventDefault();
		peersOpen = false;
		query = '';
		peersButton?.focus();
	}

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
		'inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50';
	const chipOff =
		'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700';
	const chipOn =
		'bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white';
	const inputBase =
		'w-full rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400';
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

{#snippet chip(r: ContextRegion, showLayer: boolean, short = false)}
	{@const on = isSelected(r, selected)}
	<!-- A region has one Metropolregion: in the levels row its layer label is enough -->
	{@const label = short && isAggregateRegion(r) && r.layer_label ? r.layer_label : r.name}
	<button
		type="button"
		class="{chipBase} {on ? chipOn : chipOff}"
		aria-pressed={on}
		aria-label={label !== r.name ? r.name : undefined}
		title={label !== r.name ? r.name : undefined}
		disabled={disabled || (!on && atMax)}
		on:click={() => toggle(r)}
	>
		{@render icon(on ? 'check' : 'plus')}
		<span>{label}</span>
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
			class="{chipBase} border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
			{disabled}
			aria-disabled={atMax || !!rankLoading}
			class:opacity-50={atMax}
			aria-busy={rankLoading === g.label}
			on:click={() => addLeaders(g.regions, g.label)}
		>
			{@render icon('star')}
			{rankLoading === g.label ? 'Wird berechnet…' : rankLabel(g)}
		</button>
	{/if}
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
	<div class="space-y-2" role="group" aria-label="Vergleichen mit">
		<div class="flex flex-wrap items-center gap-1.5">
			{#each levels as r (r.id)}
				{@render chip(r, false, true)}
			{/each}
			{#if allPeers.length || searchable}
				<button
					bind:this={peersButton}
					type="button"
					class="{chipBase} {peersOpen ? chipOn : chipOff}"
					aria-expanded={peersOpen}
					aria-controls="{uid}-peers"
					aria-label={allPeers.length
						? `${context?.peersTitle} (${allPeers.length}) und weitere Regionen`
						: 'Weitere Regionen suchen'}
					on:click={togglePanel}
				>
					{@render icon('search')}
					{#if allPeers.length}
						<span>{context?.peersLabel || 'Weitere'}</span>
						<span class="tabular-nums opacity-70">{allPeers.length}</span>
					{:else}
						<span>Suchen</span>
					{/if}
					<span class="transition-transform {peersOpen ? 'rotate-180' : ''}">{@render icon('chevron')}</span>
				</button>
			{/if}
			{#if end}
				<div class="ml-auto">{@render end()}</div>
			{/if}
		</div>
		{#if peersOpen}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				id="{uid}-peers"
				role="region"
				aria-label={context?.peersTitle ?? 'Weitere Regionen'}
				class="space-y-2 rounded-xl border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900"
				on:keydown={onPanelKey}
			>
				<div class="flex items-center gap-2">
					<input
						bind:this={panelInput}
						type="search"
						class={inputBase}
						placeholder={allPeers.length ? `${context?.peersLabel ?? 'Region'} oder andere Region suchen…` : 'Region suchen…'}
						aria-label="Regionen suchen und filtern"
						bind:value={query}
					/>
					<span class="shrink-0 text-xs tabular-nums text-gray-600 dark:text-gray-400"
						>{selectedIds.length}/{max}</span
					>
				</div>
				<div class="max-h-48 space-y-2 overflow-y-auto pr-1">
					{#each filteredPeerGroups as g (g.label)}
						<div role="group" aria-labelledby="{uid}-g-{g.label}">
							<div class="mb-1 flex flex-wrap items-center justify-between gap-2">
								<h4
									id="{uid}-g-{g.label}"
									class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
								>
									{g.label}
								</h4>
								{#if !query}
									{@render rankButton(g)}
								{/if}
							</div>
							<div class="flex flex-wrap gap-1">
								{#each g.regions as r (r.id)}
									{@render chip(r, false)}
								{/each}
							</div>
						</div>
					{/each}
					{#if menuExtra.length}
						<div role="group" aria-labelledby="{uid}-g-extra">
							<h4
								id="{uid}-g-extra"
								class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
							>
								Weitere Regionen
							</h4>
							<div class="flex flex-wrap gap-1">
								{#each menuExtra as r (r.id)}
									{@render chip(r, true)}
								{/each}
							</div>
						</div>
					{:else if query.trim().length >= 2 && !filteredPeerGroups.length}
						<p class="text-xs text-gray-600 dark:text-gray-400">
							{searchLoading ? 'Regionen werden geladen…' : 'Keine Region gefunden'}
						</p>
					{:else if query.trim().length === 1}
						<p class="text-xs text-gray-600 dark:text-gray-400">Für andere Regionen mind. 2 Zeichen eingeben</p>
					{/if}
				</div>
			</div>
		{/if}
		{@render maxNote()}
	</div>
{:else}
	<!-- ============================ Variant B: menu ============================ -->
	<div class="flex flex-wrap items-center gap-2">
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
	{#if end}
		<div class="ml-auto">{@render end()}</div>
	{/if}
	</div>
{/if}

{#if mode === 'compare'}
	<div class="sr-only" aria-live="polite">{announcement}</div>
{/if}
