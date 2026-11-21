<!--
	View part of the federal states explorer: trend, index (start year = 100) and share.
	Gets prepared data, does no fetching.
-->
<script lang="ts">
	import { Chart, AxisX, AxisY, Line, Area, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RadioGroup, Select } from '$lib/components/ui';
	import { formatNumber } from '$lib/utils/formatters';
	import StatePicker from './StatePicker.svelte';

	type StateSeries = { name: string; values: Record<number, number> };

	export let series: StateSeries[] = [];
	export let years: number[] = [];
	/** state name -> year -> inhabitants; enables the per-capita measure */
	export let population: Record<string, Record<number, number>> = {};

	// colour-blind safe palette + dash patterns: series never differ by colour alone
	const PALETTE = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#D55E00', '#56B4E9', '#4B5563', '#B8860B', '#7B3294'];
	const DASHES: (string | null)[] = [null, '6 3', '2 3'];

	let view: 'trend' | 'index' | 'share' = 'trend';
	let measure: 'absolute' | 'perCapita' = 'absolute';
	let baseYear = years[0] ?? 1990;
	let hidden: Set<string> = new Set();
	let clientWidth = 0;

	// <Select> returns the option value as string → normalise to a number
	$: if (typeof baseYear !== 'number') baseYear = Number(baseYear);
	$: if (!years.includes(baseYear) && years.length) baseYear = years[0];
	$: lastYear = years.at(-1) ?? 0;

	// largest emitter first → stable colours, bottom of the stack
	$: states = [...series]
		.sort((a, b) => (b.values[lastYear] ?? 0) - (a.values[lastYear] ?? 0))
		.map((s, i) => ({
			key: `s${i}`,
			name: s.name,
			values: s.values,
			color: PALETTE[i % PALETTE.length],
			dash: DASHES[i % DASHES.length]
		}));
	$: visible = states.filter((s) => !hidden.has(s.key));

	$: hasPopulation = Object.keys(population).length > 0;
	// per capita is not meaningful for the share of the states
	$: perCapita = hasPopulation && measure === 'perCapita' && view !== 'share';

	/** emissions (t) or emissions per inhabitant (t/Kopf) for a state and year */
	function valueOf(s: { name: string; values: Record<number, number> }, year: number, pc: boolean): number | null {
		const v = s.values[year];
		if (v == null) return null;
		if (!pc) return v;
		const pop = population[s.name]?.[year];
		return pop ? v / pop : null;
	}

	$: rows = years.map((year) => {
		const row: Record<string, number | null> = { year };
		const total = visible.reduce((sum, s) => sum + (s.values[year] ?? 0), 0);
		let acc = 0;
		for (const s of visible) {
			const v = s.values[year] ?? null;
			if (view === 'trend') {
				const m = valueOf(s, year, perCapita);
				row[s.key] = m == null ? null : perCapita ? m : m / 1_000_000;
			} else if (view === 'index') {
				const m = valueOf(s, year, perCapita);
				const base = valueOf(s, baseYear, perCapita);
				row[s.key] = m == null || !base ? null : (m / base) * 100;
			} else {
				const share = v == null || !total ? 0 : (v / total) * 100;
				row[`${s.key}_0`] = acc;
				acc += share;
				row[`${s.key}_1`] = acc;
				row[s.key] = share;
			}
		}
		return row;
	});

	$: yFields = view === 'share' ? ['_max'] : visible.map((s) => s.key);
	$: chartRows = view === 'share' ? rows.map((r) => ({ ...r, _max: 100 })) : rows;
	$: unit = view === 'trend' ? (perCapita ? 't/Kopf' : 'Mio. t') : view === 'index' ? 'Index' : '%';
	const fmtIndex = (v: number) => {
		const change = Math.round(v - 100);
		return `${formatNumber(v, 0)} (${change > 0 ? '+' : change < 0 ? '−' : '±'}${Math.abs(change)} %)`;
	};
	$: fmtValue = (v: number | null | undefined) =>
		v == null
			? '–'
			: view === 'trend'
				? `${formatNumber(v, perCapita ? 1 : 2)} ${perCapita ? 't/Kopf' : 'Mio. t'}`
				: view === 'index'
					? fmtIndex(v)
					: `${formatNumber(v, 1)} %`;

	$: narrow = clientWidth > 0 && clientWidth < 500;
	$: showEndLabels = !narrow && view !== 'share';
	$: margin = { top: 15, right: showEndLabels ? (view === 'index' ? 190 : 165) : 15, bottom: 35, left: narrow ? 40 : 50 };

	function endLabels(yScale: (v: number) => number) {
		const labels = visible
			.map((s) => {
				const last = [...rows].reverse().find((r) => r[s.key] != null);
				return last ? { ...s, value: last[s.key] as number, y: yScale(last[s.key] as number) } : null;
			})
			.filter((l): l is NonNullable<typeof l> => l !== null)
			.sort((a, b) => a.y - b.y);
		for (let i = 1; i < labels.length; i++) {
			if (labels[i].y - labels[i - 1].y < 13) labels[i].y = labels[i - 1].y + 13;
		}
		return labels;
	}
