<!-- $lib/components/charts/custom/renewableShareRegions/index.svelte
	Deliberately basic ranked bar list (no horizontal bar primitive yet):
	reference rows (the region itself and its parents) on top, members below. -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { formatPercent } from '$lib/utils/formatters';
	import { fetchChartData, type ShareRow } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// The region itself: dark green + bold; regions it belongs to: gray; its members: green
	const barClass = {
		self: 'bg-green-800 dark:bg-green-400',
		parent: 'bg-gray-500 dark:bg-gray-400',
		member: 'bg-green-600'
	};

	let data: ShareRow[] = [];
	let loading = true;
	let error: string | null = null;

	$: references = data.filter((d) => d.kind !== 'member');
	$: members = data.filter((d) => d.kind === 'member');
	$: max = Math.max(100, ...data.map((d) => d.share));
	$: width = (v: number) => `${(Math.max(v, 0) / max) * 100}%`;

	async function load(id: string | undefined) {
		loading = true;
		error = null;
		try {
			const result = id
				? await fetchChartData({ fetch, regionId: id, parentIds: [], lang: 'de', translations: {} })
				: null;
			data = (result?.raw as ShareRow[]) ?? [];
			onChartData?.(result);
		} catch (e) {
			console.error('[renewableShareRegions]', e);
			error = 'Fehler beim Laden der Daten';
			data = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	$: load(region?.id);
</script>

{#snippet bar(row: ShareRow)}
	<li
		class="grid grid-cols-[minmax(0,11rem)_1fr_4rem] items-center gap-2 text-sm {row.kind === 'self'
			? 'font-semibold'
			: ''}"
	>
		<span class="truncate" title={row.name}>
			{row.name}{row.computed ? '*' : ''}
		</span>
		<span class="relative h-4 bg-gray-100 dark:bg-gray-800 rounded-sm">
			<span
				class="absolute inset-y-0 left-0 rounded-sm {barClass[row.kind]}"
				style:width={width(row.share)}
			></span>
			<span
				class="absolute inset-y-[-2px] w-px bg-gray-900 dark:bg-white"
				style:left={width(100)}
				aria-hidden="true"
			></span>
		</span>
		<span class="text-right tabular-nums">
			{formatPercent(row.share, 1)}
		</span>
	</li>
{/snippet}

{#if loading}
	<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data.length}
	<div class="h-[300px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
{:else}
	<ul class="space-y-1" aria-label="Anteil erneuerbarer Strom am Stromverbrauch">
		{#each references as row (row.id)}{@render bar(row)}{/each}
	</ul>
	{#if members.length}
		<ul class="space-y-1 mt-3 pt-3 border-t border-current/10" aria-label="Rangfolge">
			{#each members as row (row.id)}{@render bar(row)}{/each}
		</ul>
	{/if}
	<p class="mt-3 text-xs text-gray-600 dark:text-gray-400">
		Senkrechter Strich: 100&nbsp;%.{#if references.some((r) => r.computed)}
			* aus den Kreisen berechnet, gewichtet mit dem Stromverbrauch.{/if}
	</p>
{/if}
