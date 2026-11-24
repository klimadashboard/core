<!-- $lib/components/charts/custom/renewableShareRegions/index.svelte
	Map in the Card's "Karte" tab (opened first, via <ChartMap default>): the compared districts as
	a choropleth (ShareMap.svelte). The "Grafik" tab shows the ranking: a deliberately basic ranked
	bar list (no horizontal bar primitive yet), the label on the bar, the value right after it.
	Highest three, reference rows (the region itself and its parents), lowest three; a button
	folds out the full ranking (inner scroll for long lists), with the reference rows placed by
	their value.
	Regions with members (Metropolregion, state) compare those; districts and municipalities
	compare their district with the other districts of the state ('peer' rows). -->
<script lang="ts">
	import { page } from '$app/state';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { formatPercent } from '$lib/utils/formatters';
	import { t } from '$lib/utils/t';
	import ChartMap from '$lib/components/charts/ChartMap.svelte';
	import { tick, type Snippet } from 'svelte';
	import { Button, Select } from '$lib/components/ui';
	import ShareMap from './ShareMap.svelte';
	import { grow } from '$lib/components/charts/primitives/motion';
	import { fetchChartData, type ShareRow } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Ranking: every district in one green (position, not colour, says high or low); the region
	// itself (bold, stronger blue) and its parents (lighter blue) as comparison rows
	const barClass = {
		district: 'bg-green-500 dark:bg-green-700',
		self: 'bg-blue-600 dark:bg-blue-500',
		parent: 'bg-blue-400 dark:bg-blue-700'
	};
	type BarStyle = keyof typeof barClass;
	/** Part of a district bar beyond 100 %: the surplus the district produces over its consumption */
	const surplusClass = 'bg-green-700 dark:bg-green-500';
	const SHOWN = 3;
	/**
	 * Districts from 10 % on without decimals, below with one; comparison rows (region, parents)
	 * always with one, matching the headline ("63,1 %")
	 */
	const formatShare = (v: number, style: BarStyle) =>
		formatPercent(v, style === 'district' && Math.abs(v) >= 10 ? 0 : 1);

	// Columns: rank | name | bar with the value after it
	let containerWidth = 0;
	$: columns = containerWidth < 480 ? '1.5rem 8.5rem 1fr' : '1.75rem 16rem 1fr';

	let data: ShareRow[] = [];
	let loading = true;
	let error: string | null = null;
	/** full ranking folded out */
	let expanded = false;
	let scroller: HTMLElement;
	let peerGroup: string | null = null;
	/** district emphasised in the map */
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
	// pool is sorted by share, highest first; small sets are split without overlap
	$: top = pool.slice(0, SHOWN);
	$: bottom = pool.slice(Math.max(SHOWN, pool.length - SHOWN));
	$: hidden = pool.length - top.length - bottom.length;
	// Ranks folded away between the highest and the lowest, e.g. "4–30"
	$: hiddenRanks =
		hidden > 1 ? `${top.length + 1}–${top.length + hidden}` : String(top.length + hidden);
	// Lowest shares are typically cities: much consumption on little land for wind and solar
	$: citiesAtBottom = bottom.some((d) => d.layerLabel === 'Kreisfreie Stadt');
	$: groupText = peerGroup ? ` in ${peerGroup}` : '';
	$: listId = `renewable-share-ranking-${region?.id ?? 'all'}`;
	// Full ranking: every ranked district plus the reference rows that aren't one, by value
	$: fullList = [...pool, ...references.filter((r) => !pool.some((p) => p.id === r.id))].sort(
		(a, b) => b.share - a.share
	);
	function styleOf(row: ShareRow): BarStyle {
		if (row.kind === 'self' || row.id === focus?.id) return 'self';
		return row.kind === 'parent' ? 'parent' : 'district';
	}

	// Folding out: centre the region's own row (its district, or the region's average) in the list
	async function toggle() {
		expanded = !expanded;
		if (!expanded) return;
		await tick();
		const row = scroller?.querySelector<HTMLElement>('[data-own]');
		if (row) scroller.scrollTop = row.offsetTop - scroller.clientHeight / 2 + row.offsetHeight / 2;
	}
	$: selectOptions = [
		{ value: '', label: 'Kreis hervorheben …' },
		...[...pool]
			.sort((a, b) => a.name.localeCompare(b.name, 'de'))
			.map((d) => ({ value: d.id, label: d.name }))
	];
	$: max = Math.max(100, ...data.map((d) => d.share));
	// Bars use the bar column minus room for the value after the longest bar
	$: width = (v: number) => `calc((100% - 3rem) * ${Math.max(v, 0) / max})`;

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