</script>

<div bind:clientWidth>
	<div class="flex flex-wrap items-end gap-4">
		<RadioGroup
			label="Ansicht"
			hideLabel
			bind:value={view}
			options={[
				{ value: 'trend', label: 'Verlauf' },
				{ value: 'index', label: '%-Veränderung' },
				{ value: 'share', label: 'Anteil' }
			]}
		/>
		{#if hasPopulation && view !== 'share'}
			<RadioGroup
				label="Bezug"
				hideLabel
				bind:value={measure}
				options={[
					{ value: 'absolute', label: 'Absolut' },
					{ value: 'perCapita', label: 'Pro Kopf' }
				]}
			/>
		{/if}
		{#if showEndLabels}
			<!-- legend is hidden here (lines have end labels) → federal states are picked in a dropdown -->
			<StatePicker
				bind:hidden
				items={states.map((s) => ({ key: s.key, label: s.name, color: s.color, dash: s.dash }))}
			/>
		{/if}
		{#if view === 'index'}
			<div class="w-40">
				<Select
					label="Startjahr (= 100)"
					bind:value={baseYear}
					options={years.slice(0, -1).map((y) => ({ value: y, label: `Startjahr ${y}` }))}
					hideLabel
					small
				/>
			</div>
		{/if}
	</div>

	{#if view === 'index'}
		<p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
			Entwicklung {perCapita ? 'der Pro-Kopf-Emissionen ' : ''}relativ zu {baseYear} (= 100). Werte unter 100
			bedeuten weniger Emissionen als {baseYear}.
		</p>
	{/if}

	<!-- legend only when the lines have no end labels (narrow screens, share view) -->
	{#if !showEndLabels}
		<div class="mt-3">
			<Legend
				interactive
				bind:hidden
				items={states.map((s) => ({ key: s.key, label: s.name, color: s.color, dashed: view !== 'share' && s.dash != null }))}
			/>
			<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Bundesländer in der Legende an- und abwählen.</p>
		</div>
	{/if}

	<div class="mt-2">
		<Chart data={chartRows} x="year" y={yFields} height={380} yMin={0} yMax={view === 'share' ? 100 : null} {margin}>
			<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<!-- always label the latest year (e.g. 2023); ticks too close to it are dropped by AxisX -->
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={(v) => String(v)} tickCount={7} forceTicks={[lastYear]} />

				{#if view === 'share'}
					{#each visible as s (s.key)}
						<Area data={rows} x="year" y0Field="{s.key}_0" y1Field="{s.key}_1" color={s.color} opacity={0.85} stroke="#ffffff" strokeWidth={0.75} curve="linear" {xScale} {yScale} />
					{/each}
				{:else}
					{#if view === 'index'}
						<line x1="0" x2={innerWidth} y1={yScale(100)} y2={yScale(100)} stroke="currentColor" stroke-width="1" stroke-dasharray="4 3" class="text-gray-500 dark:text-gray-400" />
					{/if}
					{#each [...visible].reverse() as s (s.key)}
						<Line data={rows} x="year" y={s.key} {xScale} {yScale} stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} {hover} />
					{/each}
					{#if showEndLabels}
						{#each endLabels(yScale) as l (l.key)}
							<text x={innerWidth + 8} y={l.y} dy="0.32em" class="text-xs" fill={l.color}>
								{l.name} {fmtValue(l.value)}
							</text>
						{/each}
					{/if}
				{/if}

				{#if hover.x !== null}
					<line x1={xScale(hover.x)} x2={xScale(hover.x)} y1="0" y2={innerHeight} stroke="currentColor" stroke-width="1" class="text-gray-400 pointer-events-none" />
				{/if}

				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} {unit} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const pt = rows.find((r) => r.year === hover.x)}
					{#if pt}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={String(pt.year)}
							items={visible
								.filter((s) => pt[s.key] != null)
								.sort((a, b) => (pt[b.key] ?? 0) - (pt[a.key] ?? 0))
								.map((s) => ({ label: s.name, value: fmtValue(pt[s.key]), color: s.color }))}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>
	</div>
</div>
