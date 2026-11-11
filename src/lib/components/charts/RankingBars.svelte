<!--
	Horizontal bar ranking of regions (or anything else), highest value first.

	- `references` (e.g. averages of the region and of Germany) are drawn on top as outlined bars
	- `rows` below; only the first `topN` until expanded, the `highlightId` row always shown
	- bars at or above `mean` darker than those below it; `mean` also drawn as a dashed line
	- the value is printed next to every bar, so colour is never the only cue

	Usage:
		<RankingBars rows={[{ id, label, value }]} references={[…]} mean={12.3} meanLabel="Ø Bayern"
			format={(v) => formatPercent(v)} tooltip={(row) => [{ label: 'Rang', value: '3' }]} />
-->
<script lang="ts">
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import Legend from '$lib/components/charts/primitives/Legend.svelte';

	interface RankingRow {
		id: string;
		label: string;
		value: number;
		/** small text after the label (e.g. "Kreis", "Ø von 96 Kreisen") */
		note?: string;
	}

	export let rows: RankingRow[] = [];
	export let references: RankingRow[] = [];
	export let mean: number | null = null;
	export let meanLabel = 'Durchschnitt';
	export let highlightId: string | null = null;
	export let format: (v: number) => string = (v) => String(v);
	/** extra tooltip lines below the value */
	export let tooltip: (row: RankingRow) => Array<{ label: string; value: string }> = () => [];
	export let valueLabel = 'Wert';
	export let topN = 10;
	/** [above mean, below mean, references] */
	export let colors: [string, string, string] = ['#238B45', '#A1D99B', '#6B7280'];
	export let itemsLabel = 'Einträge';

	let expanded = false;
	let width = 0;
	$: compact = width > 0 && width < 500;

	$: ranked = [...rows].sort((a, b) => b.value - a.value);
	$: shown = expanded ? ranked : ranked.filter((r, i) => i < topN || r.id === highlightId);
	$: max = Math.max(0, ...rows.map((r) => r.value), ...references.map((r) => r.value)) * 1.02 || 1;
	$: pct = (v: number) => (Math.max(0, v) / max) * 100;
	$: colorOf = (v: number) => (mean == null || v >= mean ? colors[0] : colors[1]);

	let hovered: RankingRow | null = null;
	let x = 0;
	let y = 0;
	function move(e: MouseEvent, row: RankingRow) {
		if (hovered !== row) hovered = row;
		x = e.clientX;
		y = e.clientY;
	}
	$: items = hovered ? [{ label: valueLabel, value: format(hovered.value) }, ...tooltip(hovered)] : [];

	$: legend = [
		...(mean != null
			? [
					{ key: 'above', label: `über ${meanLabel}`, color: colors[0] },
					{ key: 'below', label: `unter ${meanLabel}`, color: colors[1] },
					{ key: 'mean', label: `${meanLabel} (${format(mean)})`, color: colors[2], dashed: true }
				]
			: [])
	];
</script>

{#snippet bar(row: RankingRow, reference: boolean)}
	{@const strong = reference || row.id === highlightId}
	<li
		class="{compact ? 'block' : 'flex items-center gap-2'} cursor-default transition-opacity"
		style="opacity: {hovered === null || hovered === row ? 1 : 0.5};"
		on:mouseenter={(e) => move(e, row)}
		on:mousemove={(e) => move(e, row)}
	>
		<span
			class="{compact ? 'block mb-0.5' : 'w-64 shrink-0 text-right'} min-w-0 truncate leading-tight {strong
				? 'font-bold text-gray-900 dark:text-white'
				: 'text-gray-700 dark:text-gray-300'}"
			title={row.label}
		>
			{#if !reference}<span class="mr-1 tabular-nums font-normal text-gray-500 dark:text-gray-400">{ranked.indexOf(row) + 1}.</span>{/if}{row.label}{#if row.note}<span class="ml-1 font-normal text-gray-500 dark:text-gray-400">· {row.note}</span>{/if}
		</span>
		<span class="flex flex-1 min-w-0 items-center gap-2">
			<span class="relative h-4 flex-1 min-w-0">
				<span
					class="absolute inset-y-0 left-0 {row.id === highlightId ? 'ring-2 ring-offset-1 ring-gray-900 dark:ring-white dark:ring-offset-gray-900' : ''}"
					style="width: {pct(row.value)}%; {reference
						? `box-shadow: inset 0 0 0 1.5px ${colors[2]}; background: color-mix(in srgb, ${colors[2]} 15%, transparent);`
						: `background: ${colorOf(row.value)};`}"
				></span>
			</span>
			<span
				class="w-14 shrink-0 tabular-nums {strong
					? 'font-bold text-gray-900 dark:text-white'
					: 'text-gray-700 dark:text-gray-300'}">{format(row.value)}</span
			>
		</span>
	</li>
{/snippet}

<div bind:clientWidth={width} class="text-xs" on:mouseleave={() => (hovered = null)} role="presentation">
	<div class="relative">
		{#if references.length}
			<ul class="space-y-1.5" aria-label="Vergleichswerte">
				{#each references as row (row.id)}
					{@render bar(row, true)}
				{/each}
			</ul>
		{/if}
		<ol
			class="space-y-1.5 {references.length ? 'mt-3 pt-3 border-t border-gray-200 dark:border-gray-700' : ''}"
			aria-label="Rangliste"
		>
			{#each shown as row (row.id)}
				{@render bar(row, false)}
			{/each}
		</ol>
		{#if mean != null}
			<!-- one dashed line through all bars -->
			<div class="pointer-events-none absolute inset-0 flex gap-2" aria-hidden="true">
				{#if !compact}<span class="w-64 shrink-0"></span>{/if}
				<span class="relative flex-1 min-w-0">
					<span
						class="absolute -inset-y-1 border-l-2 border-dashed"
						style="left: {pct(mean)}%; border-color: {colors[2]};"
					></span>
				</span>
				<span class="w-14 shrink-0"></span>
			</div>
		{/if}
	</div>
	{#if ranked.length > topN}
		<button
			type="button"
			class="mt-3 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline underline-offset-2"
			aria-expanded={expanded}
			on:click={() => (expanded = !expanded)}
		>
			{expanded ? `Nur die Top ${topN} anzeigen` : `Alle ${ranked.length} ${itemsLabel} anzeigen`}
		</button>
	{/if}
	{#if legend.length}
		<div class="mt-4"><Legend items={legend} /></div>
	{/if}
</div>

{#if hovered}
	<Tooltip visible={true} {x} {y} title={hovered.label} {items} />
{/if}
