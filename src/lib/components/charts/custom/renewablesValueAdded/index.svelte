<!-- $lib/components/charts/custom/renewablesValueAdded/index.svelte
	Regional value added by wind and solar power: totals of the region, its parents and the country on top,
	below a ranking of the region's districts (district pages: the districts of their state) as bars stacked
	by technology. Year and scenario (minimum / potential) are switchable. -->
<script lang="ts">
	import type { Region } from '$lib/utils/getRegion';
	import type { ChartData } from '$lib/components/charts/types';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import { RadioGroup } from '$lib/components/ui';
	import { formatNumber } from '$lib/utils/formatters';
	import {
		loadValueAdded,
		buildChartData,
		key,
		ranks,
		TECHS,
		TECH_LABELS,
		SCENARIO_LABELS,
		type ValueAddedData,
		type Scenario,
		type Tech,
		type Values
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let chart: { config?: Record<string, any> | null } | null = null;

	let data: ValueAddedData | null = null;
	let loading = true;
	let error: string | null = null;
	let period = 0;
	let scenario: Scenario = 'minimum';
	let level: 'district' | 'state' = 'district';
	let view: 'overview' | 'halves' | 'ranking' = 'overview';
	let expanded = false;
	const TOP_N = 10;

	$: load(region?.id ?? null);
	async function load(id: string | null) {
		loading = true;
		error = null;
		try {
			data = await loadValueAdded(fetch, id, chart?.config?.csv);
			if (data && !data.periods.includes(period)) period = data.periods[0];
			onChartData?.(data ? buildChartData(data) : null);
		} catch (e) {
			console.error('[renewablesValueAdded]', e);
			error = 'Die Daten konnten nicht geladen werden.';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// wind blue, rooftop PV gold, ground-mounted PV gold stripes: never told apart by colour alone
	const STYLE: Record<Tech, string> = {
		wind: 'background: #003B80;',
		pv_rooftop: 'background: #E0A906;',
		pv_groundmounted: 'background: repeating-linear-gradient(135deg, #E0A906 0 3px, #F0E1C2 3px 6px);'
	};

	const fmt = (v: number) => formatNumber(v, 1);
	const zero: Values = { wind: 0, pv_rooftop: 0, pv_groundmounted: 0, total: 0 };

	$: k = key(period, scenario);
	$: byState = level === 'state' && !!data?.states.length;
	$: rows = data
		? (byState
				? data.states.map((s) => ({ id: s.id, label: s.name, note: undefined, v: s.values[k] ?? zero }))
				: data.members.map((d) => ({
						id: d.id,
						label: d.name,
						note: d.layerLabel ?? undefined,
						v: d.values[k] ?? zero
					}))
			).sort((a, b) => b.v.total - a.v.total)
		: [];
	$: shown = expanded ? rows : rows.filter((r, i) => i < TOP_N || r.id === data?.district?.id);
	$: max = Math.max(1, ...rows.map((r) => r.v.total)) * 1.02;
	$: rankOf = data ? ranks(data.all, period, scenario) : new Map<string, number>();
	$: country = data?.references.at(-1);

	// overview: the page region (or district) per technology, first period pale next to last period strong
	const GROUPS: { key: Tech | 'total'; label: string; text: string; bar: string; barClass?: string }[] = [
		{ key: 'total', label: 'Gesamt', text: 'text-green-800 dark:text-green-400', bar: '', barClass: 'bg-green-700 dark:bg-green-500' },
		{ key: 'wind', label: 'Windkraft', text: 'text-[#003B80] dark:text-blue-300', bar: '', barClass: 'bg-[#003B80] dark:bg-blue-400' },
		{ key: 'pv_rooftop', label: 'PV Dach', text: 'text-[#8A6800] dark:text-yellow-400', bar: STYLE.pv_rooftop },
		{ key: 'pv_groundmounted', label: 'PV Freifläche', text: 'text-[#8A6800] dark:text-yellow-400', bar: STYLE.pv_groundmounted }
	];
	$: first = data?.periods[0] ?? 0;
	$: last = data?.periods.at(-1) ?? 0;
	$: own = data ? (data.district ?? data.references[0]) : null;
	$: ownName = data?.district?.name ?? own?.name ?? '';
	$: before = own?.values[key(first, scenario)] ?? zero;
	$: after = own?.values[key(last, scenario)] ?? zero;
	$: groupMax = Math.max(1, ...GROUPS.map((g) => Math.max(before[g.key], after[g.key])));
	const signed = (v: number) => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v))}`;

	// half circles: last period as outlined dome, first period as filled bowl below; area ∝ value
	const DOME: Record<Tech | 'total', { stroke: string; fill: string }> = {
		total: { stroke: 'stroke-green-700 dark:stroke-green-500', fill: 'fill-green-700 dark:fill-green-500' },
		wind: { stroke: 'stroke-[#003B80] dark:stroke-blue-400', fill: 'fill-[#003B80] dark:fill-blue-400' },
		pv_rooftop: { stroke: 'stroke-[#E0A906]', fill: 'fill-[#E0A906]' },
		pv_groundmounted: { stroke: 'stroke-[#E0A906]', fill: '' }
	};
	const R_MAX = 56;
	$: halfMax = Math.max(1, ...GROUPS.map((g) => Math.max(before[g.key], after[g.key])));
	const radius = (v: number, max: number) => Math.max(R_MAX * Math.sqrt(Math.max(v, 0) / max), 1.5);
	/** upper half circle (opening down) centred at (cx, cy) */
	const dome = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`;
	/** lower half circle (opening up) */
	const bowl = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy} Z`;

	let width = 0;
	$: compact = width > 0 && width < 500;

	let hovered: (typeof rows)[number] | null = null;
	let x = 0;
	let y = 0;
	function move(e: MouseEvent, row: (typeof rows)[number]) {
		hovered = row;
		x = e.clientX;
		y = e.clientY;
	}
	$: tooltipItems = hovered
		? [
				...TECHS.map((t) => ({ label: TECH_LABELS[t], value: `${fmt(hovered!.v[t])} Mio. €` })),
				{ label: 'Summe', value: `${fmt(hovered.v.total)} Mio. €` },
				...(rankOf.has(hovered.id)
					? [{ label: 'Rang in Deutschland', value: `${rankOf.get(hovered.id)} von ${data?.total}` }]
					: [])
			]
		: [];
</script>

{#if loading}
	<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data}
	<div class="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
		Keine Daten verfügbar
	</div>
{:else}
	{#if data.shownAs}
		<p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
			Daten liegen nur für Kreise vor, gezeigt wird {data.shownAs}.
		</p>
	{/if}
	<ChartSettings>
		<RadioGroup
			label="Ansicht"
			bind:value={view}
			options={[
				{ value: 'overview', label: 'Säulen' },
				{ value: 'halves', label: 'Halbkreise' },
				{ value: 'ranking', label: data.states.length ? 'Rangliste' : 'Kreise' }
			]}
		/>
		<RadioGroup
			label="Szenario"
			bind:value={scenario}
			options={(['minimum', 'potential'] as Scenario[]).map((s) => ({ value: s, label: SCENARIO_LABELS[s] }))}
		/>
		{#if view === 'ranking'}
			<RadioGroup
				label="Jahr"
				bind:value={period}
				options={data.periods.map((p) => ({ value: p, label: String(p) }))}
			/>
		{/if}
		{#if view === 'ranking' && data.states.length}
			<RadioGroup
				label="Ebene"
				bind:value={level}
				options={[
					{ value: 'district', label: 'Kreise' },
					{ value: 'state', label: 'Bundesländer' }
				]}
			/>
		{/if}
	</ChartSettings>

	{#if view === 'overview'}
		<!-- columns per technology: first period pale, last period strong; values and change printed below -->
		<div class="text-sm" role="figure" aria-label="Regionale Wertschöpfung in {ownName}, {first} und {last}">
			<p class="mb-3 text-xs text-gray-600 dark:text-gray-400">
				{ownName} · {SCENARIO_LABELS[scenario]}
			</p>
			<div class="grid grid-cols-4 gap-2 sm:gap-6">
				{#each GROUPS as g, i}
					{@const a = before[g.key]}
					{@const b = after[g.key]}
					<div class="flex flex-col items-center min-w-0">
						<!-- earlier period behind, partly covered by the later one (as in election result charts) -->
						<div class="relative w-[72%] max-w-[4.5rem] h-28 pt-4" aria-hidden="true">
							{#each [{ v: a, y: first, pale: true }, { v: b, y: last, pale: false }] as bar}
								<div
									class="absolute bottom-0 h-[calc(100%-1rem)] flex flex-col justify-end {bar.pale
										? 'left-0 w-[52%]'
										: 'right-0 w-[62%] z-10'}"
								>
									{#if i === 0}
										<span
											class="absolute left-1/2 -translate-x-1/2 text-[11px] leading-none tabular-nums text-gray-400 dark:text-gray-500"
											style="bottom: calc({(bar.v / groupMax) * 100}% + 3px);"
											>{bar.pale ? `'${String(bar.y).slice(2)}` : bar.y}</span
										>
									{/if}
									<div
										class="w-full {g.barClass ?? ''}"
										style="height: {Math.max((bar.v / groupMax) * 100, 1.5)}%; {g.bar} opacity: {bar.pale ? 0.3 : 1};"
									></div>
								</div>
							{/each}
						</div>
						<div class="mt-1.5 text-sm sm:text-base font-bold leading-tight text-center truncate max-w-full {g.text}" title={g.label}>
							{g.label}
						</div>
						<div class="text-lg sm:text-xl font-bold tabular-nums leading-tight whitespace-nowrap {g.text}">
							{fmt(b)}<span class="ml-0.5 text-[10px] sm:text-xs font-bold">Mio.€</span>
						</div>
						<div class="text-xs tabular-nums leading-tight text-gray-500 dark:text-gray-400">
							{signed(b - a)}<span class="sr-only"> Mio. Euro gegenüber {first} ({fmt(a)})</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if view === 'halves'}
		<!-- per technology: last period as outlined dome, first period as filled bowl below (areas ∝ values) -->
		<div class="text-sm" role="figure" aria-label="Regionale Wertschöpfung in {ownName}, {SCENARIO_LABELS[scenario]} {first} und {last}">
			<div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
				<span>{ownName} · {SCENARIO_LABELS[scenario]}</span>
				<span class="flex items-center gap-1.5">
					<svg width="16" height="9" viewBox="0 0 16 9" aria-hidden="true"
						><path d={dome(8, 8, 7)} class="fill-gray-50 dark:fill-gray-800 stroke-gray-500" stroke-width="1.5" /></svg
					>{last}
				</span>
				<span class="flex items-center gap-1.5">
					<svg width="16" height="9" viewBox="0 0 16 9" aria-hidden="true"
						><path d={bowl(8, 1, 7)} class="fill-gray-500" /></svg
					>{first}
				</span>
			</div>
			<div class="grid grid-cols-4 gap-1 sm:gap-4">
				{#each GROUPS as g}
					{@const rp = radius(after[g.key], halfMax)}
					{@const rm = radius(before[g.key], halfMax)}
					<div class="flex flex-col items-center min-w-0">
						<svg
							class="w-full max-w-[120px] overflow-visible"
							viewBox="0 6 {R_MAX * 2 + 4} {R_MAX * 2 + 18}"
							aria-hidden="true"
						>
							<defs>
								<pattern id="va-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
									<rect width="6" height="6" fill="#F0E1C2" />
									<rect width="3" height="6" fill="#E0A906" />
								</pattern>
							</defs>
							<path
								d={dome(R_MAX + 2, R_MAX + 16, rp)}
								class="fill-gray-50 dark:fill-gray-800 {DOME[g.key].stroke}"
								stroke-width="2.5"
							/>
							<path
								d={bowl(R_MAX + 2, R_MAX + 20, rm)}
								class={DOME[g.key].fill}
								fill={g.key === 'pv_groundmounted' ? 'url(#va-stripes)' : undefined}
							/>
							<!-- year names inside the shapes where they fit -->
							{#if rp >= 26}
								<text
									x={R_MAX + 2}
									y={R_MAX + 16 - Math.min(rp * 0.4, 18)}
									text-anchor="middle"
									class="text-[12px] font-bold {DOME[g.key].fill || 'fill-[#8A6800]'}">{last}</text
								>
							{/if}
							{#if rm >= 26}
								<text
									x={R_MAX + 2}
									y={R_MAX + 20 + Math.min(rm * 0.4, 18) + 4}
									text-anchor="middle"
									class="text-[12px] font-bold fill-white dark:fill-gray-900">{first}</text
								>
							{/if}
						</svg>
						<div class="mt-1 text-sm sm:text-base font-bold leading-tight text-center truncate max-w-full {g.text}" title={g.label}>
							{g.label}
						</div>
						<!-- main message: what the first period already brings; the last period as the outlook -->
						<div class="text-lg sm:text-xl font-bold tabular-nums leading-tight whitespace-nowrap {g.text}">
							{fmt(before[g.key])}<span class="ml-0.5 text-[10px] sm:text-xs font-bold">Mio.€</span>
						</div>
						<div class="text-xs tabular-nums leading-tight text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">
							{last}: <span class="font-bold">{fmt(after[g.key])}</span>
							<span class="sr-only">Mio. Euro, {first}: {fmt(before[g.key])} Mio. Euro</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}

	<!-- totals: the district itself or the region, its parents and the country -->
	<div class="grid gap-3 mb-5" style="grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));">
		{#each data.district ? [{ id: data.district.id, name: data.district.name, values: data.district.values, count: 1 }, ...data.references] : data.references as r (r.id)}
			{@const v = r.values[k] ?? zero}
			<div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
				<div class="text-xs text-gray-600 dark:text-gray-400 truncate" title={r.name}>
					{r.name}{#if r.count > 1}<span> · {r.count} Kreise</span>{/if}
				</div>
				<div class="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
					{fmt(v.total)}<span class="ml-1 text-sm font-normal text-gray-600 dark:text-gray-400">Mio. €</span>
				</div>
				{#if country && r.id !== country.id && country.values[k]?.total}
					<div class="text-xs text-gray-600 dark:text-gray-400">
						{formatNumber((v.total / country.values[k].total) * 100, 1)} % von {country.name}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div bind:clientWidth={width} class="text-xs" on:mouseleave={() => (hovered = null)} role="presentation">
		<ol class="space-y-1.5" aria-label="Rangliste {byState ? 'Bundesländer' : 'Kreise'}">
			{#each shown as row (row.id)}
				{@const strong = row.id === data.district?.id}
				<li
					class="{compact ? 'block' : 'flex items-center gap-2'} cursor-default transition-opacity"
					style="opacity: {hovered === null || hovered === row ? 1 : 0.5};"
					on:mouseenter={(e) => move(e, row)}
					on:mousemove={(e) => move(e, row)}
					aria-label="{row.label}: {fmt(row.v.total)} Mio. Euro ({TECHS.map(
						(t) => `${TECH_LABELS[t]} ${fmt(row.v[t])}`
					).join(', ')})"
				>
					<span
						class="{compact ? 'block mb-0.5' : 'w-64 shrink-0 text-right'} min-w-0 truncate leading-tight {strong
							? 'font-bold text-gray-900 dark:text-white'
							: 'text-gray-700 dark:text-gray-300'}"
						title={row.label}
					>
						<span class="mr-1 tabular-nums font-normal text-gray-500 dark:text-gray-400"
							>{rows.indexOf(row) + 1}.</span
						>{row.label}{#if row.note}<span class="ml-1 font-normal text-gray-500 dark:text-gray-400"
								>· {row.note}</span
							>{/if}
					</span>
					<span class="flex flex-1 min-w-0 items-center gap-2">
						<span class="relative h-4 flex-1 min-w-0" aria-hidden="true">
							<span
								class="absolute inset-y-0 left-0 flex {strong
									? 'ring-2 ring-offset-1 ring-gray-900 dark:ring-white dark:ring-offset-gray-900'
									: ''}"
								style="width: {(row.v.total / max) * 100}%;"
							>
								{#each TECHS as t}
									{#if row.v[t] > 0}
										<span class="h-full" style="width: {(row.v[t] / (row.v.total || 1)) * 100}%; {STYLE[t]}"
										></span>
									{/if}
								{/each}
							</span>
						</span>
						<span
							class="w-14 shrink-0 tabular-nums {strong
								? 'font-bold text-gray-900 dark:text-white'
								: 'text-gray-700 dark:text-gray-300'}">{fmt(row.v.total)}</span
						>
					</span>
				</li>
			{/each}
		</ol>
		{#if rows.length > TOP_N}
			<button
				type="button"
				class="mt-3 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white underline underline-offset-2"
				aria-expanded={expanded}
				on:click={() => (expanded = !expanded)}
			>
				{expanded ? `Nur die Top ${TOP_N} anzeigen` : `Alle ${rows.length} ${byState ? 'Bundesländer' : 'Kreise'} anzeigen`}
			</button>
		{/if}
		<ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-gray-700 dark:text-gray-300" aria-label="Legende">
			{#each TECHS as t}
				<li class="flex items-center gap-1.5">
					<span class="inline-block w-3 h-3 rounded-sm" style={STYLE[t]} aria-hidden="true"></span>{TECH_LABELS[t]}
				</li>
			{/each}
			<li class="text-gray-500 dark:text-gray-400">Werte in Mio. Euro</li>
		</ul>
	</div>
	{/if}

	{#if hovered}
		<Tooltip visible={true} {x} {y} title={hovered.label} items={tooltipItems} />
	{/if}
{/if}
