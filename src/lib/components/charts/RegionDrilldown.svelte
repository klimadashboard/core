<!--
	RegionDrilldown — switch a chart to any region inside the card's region
	(Metropolregion → Kreise → Gemeinden, Kreis → Gemeinden), optionally with a
	"＋ Vergleich" toggle per row for charts that draw comparison lines.

	Only renders when the region has something to drill into (see regionTree.ts).

	Usage:
		<RegionDrilldown
			{region}
			activeId={activeRegion?.id}
			onSelect={(r) => (switchedId = r.id)}
			compareIds={ids}
			onToggleCompare={(r) => toggle(r)}
		/>
-->
<script lang="ts">
	import { tick } from 'svelte';
	import type { Region } from '$lib/utils/getRegion';
	import { getRegionContext, type ContextRegion } from '$lib/utils/regionContext';
	import { getRegionTree, type RegionTree, type RegionTreeNode } from '$lib/utils/regionTree';
	import { getRegions } from '$lib/utils/regions';

	let {
		region,
		activeId = null,
		onSelect,
		compareIds = [],
		onToggleCompare = null,
		compareMax = Infinity,
		compareHint = 'als Vergleichslinie in „Kumulativ“'
	}: {
		/** The card's region: the root of the tree */
		region: Region | null;
		/** Region the chart currently shows (defaults to the root) */
		activeId?: string | null;
		onSelect: (r: ContextRegion) => void;
		compareIds?: string[];
		/** Set to enable the compare toggles */
		onToggleCompare?: ((r: ContextRegion) => void) | null;
		compareMax?: number;
		compareHint?: string;
	} = $props();

	const uid = Math.random().toString(36).slice(2, 8);

	let tree = $state<RegionTree | null>(null);
	let loadedFor: string | null = null;
	$effect(() => {
		const id = region?.id ?? null;
		if (id === loadedFor) return;
		loadedFor = id;
		tree = null;
		getRegionTree(region).then((t) => {
			if (loadedFor === id) tree = t;
		});
	});

	let open = $state(false);
	let query = $state('');
	let expanded = $state<Set<string>>(new Set());
	let buttonEl: HTMLButtonElement | undefined = $state();
	let panelEl: HTMLDivElement | undefined = $state();
	let searchEl: HTMLInputElement | undefined = $state();
	let listEl: HTMLDivElement | undefined = $state();
	// The card clips overflow, so the panel is positioned fixed against the viewport
	let pos = $state({ top: 0, left: 0, maxHeight: 416, up: false });

	function place() {
		if (!buttonEl) return;
		const r = buttonEl.getBoundingClientRect();
		const below = window.innerHeight - r.bottom - 12;
		const above = r.top - 12;
		const up = below < 260 && above > below;
		const maxHeight = Math.min(416, up ? above : below);
		const width = Math.min(416, window.innerWidth - 32);
		pos = {
			top: up ? r.top - 6 : r.bottom + 6,
			left: Math.max(16, Math.min(r.left, window.innerWidth - width - 16)),
			maxHeight,
			up
		};
	}

	// Larger regions around the shown one (Kreis → Metropolregion → Bundesland → Land), compare only
	const q = $derived(query.trim().toLowerCase());
	let levels = $state<ContextRegion[]>([]);
	let levelsFor: string | null = null;
	$effect(() => {
		const id = activeId ?? region?.id ?? null;
		if (!onToggleCompare || id === levelsFor) return;
		levelsFor = id;
		getRegionContext(id ? { id } : null).then((c) => {
			if (levelsFor === id) levels = c?.levels ?? [];
		});
	});

	const currentId = $derived(activeId ?? tree?.root.id ?? region?.id ?? null);
	const allNodes = $derived(tree ? tree.groups.flatMap((g) => g.nodes) : []);
	const current = $derived.by(() => {
		if (!tree || !currentId) return null;
		if (tree.root.id === currentId) return tree.root;
		for (const n of allNodes) {
			if (n.region.id === currentId) return n.region;
			const c = n.children.find((r) => r.id === currentId);
			if (c) return c;
		}
		return null;
	});
	const currentParent = $derived(
		allNodes.find((n) => n.children.some((c) => c.id === currentId))?.region ?? null
	);
	const gemeindenCount = $derived(allNodes.reduce((s, n) => s + n.children.length, 0));
	const compareSet = $derived(new Set(compareIds));
	const atMax = $derived(compareIds.length >= compareMax);
	const hasTree = $derived(!!tree && tree.groups.length > 0);

	// Free search over all regions (compare only): anything outside the tree and the levels
	let pool = $state<ContextRegion[]>([]);
	let poolLoading = $state(false);
	async function ensurePool() {
		if (!onToggleCompare || pool.length || poolLoading) return;
		poolLoading = true;
		try {
			pool = ((await getRegions()) ?? []) as ContextRegion[];
		} finally {
			poolLoading = false;
		}
	}
	const listedIds = $derived.by(() => {
		const ids = new Set<string>(levels.map((l) => l.id));
		if (currentId) ids.add(currentId);
		if (tree) {
			ids.add(tree.root.id);
			for (const n of allNodes) {
				ids.add(n.region.id);
				for (const c of n.children) ids.add(c.id);
			}
		}
		return ids;
	});
	const moreResults = $derived.by(() => {
		if (!onToggleCompare || q.length < 2) return [];
		return pool
			.filter((r) => !listedIds.has(r.id) && r.name.toLowerCase().includes(q))
			.sort((a, b) => {
				const pa = a.name.toLowerCase().startsWith(q) ? 0 : 1;
				const pb = b.name.toLowerCase().startsWith(q) ? 0 : 1;
				return pa - pb || a.name.localeCompare(b.name, 'de');
			})
			.slice(0, 15);
	});
	// Comparisons picked via the search: listed without a query, so they can be removed again
	const pickedElsewhere = $derived(
		compareIds
			.filter((id) => !listedIds.has(id))
			.map((id) => pool.find((r) => r.id === id))
			.filter((r): r is ContextRegion => !!r)
	);
	// The root has its own row in the tree
	const visibleLevels = $derived(
		levels.filter((l) => l.id !== tree?.root.id && (!q || l.name.toLowerCase().includes(q)))
	);

	// Search: a Kreis shows if it or one of its Gemeinden matches; matching Gemeinden show expanded
	const visibleGroups = $derived.by(() => {
		if (!tree) return [];
		return tree.groups
			.map((g) => ({
				label: g.label,
				nodes: g.nodes
					.map((n) => {
						if (!q) return { node: n, children: n.children, forceOpen: false };
						const selfHit = n.region.name.toLowerCase().includes(q);
						const kids = n.children.filter((c) => c.name.toLowerCase().includes(q));
						if (!selfHit && !kids.length) return null;
						return { node: n, children: selfHit && !kids.length ? n.children : kids, forceOpen: kids.length > 0 };
					})
					.filter((x): x is { node: RegionTreeNode; children: ContextRegion[]; forceOpen: boolean } => !!x)
			}))
			.filter((g) => g.nodes.length);
	});
	const resultCount = $derived(
		visibleGroups.reduce((s, g) => s + g.nodes.reduce((t, n) => t + 1 + (n.forceOpen ? n.children.length : 0), 0), 0) +
			visibleLevels.length +
			moreResults.length
	);

	async function openPanel() {
		open = true;
		// Show where the current region sits
		if (currentParent) expanded = new Set([...expanded, currentParent.id]);
		place();
		ensurePool();
		await tick();
		searchEl?.focus({ preventScroll: true });
		// Scroll the list (not the page) to the current region
		const cur = listEl?.querySelector<HTMLElement>('[aria-current="true"]');
		if (cur && listEl) listEl.scrollTop = cur.offsetTop - listEl.clientHeight / 2;
	}
	function closePanel(returnFocus = true) {
		open = false;
		query = '';
		if (returnFocus) buttonEl?.focus();
	}
	function pick(r: ContextRegion) {
		onSelect(r);
		closePanel();
	}
	function toggleExpand(id: string) {
		const next = new Set(expanded);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expanded = next;
	}

	function onWindowPointer(e: PointerEvent) {
		if (!open) return;
		const t = e.target as Node;
		if (panelEl?.contains(t) || buttonEl?.contains(t)) return;
		closePanel(false);
	}
	function onPanelKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			closePanel();
			return;
		}
		// Up/Down move between the region buttons (search field included)
		if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
		const items = [searchEl, ...(panelEl?.querySelectorAll<HTMLElement>('[data-pick]') ?? [])].filter(
			Boolean
		) as HTMLElement[];
		const i = items.indexOf(document.activeElement as HTMLElement);
		const next = items[Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
		if (next) {
			e.preventDefault();
			next.focus();
		}
	}

	const rowBase =
		'flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500';
	const iconBtn =
		'flex h-7 w-7 shrink-0 items-center justify-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40';
