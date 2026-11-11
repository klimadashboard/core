<!-- $lib/components/charts/custom/renewablesCapacityRanking/index.svelte
	Ranking of the member regions by installed renewable capacity, stacked by carrier. -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Legend, Tooltip } from '$lib/components/charts/primitives';
	import { Button, RadioGroup, Toggle } from '$lib/components/ui';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import { formatNumber, formatPower } from '$lib/utils/formatters';
	import { buildChartData, carriers, fetchData, type CapacityRow } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	const TOP_N = 10;

	let loading = true;
	let error: string | null = null;
	let rows: CapacityRow[] = [];
	let carrier = 'all';
	let kind = 'all';
	let perArea = false;
	let expanded = false;
	let width = 0;

	let hovered: CapacityRow | null = null;
	let hoverX = 0;
	let hoverY = 0;

	$: load(region);

	async function load(r: Region | null) {
		loading = true;
		error = null;
		try {
			const data = await fetchData(fetch, r);
			rows = data?.rows ?? [];
			onChartData?.(data ? buildChartData(data, r) : null);
		} catch (e) {
			console.error('[renewablesCapacityRanking]', e);
			error = 'Die Daten konnten nicht geladen werden.';
			rows = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Filter by member type (e.g. Landkreis / Kreisfreie Stadt) only if the members differ
	$: kinds = [...new Set(rows.map((r) => r.kind).filter(Boolean))].sort();
	$: hasArea = rows.some((r) => r.area);
	$: shown = carrier === 'all' ? carriers : carriers.filter((c) => c.key === carrier);
	$: kwOf = (r: CapacityRow) => (carrier === 'all' ? r.total : r.kw[carrier]);
	$: valueOf = (r: CapacityRow) => (perArea ? (r.area ? kwOf(r) / r.area : 0) : kwOf(r));
	$: format = (kw: number, r: CapacityRow) =>
		perArea ? `${formatNumber(r.area ? kw / r.area : 0, 1)} kW/km²` : formatPower(kw);
	$: ranked = rows
		.filter((r) => kind === 'all' || r.kind === kind)
		.filter((r) => !perArea || r.area)
		.filter((r) => kwOf(r) > 0)
		.sort((a, b) => valueOf(b) - valueOf(a));
	$: visible = expanded ? ranked : ranked.slice(0, TOP_N);
	$: max = Math.max(1, ...ranked.map(valueOf));
	$: compact = width > 0 && width < 500;

	const describe = (r: CapacityRow) =>
		carriers
			.filter((c) => r.kw[c.key] > 0)
			.map((c) => `${c.label} ${format(r.kw[c.key], r)}`)
			.join(', ');

	function show(e: MouseEvent | FocusEvent, r: CapacityRow) {
		hovered = r;
		if (e instanceof MouseEvent) {
			hoverX = e.clientX;
			hoverY = e.clientY;
		} else {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			hoverX = rect.left + rect.width / 2;
			hoverY = rect.bottom;
		}
	}

	$: tooltipItems = hovered
		? [
				...carriers
					.filter((c) => hovered!.kw[c.key] > 0)
					.map((c) => ({
						label: c.label,
						value: `${format(hovered!.kw[c.key], hovered!)} (${formatNumber((hovered!.kw[c.key] / hovered!.total) * 100, 0)} %)`,
						color: c.color
					})),
				{ label: 'Gesamt', value: format(hovered.total, hovered) }
			]
		: [];
</script>

{#if loading}
	<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !rows.length}
	<div class="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
		Keine Daten verfügbar
	</div>
{:else}
	<ChartSettings>
		<RadioGroup
			label="Energieträger"
			bind:value={carrier}
			options={[
				{ value: 'all', label: 'Gesamt' },
				...carriers.map((c) => ({ value: c.key, label: c.label }))
			]}
		/>
		{#if kinds.length > 1}
			<RadioGroup
				label="Auswahl"
				bind:value={kind}
				on:change={() => (expanded = false)}
				options={[{ value: 'all', label: 'Alle' }, ...kinds.map((k) => ({ value: k, label: k }))]}
			/>
		{/if}
		{#if hasArea}
			<Toggle label="pro km²" bind:checked={perArea} />
		{/if}
	</ChartSettings>

	{#if carrier === 'all'}
		<div class="mb-3">
			<Legend items={carriers} />
		</div>
	{/if}

	<ol
		bind:clientWidth={width}
		class="space-y-1.5 text-sm"
		aria-label="Rangliste installierte Leistung"
		on:mouseleave={() => (hovered = null)}
	>
		{#each visible as row, i (row.code)}
			{@const kw = kwOf(row)}
			<li
				class="{compact ? 'block' : 'flex items-center gap-2'} rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
				style="opacity: {hovered === null || hovered === row ? 1 : 0.5};"
				tabindex="0"
				aria-label="{i + 1}. {row.name}: {format(kw, row)}{carrier === 'all'
					? ` (${describe(row)})`
					: ''}"
				on:mouseenter={(e) => show(e, row)}
				on:mousemove={(e) => show(e, row)}
				on:focus={(e) => show(e, row)}
				on:blur={() => (hovered = null)}
			>
				<span
					class="{compact
						? 'block mb-0.5'
						: 'w-48 shrink-0 text-right'} truncate text-gray-900 dark:text-white"
					title={row.name}
					aria-hidden="true"><span class="tabular-nums text-gray-500 dark:text-gray-400">{i + 1}.</span> {row.name}</span
				>
				<div class="flex items-center gap-2 flex-1 min-w-0" aria-hidden="true">
					<div class="flex h-4 flex-1 min-w-0">
						<div class="flex h-full" style="width: {(valueOf(row) / max) * 100}%;">
							{#each shown as c (c.key)}
								<div
									class="h-full"
									style="width: {kw ? (row.kw[c.key] / kw) * 100 : 0}%; background: {c.color};"
								></div>
							{/each}
						</div>
					</div>
					<span class="w-24 shrink-0 tabular-nums font-semibold text-gray-900 dark:text-white"
						>{format(kw, row)}</span
					>
				</div>
			</li>
		{/each}
	</ol>

	{#if ranked.length > TOP_N}
		<div class="mt-3">
			<Button size="sm" aria-expanded={expanded} on:click={() => (expanded = !expanded)}>
				{expanded ? `Nur die Top ${TOP_N} anzeigen` : `Alle ${ranked.length} anzeigen`}
			</Button>
		</div>
	{/if}

	<Tooltip visible={!!hovered} x={hoverX} y={hoverY} title={hovered?.name ?? ''} items={tooltipItems} />
{/if}
