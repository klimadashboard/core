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
	import { fetchChartData, type ShareRow } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// The region itself: strong green + bold; regions it belongs to: gray; its members: light green
	const barClass = {
		self: 'bg-green-500 dark:bg-green-700',
		parent: 'bg-gray-300 dark:bg-gray-600',
		member: 'bg-green-300 dark:bg-green-900'
	};

	let data: ShareRow[] = [];
	let loading = true;
	let error: string | null = null;

	$: translations = page.data.translations;
	$: references = data.filter((d) => d.kind !== 'member');
	$: members = data.filter((d) => d.kind === 'member');
	// The region's own value is the average its members are compared with (only shown with members)
	$: average = members.length ? references.find((d) => d.kind === 'self') : undefined;
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

{#snippet bar(row: ShareRow)}
	<li class="relative flex items-center h-6 text-sm {row.kind === 'self' ? 'font-semibold' : ''}">
		<span
			class="absolute inset-y-0 left-0 rounded-sm {barClass[row.kind]}"
			style:width={width(row.share)}
		></span>
		<span
			class="relative truncate px-1.5 max-w-[calc(100%-3.5rem)]"
			style:min-width={width(row.share)}
			title={row.name}
		>
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
		<ul
			class="space-y-0.5"
			aria-label={t(translations, 'domain.energy.renewableShareOfConsumption')}
		>
			{#each references as row (row.id)}{@render bar(row)}{/each}
		</ul>
		{#if members.length}
			<ul
				class="space-y-0.5 mt-2 pt-2 border-t border-current/10"
				aria-label={t(translations, 'ui.regionSwitcher.members')}
			>
				{#each members as row (row.id)}{@render bar(row)}{/each}
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
	{#if references.some((r) => r.computed)}
		<p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
			* {t(translations, 'domain.energy.computedFromMembers')}
		</p>
	{/if}
{/if}