</script>

<svelte:window
	onpointerdown={onWindowPointer}
	onresize={() => open && place()}
	onscrollcapture={(e) => {
		// Follow the button when the page scrolls, ignore scrolling inside the panel
		if (open && !panelEl?.contains(e.target as Node)) place();
	}}
/>

{#snippet icon(kind: 'pin' | 'chevron' | 'plus' | 'check' | 'search')}
	<svg
		aria-hidden="true"
		class="h-4 w-4 shrink-0"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{#if kind === 'pin'}<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle
				cx="12"
				cy="9.5"
				r="2.5"
			/>
		{:else if kind === 'chevron'}<path d="m6 9 6 6 6-6" />
		{:else if kind === 'plus'}<path d="M12 5v14M5 12h14" />
		{:else if kind === 'check'}<path d="M20 6 9 17l-5-5" />
		{:else}<circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />{/if}
	</svg>
{/snippet}

{#snippet compareToggle(r: ContextRegion)}
	{#if onToggleCompare}
		{@const on = compareSet.has(r.id)}
		{#if r.id !== currentId}
			<button
				type="button"
				class="{iconBtn} {on ? 'bg-gray-900 text-white hover:bg-gray-700 hover:text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white dark:hover:text-gray-900' : ''}"
				aria-pressed={on}
				aria-label="{r.name} {on ? 'aus dem Vergleich entfernen' : 'vergleichen'}"
				title={on ? 'Aus dem Vergleich entfernen' : `Vergleichen (${compareHint})`}
				disabled={!on && atMax}
				onclick={() => onToggleCompare?.(r)}
			>
				{@render icon(on ? 'check' : 'plus')}
			</button>
		{:else}
			<span class="h-7 w-7 shrink-0" aria-hidden="true"></span>
		{/if}
	{/if}
{/snippet}

{#snippet levelRow(r: ContextRegion)}
	{@const on = compareSet.has(r.id)}
	<button
		type="button"
		data-pick
		class="{rowBase} text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/60"
		aria-pressed={on}
		disabled={!on && atMax}
		onclick={() => onToggleCompare?.(r)}
	>
		<span
			class="flex h-5 w-5 shrink-0 items-center justify-center rounded {on
				? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
				: 'text-gray-500 dark:text-gray-400'}">{@render icon(on ? 'check' : 'plus')}</span
		>
		<span class="truncate">{r.name}</span>
		{#if r.layer_label}<span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">{r.layer_label}</span>{/if}
	</button>
{/snippet}

{#snippet row(r: ContextRegion, sub: string | null, indent: boolean)}
	{@const isCurrent = r.id === currentId}
	<div class="flex items-center gap-1 {indent ? 'pl-9' : ''}">
		<button
			type="button"
			data-pick
			class="{rowBase} {isCurrent
				? 'bg-gray-100 font-semibold text-gray-900 dark:bg-gray-800 dark:text-white'
				: 'text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/60'}"
			aria-current={isCurrent ? 'true' : undefined}
			onclick={() => pick(r)}
		>
			<span class="truncate">{r.name}</span>
			{#if sub}<span class="shrink-0 text-xs font-normal text-gray-500 dark:text-gray-400">{sub}</span>{/if}
			{#if isCurrent}<span class="ml-auto text-gray-900 dark:text-white">{@render icon('check')}</span>{/if}
		</button>
		{@render compareToggle(r)}
	</div>
{/snippet}

{#if hasTree || (onToggleCompare && levels.length)}
	<div class="relative">
		<button
			bind:this={buttonEl}
			type="button"
			class="inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white py-1.5 pr-2.5 pl-3 text-sm text-gray-900 shadow-xs transition-colors hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-500"
			aria-haspopup="dialog"
			aria-expanded={open}
			aria-controls="{uid}-panel"
			onclick={() => (open ? closePanel() : openPanel())}
		>
			<span class="text-gray-500 dark:text-gray-400">{@render icon('pin')}</span>
			<span class="truncate font-semibold">{current?.name ?? region?.name}</span>
			{#if !tree}
				<span class="hidden text-xs text-gray-500 sm:inline dark:text-gray-400">vergleichen</span>
			{:else if current && current.id !== tree.root.id}
				<span class="hidden truncate text-xs text-gray-500 sm:inline dark:text-gray-400">
					{currentParent ? `in ${currentParent.name}` : (current.layer_label ?? '')}
				</span>
			{:else}
				<span class="hidden text-xs text-gray-500 sm:inline dark:text-gray-400">
					gesamt · {allNodes.length} Kreise{gemeindenCount ? ` · ${gemeindenCount} Gemeinden` : ''}
				</span>
			{/if}
			<span class="ml-0.5 text-gray-500 transition-transform dark:text-gray-400 {open ? 'rotate-180' : ''}"
				>{@render icon('chevron')}</span
			>
		</button>

		{#if open}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				bind:this={panelEl}
				id="{uid}-panel"
				role="dialog"
				aria-label="Region wählen"
				tabindex="-1"
				class="fixed z-50 flex w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
				style="left: {pos.left}px; top: {pos.top}px; max-height: {pos.maxHeight}px; {pos.up
					? 'transform: translateY(-100%);'
					: ''}"
				onkeydown={onPanelKey}
			>
				<div class="border-b border-gray-200 p-2 dark:border-gray-700">
					<label class="relative block">
						<span class="sr-only">{hasTree ? 'Kreis oder Gemeinde suchen' : 'Region suchen'}</span>
						<span class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400"
							>{@render icon('search')}</span
						>
						<input
							bind:this={searchEl}
							bind:value={query}
							type="search"
							placeholder={hasTree
								? onToggleCompare
									? 'Kreis, Gemeinde oder andere Region suchen…'
									: 'Kreis oder Gemeinde suchen…'
								: 'Region suchen…'}
							class="w-full rounded-lg border border-gray-300 bg-white py-1.5 pr-3 pl-8 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
						/>
					</label>
					{#if onToggleCompare && hasTree}
						<p class="mt-1.5 flex items-center gap-1 px-0.5 text-xs text-gray-600 dark:text-gray-400">
							Name wählt die Region · <span class="inline-flex">{@render icon('plus')}</span> fügt sie {compareHint}
							hinzu
						</p>
					{/if}
				</div>

				<div bind:this={listEl} class="relative overflow-y-auto p-1.5">
					{#if tree && !q}
						{@render row(tree.root, 'gesamt', false)}
					{/if}
					{#if onToggleCompare && visibleLevels.length}
						<p
							class="mt-2 mb-0.5 px-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
						>
							Vergleichen mit
						</p>
						<ul class="space-y-0.5">
							{#each visibleLevels as l (l.id)}
								<li>{@render levelRow(l)}</li>
							{/each}
						</ul>
					{/if}
					{#if !q && pickedElsewhere.length}
						<p
							class="mt-2 mb-0.5 px-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
						>
							Im Vergleich
						</p>
						<ul class="space-y-0.5">
							{#each pickedElsewhere as r (r.id)}
								<li>{@render levelRow(r)}</li>
							{/each}
						</ul>
					{/if}
					{#each visibleGroups as g (g.label)}
						<p
							class="mt-2 mb-0.5 px-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
						>
							{g.label}
						</p>
						<ul class="space-y-0.5">
							{#each g.nodes as { node, children, forceOpen } (node.region.id)}
								{@const isOpen = forceOpen || expanded.has(node.region.id)}
								<li>
									<div class="flex items-center gap-1">
										{#if node.children.length}
											<button
												type="button"
												class={iconBtn}
												aria-expanded={isOpen}
												aria-controls="{uid}-{node.region.id}"
												aria-label="Gemeinden von {node.region.name} {isOpen ? 'ausblenden' : 'anzeigen'}"
												onclick={() => toggleExpand(node.region.id)}
											>
												<span class="transition-transform {isOpen ? '' : '-rotate-90'}">{@render icon('chevron')}</span>
											</button>
										{:else}
											<span class="h-7 w-7 shrink-0" aria-hidden="true"></span>
										{/if}
										<div class="min-w-0 flex-1">
											{@render row(
												node.region,
												node.children.length ? `${node.children.length} Gem.` : null,
												false
											)}
										</div>
									</div>
									{#if isOpen && children.length}
										<ul id="{uid}-{node.region.id}" class="mt-0.5 space-y-0.5">
											{#each children as c (c.id)}
												<li>{@render row(c, null, true)}</li>
											{/each}
										</ul>
									{/if}
								</li>
							{/each}
						</ul>
					{/each}
					{#if moreResults.length}
						<p
							class="mt-2 mb-0.5 px-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
						>
							Weitere Regionen <span class="font-normal normal-case">· zum Vergleichen</span>
						</p>
						<ul class="space-y-0.5">
							{#each moreResults as r (r.id)}
								<li>{@render levelRow(r)}</li>
							{/each}
						</ul>
					{:else if q.length >= 2 && poolLoading}
						<p class="px-2 py-2 text-xs text-gray-600 dark:text-gray-400">Weitere Regionen werden geladen…</p>
					{/if}
					{#if q && !visibleGroups.length && !visibleLevels.length && !moreResults.length && !poolLoading}
						<p class="px-2 py-3 text-sm text-gray-600 dark:text-gray-400">Keine Region gefunden.</p>
					{/if}
				</div>
				<p class="sr-only" aria-live="polite">{q ? `${resultCount} Treffer` : ''}</p>
			</div>
		{/if}
	</div>
{/if}
