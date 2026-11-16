<!-- $lib/components/charts/custom/renewableShareRegions/index.svelte
	Deliberately basic ranked bar list (no horizontal bar primitive yet): the label sits on
	the bar, the value right after it. Reference rows (the region itself and its parents)
	on top, members below. -->
<script lang="ts">
	import { page } from '$app/state';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { formatPercent } from '$lib/utils/formatters';
	import { t } from '$lib/utils/t';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import { RadioGroup } from '$lib/components/ui';
	import Beeswarm from './Beeswarm.svelte';
	import { fetchChartData, type ShareRow } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Ranking: the three highest members (green), the region itself (bold) and its parents (gray),
	// the three lowest members (purple, ColorBrewer Purples – not in the Tailwind theme)
	const barClass = {
		top: 'bg-green-400 dark:bg-green-800',
		self: 'bg-gray-400 dark:bg-gray-500',
		parent: 'bg-gray-300 dark:bg-gray-600',
		bottom: 'bg-[#BCBDDC] dark:bg-[#54278F]'
	};
	type BarStyle = keyof typeof barClass;
	const SHOWN = 3;

	let data: ShareRow[] = [];
	let loading = true;
	let error: string | null = null;
	let view: 'ranking' | 'distribution' = 'ranking';

	$: translations = page.data.translations;
	$: ready = !loading && !error && data.length > 0;
	$: references = data.filter((d) => d.kind !== 'member');
	$: members = data.filter((d) => d.kind === 'member');
	// The region's own value is the average its members are compared with (only shown with members)
	$: average = members.length ? references.find((d) => d.kind === 'self') : undefined;
	// members are sorted by share, highest first; small sets are split without overlap
	$: top = members.slice(0, SHOWN);
	$: bottom = members.slice(Math.max(SHOWN, members.length - SHOWN));
	$: hidden = members.length - top.length - bottom.length;
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
	<li class="relative flex items-center h-6 text-sm {row.kind === 'self' ? 'font-semibold' : ''}">
		<span
			class="absolute inset-y-0 left-0 rounded-sm {barClass[style]}"
			style:width={width(row.share)}
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
{:else if members.length > 1}
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
	</ChartSettings>
{/if}

{#if !ready}
	<!-- loading / error / empty: shown above -->
{:else if view === 'distribution' && members.length > 1}
	<Beeswarm
		{members}
		{average}
		label={t(translations, 'domain.energy.renewableShareOfConsumption')}
		populationLabel={translations?.['table.population'] ?? 'Einwohner'}
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
	<div class="relative">
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
			{#each references as row (row.id)}{@render bar(row, row.kind === 'self' ? 'self' : 'parent')}{/each}
		</ul>
		{#if bottom.length}
			<ul class="space-y-0.5 mt-2 pt-2 border-t border-current/10" aria-label="Niedrigste Anteile">
				{#each bottom as row, i (row.id)}{@render bar(
						row,
						'bottom',
						members.length - bottom.length + i + 1
					)}{/each}
			</ul>
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
	{#if hidden > 0}
		<p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
			{top.length} höchste und {bottom.length} niedrigste von {members.length} Kreisen; alle in der
			Verteilung und in der Tabelle.
		</p>
	{/if}
	{#if references.some((r) => r.computed)}
		<p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
			* {t(translations, 'domain.energy.computedFromMembers')}
		</p>
	{/if}
{/if}
