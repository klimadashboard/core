<!-- $lib/components/charts/custom/renewableShareRegions/index.svelte
	Map in the Card's "Karte" tab (opened first, via <ChartMap default>): the compared districts as
	a choropleth (ShareMap.svelte). Two views in the "Grafik" tab:
	- Ranking: deliberately basic ranked bar list (no horizontal bar primitive yet), the label on
	  the bar, the value right after it. Highest three, reference rows (the region itself and its
	  parents), lowest three; a button folds out the full ranking (inner scroll for long lists),
	  with the reference rows placed by their value.
	- Verteilung: every district as a dot on the share axis (Beeswarm.svelte), one emphasised.
	Regions with members (Metropolregion, state) compare those; districts and municipalities
	compare their district with the other districts of the state ('peer' rows). -->
<script lang="ts">
	import { page } from '$app/state';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { formatPercent } from '$lib/utils/formatters';
	import { t } from '$lib/utils/t';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import ChartMap from '$lib/components/charts/ChartMap.svelte';
	import { tick } from 'svelte';
	import { Button, RadioGroup, Select } from '$lib/components/ui';
	import Beeswarm from './Beeswarm.svelte';
	import ShareMap from './ShareMap.svelte';
	import { grow } from '$lib/components/charts/primitives/motion';
	import { fetchChartData, type ShareRow } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Ranking: the three highest members (green), the region itself (bold) and its parents (gray),
	// the three lowest members (purple, ColorBrewer Purples – not in the Tailwind theme); in the
	// folded-out list the ones in between light blue
	const barClass = {
		top: 'bg-green-400 dark:bg-green-800',
		self: 'bg-gray-400 dark:bg-gray-500',
		parent: 'bg-gray-300 dark:bg-gray-600',
		bottom: 'bg-[#BCBDDC] dark:bg-[#54278F]',
		mid: 'bg-blue-200 dark:bg-blue-900'
	};
	type BarStyle = keyof typeof barClass;
	const SHOWN = 3;

	let data: ShareRow[] = [];
	let loading = true;
	let error: string | null = null;
	let view: 'ranking' | 'distribution' = 'ranking';
	/** full ranking folded out */
	let expanded = false;
	let scroller: HTMLElement;
	let peerGroup: string | null = null;
	/** district emphasised in the map and distribution views */
	let selected = '';

	$: translations = page.data.translations;
	$: ready = !loading && !error && data.length > 0;
	$: references = data.filter((d) => d.kind === 'self' || d.kind === 'parent');
	$: members = data.filter((d) => d.kind === 'member');
	$: peers = data.filter((d) => d.kind === 'peer');
	// The districts that are ranked: the region's members, or else its state's districts
	$: pool = members.length ? members : peers;
	$: focus = peers.find((d) => d.focus);
	$: rankOf = (row: ShareRow) => (peers.length ? pool.findIndex((d) => d.id === row.id) + 1 : 0);
	// The region's own value is the average its members are compared with (only shown with members)
	$: average = members.length ? references.find((d) => d.kind === 'self') : undefined;
	// pool is sorted by share, highest first; small sets are split without overlap
	$: top = pool.slice(0, SHOWN);
	$: bottom = pool.slice(Math.max(SHOWN, pool.length - SHOWN));
	$: hidden = pool.length - top.length - bottom.length;
	$: groupText = peerGroup ? ` in ${peerGroup}` : '';
	$: listId = `renewable-share-ranking-${region?.id ?? 'all'}`;
	// Full ranking: every ranked district plus the reference rows that aren't one, by value
	$: fullList = [...pool, ...references.filter((r) => !pool.some((p) => p.id === r.id))].sort(
		(a, b) => b.share - a.share
	);
	function fullStyle(row: ShareRow): BarStyle {
		if (row.kind === 'self' || row.id === focus?.id) return 'self';
		if (row.kind === 'parent') return 'parent';
		const rank = pool.indexOf(row) + 1;
		return rank <= SHOWN ? 'top' : rank > pool.length - SHOWN ? 'bottom' : 'mid';
	}

	// Folding out: centre the region's own row (its district, or the region's average) in the list
	async function toggle() {
		expanded = !expanded;
		if (!expanded) return;
		await tick();
		const row = scroller?.querySelector<HTMLElement>('[data-own]');
		if (row) scroller.scrollTop = row.offsetTop - scroller.clientHeight / 2 + row.offsetHeight / 2;
	}
	// Distribution: lines for the references, except the one that is a dot (the focus district)
	$: lines = references.filter((d) => d.id !== focus?.id);
	$: selectOptions = [
		{ value: '', label: 'Kreis hervorheben …' },
		...[...pool]
			.sort((a, b) => a.name.localeCompare(b.name, 'de'))
			.map((d) => ({ value: d.id, label: d.name }))
	];
	$: max = Math.max(100, ...data.map((d) => d.share));
	// Bars use the row width minus room for the value after the longest bar
	$: width = (v: number) => `calc((100% - 3.5rem) * ${Math.max(v, 0) / max})`;

	async function load(id: string | undefined) {
		loading = true;
		error = null;
		try {
			const result = id
				? await fetchChartData({
						fetch,
						regionId: id,
						parentIds: [],
						lang: page.params.lang ?? 'de',
						translations
					})
				: null;
			data = (result?.raw as ShareRow[]) ?? [];
			peerGroup = (result?.placeholders.peerGroup as string | null) ?? null;
			selected = data.find((d) => d.focus)?.id ?? '';
			onChartData?.(result);
		} catch (e) {
			console.error('[renewableShareRegions]', e);
			error = t(translations, 'status.errorLoadingData');
			data = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	$: load(region?.id);
</script>

{#snippet bar(row: ShareRow, style: BarStyle, rank?: number)}
	<li
		class="relative flex items-center h-6 text-sm {style === 'self' ? 'font-semibold' : ''}"
		data-own={style === 'self' ? '' : undefined}
	>
		<span
			class="absolute inset-y-0 left-0 rounded-sm origin-left {barClass[style]}"
			style:width={width(row.share)}
			in:grow|global={{ axis: 'x' }}
		></span>
		<span
			class="relative truncate px-1.5 max-w-[calc(100%-3.5rem)]"
			style:min-width={width(row.share)}
			title={row.name}
		>
			{#if rank}<span class="tabular-nums">{rank}.</span>{/if}
			{row.name}{row.computed ? '*' : ''}
		</span>
		<span class="relative pl-1 tabular-nums">{formatPercent(row.share, 1)}</span>
	</li>
{/snippet}

{#if loading}
	<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data.length}
	<div class="h-[300px] flex items-center justify-center text-gray-500">
		{t(translations, 'status.noDataAvailable')}
	</div>
{:else if pool.length > 1}
	<ChartSettings>
		<RadioGroup
			label="Ansicht"
			hideLabel
			bind:value={view}
			options={[
				{ value: 'ranking', label: 'Ranking' },
				{ value: 'distribution', label: 'Verteilung' }
			]}
		/>
		{#if view === 'distribution'}
			<Select
				label="Kreis hervorheben"
				hideLabel
				small
				bind:value={selected}
				options={selectOptions}
			/>
		{/if}
	</ChartSettings>
{/if}

{#if !ready}
	<!-- loading / error / empty: shown above -->
{:else if view === 'distribution' && pool.length > 1}
	<Beeswarm
		rows={pool}
		{lines}
		bind:selected
		label={t(translations, 'domain.energy.renewableShareOfConsumption') + groupText}
	/>
{:else}
	<!-- Line labels: the average label ends at its line when left of the 100 % mark (no overlap) -->
	<div class="relative h-4 mb-1 text-xs text-gray-600 dark:text-gray-400" aria-hidden="true">
		{#if average}
			<span
				class="absolute whitespace-nowrap {average.share < 100 ? '-translate-x-full pr-1' : 'pl-1'}"
				style:left={width(average.share)}>Ø {average.name}</span
			>
		{/if}
		<span class="absolute -translate-x-1/2 whitespace-nowrap" style:left={width(100)}>
			{formatPercent(100, 0)}
		</span>
	</div>
	<!-- Folded out, long lists scroll inside (scrollable regions are keyboard-focusable) -->
	<div
		id={listId}
		bind:this={scroller}
		class={expanded ? 'max-h-[28rem] overflow-y-auto overscroll-contain' : ''}
	>
		<div class="relative">
			{#if expanded}
				<ol
					class="space-y-0.5"
					aria-label="{t(translations, 'domain.energy.renewableShareOfConsumption')}{groupText}"
				>
					{#each fullList as row (row.id)}{@render bar(
							row,
							fullStyle(row),
							pool.includes(row) ? pool.indexOf(row) + 1 : undefined
						)}{/each}
				</ol>
			{:else}
				<!-- Highest three members, the region and its parents, lowest three members -->
				{#if top.length}
					<ul class="space-y-0.5 mb-2 pb-2 border-b border-current/10" aria-label="Höchste Anteile">
						{#each top as row, i (row.id)}{@render bar(row, 'top', i + 1)}{/each}
					</ul>
				{/if}
				<ul
					class="space-y-0.5"
					aria-label={t(translations, 'domain.energy.renewableShareOfConsumption')}
				>
					{#each references as row (row.id)}{@render bar(
							row,
							row.kind === 'self' || row.id === focus?.id ? 'self' : 'parent',
							rankOf(row) || undefined
						)}{/each}
				</ul>
				{#if bottom.length}
					<ul
						class="space-y-0.5 mt-2 pt-2 border-t border-current/10"
						aria-label="Niedrigste Anteile"
					>
						{#each bottom as row, i (row.id)}{@render bar(
								row,
								'bottom',
								pool.length - bottom.length + i + 1
							)}{/each}
					</ul>
				{/if}
			{/if}
			<!-- One continuous line each: the region's average (solid) and 100 % (dashed) -->
			<div class="absolute inset-0 pointer-events-none" aria-hidden="true">
				{#if average}
					<div
						class="absolute inset-y-0 border-l border-gray-700 dark:border-gray-200"
						style:left={width(average.share)}
					></div>
				{/if}
				<div
					class="absolute inset-y-0 border-l border-dashed border-gray-500 dark:border-gray-400"
					style:left={width(100)}
				></div>
			</div>
		</div>
	</div>
	{#if hidden > 0}
		<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
			<Button
				size="sm"
				aria-expanded={expanded}
				aria-controls={listId}
				on:click={toggle}
			>
				{expanded ? 'Weniger anzeigen' : `Alle ${pool.length} Kreise anzeigen`}
			</Button>
			{#if !expanded}
				<span class="text-xs text-gray-600 dark:text-gray-400">
					{top.length} höchste und {bottom.length} niedrigste von {pool.length} Kreisen{groupText}
				</span>
			{/if}
		</div>
	{/if}
	{#if references.some((r) => r.computed)}
		<p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
			* {t(translations, 'domain.energy.computedFromMembers')}
		</p>
	{/if}
{/if}

{#if ready && pool.length > 1}
	<ChartMap default>
		<div class="mb-3 max-w-xs">
			<Select label="Kreis hervorheben" hideLabel small bind:value={selected} options={selectOptions} />
		</div>
		<ShareMap
			rows={pool}
			bind:selected
			{region}
			label={t(translations, 'domain.energy.renewableShareOfConsumption') + groupText}
		/>
	</ChartMap>
{/if}