<!-- One row: rank | name | bar with the value right after it (text never sits on a bar) -->
{#snippet bar(row: ShareRow, style: BarStyle, rank?: number)}
	<li
		class="grid h-6 items-center gap-x-2 text-sm {style === 'self' ? 'font-semibold' : ''}"
		style:grid-template-columns={columns}
		data-own={style === 'self' ? '' : undefined}
	>
		<span class="text-right tabular-nums text-gray-500 dark:text-gray-400">{rank ?? ''}</span>
		<span class="truncate" title={row.name}>{row.name}{row.computed ? '*' : ''}</span>
		<span class="flex min-w-0 items-center">
			<!-- Districts above 100 %: the surplus beyond the line in a darker green -->
			{#if style === 'district' && row.share > 100}
				<span
					class="flex h-4 shrink-0 origin-left"
					style:width={width(row.share)}
					in:grow|global={{ axis: 'x' }}
				>
					<span class="rounded-l-sm {barClass.district}" style:width="{(100 / row.share) * 100}%"
					></span>
					<span class="flex-1 rounded-r-sm {surplusClass}"></span>
				</span>
			{:else}
				<span
					class="h-4 shrink-0 rounded-sm origin-left {barClass[style]}"
					style:width={width(row.share)}
					in:grow|global={{ axis: 'x' }}
				></span>
			{/if}
			<span class="pl-1.5 tabular-nums">{formatShare(row.share, style)}</span>
		</span>
	</li>
{/snippet}

<!-- Same columns as the rows; `content` goes into the bar column (labels, the 100 % line) -->
{#snippet barColumn(extraClass: string, content: Snippet)}
	<div class="grid gap-x-2 {extraClass}" style:grid-template-columns={columns} aria-hidden="true">
		<span></span><span></span>
		<div class="relative">{@render content()}</div>
	</div>
{/snippet}

{#if loading}
	<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data.length}
	<div class="h-[300px] flex items-center justify-center text-gray-500">
		{t(translations, 'status.noDataAvailable')}
	</div>
{/if}

{#if ready}
	<div bind:clientWidth={containerWidth}>
		<!-- Label of the 100 % line: above it, the district produces more than it consumes -->
		{#snippet lineLabel()}
			<span
				class="absolute -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400"
				style:left={width(100)}>Erzeugung = Verbrauch</span
			>
		{/snippet}

		<!-- Folded out, long lists scroll inside (scrollable regions are keyboard-focusable);
		     the line label sticks to the top while scrolling -->
		<div
			id={listId}
			bind:this={scroller}
			class={expanded ? 'max-h-[28rem] overflow-y-auto overscroll-contain' : ''}
		>
			{@render barColumn(
				'sticky top-0 z-10 h-5 bg-white pb-1 dark:bg-gray-900',
				lineLabel
			)}
			<div class="relative">
				{#if expanded}
					<ol
						class="space-y-0.5"
						aria-label="{t(translations, 'domain.energy.renewableShareOfConsumption')}{groupText}"
					>
						{#each fullList as row (row.id)}{@render bar(
								row,
								styleOf(row),
								pool.includes(row) ? pool.indexOf(row) + 1 : undefined
							)}{/each}
					</ol>
				{:else}
					<!-- Highest and lowest districts with the gap between them, then the comparison rows -->
					<ol class="space-y-0.5" aria-label="Höchste und niedrigste Anteile{groupText}">
						{#each top as row, i (row.id)}{@render bar(row, styleOf(row), i + 1)}{/each}
						{#if hidden > 0}
							<li class="grid h-6 items-center gap-x-2" style:grid-template-columns={columns}>
								<span class="text-right text-xs tabular-nums text-gray-500 dark:text-gray-400"
									>{hiddenRanks}</span
								>
								<button
									type="button"
									class="col-span-2 justify-self-start text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
									aria-expanded={expanded}
									aria-controls={listId}
									on:click={toggle}
									>··· {hidden} {hidden === 1 ? 'weiterer Kreis' : 'weitere Kreise'}</button
								>
							</li>
						{/if}
						{#each bottom as row, i (row.id)}{@render bar(
								row,
								styleOf(row),
								pool.length - bottom.length + i + 1
							)}{/each}
					</ol>
					<ul
						class="mt-2 space-y-0.5 border-t border-current/10 pt-2"
						aria-label={t(translations, 'domain.energy.renewableShareOfConsumption')}
					>
						{#each references as row (row.id)}{@render bar(
								row,
								styleOf(row),
								rankOf(row) || undefined
							)}{/each}
					</ul>
				{/if}
				<!-- One continuous dashed line at 100 %, in the bar column -->
				{#snippet line()}
					<div
						class="absolute inset-y-0 border-l border-dashed border-gray-500 dark:border-gray-400"
						style:left={width(100)}
					></div>
				{/snippet}
				{@render barColumn('pointer-events-none absolute inset-0', line)}
			</div>
		</div>
	</div>
	<!-- Folded in, the "··· weitere Kreise" row opens the list; this button folds it back -->
	{#if expanded}
		<div class="mt-3">
			<Button size="sm" aria-expanded={expanded} aria-controls={listId} on:click={toggle}>
				Weniger anzeigen
			</Button>
		</div>
	{/if}
	{#if citiesAtBottom}
		<p class="mt-3 text-xs text-gray-600 dark:text-gray-400">
			Kreisfreie Städte verbrauchen viel Strom auf wenig Fläche – ihr Anteil ist daher meist
			gering.
		</p>
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
