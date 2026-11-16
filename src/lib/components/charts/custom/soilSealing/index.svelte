<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		Chart,
		AxisX,
		AxisY,
		Area,
		Line,
		Tooltip,
		Legend
	} from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import RegionSwitcher from '$lib/components/charts/RegionSwitcher.svelte';
	import { formatNumber } from '$lib/utils/formatters';
	import {
		fetchData,
		buildChartData,
		NATIONAL_TARGET_HA_PER_DAY,
		NATIONAL_TARGET_2030_HA_PER_DAY,
		FOOTBALL_PITCH_HA,
		formatPitches,
		type SoilSealingRawData
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	const ACTUAL_COLOR = '#B7693D';
	const TARGET_COLOR = '#4880A8';
	const TARGET_2030_COLOR = '#65987D';
	const TARGET_YEAR = 2030;
	/** At most this many pitch icons per row; larger values use a bigger unit per icon */
	const MAX_ICONS = 80;

	let data: SoilSealingRawData | null = null;
	let loading = true;
	let error: string | null = null;
	let containerWidth = 0;
	let view: 'pitches' | 'trend' = 'trend';
	let period: 'day' | 'year' | 'total' = 'day';

	$: isMobile = containerWidth < 500;

	const days = (from: number, to: number) =>
		(Date.UTC(to, 11, 31) - Date.UTC(from, 11, 31)) / 86_400_000;
	const ha = (v: number) => `${formatNumber(v, v < 10 ? 1 : 0)} ha`;
	const pitchCount = (v: number) => formatPitches(v / FOOTBALL_PITCH_HA);

	$: first = Number(data?.firstYear);
	$: last = Number(data?.latest.period);

	// --- Pictograms: actual vs. targets, per day / in the last year / since the first year ---
	$: rows = data ? pictogramRows(data, period) : [];
	$: unit =
		[1, 5, 10, 25, 50, 100, 250, 500, 1000].find(
			(u) => Math.max(...rows.map((r) => r.value)) / FOOTBALL_PITCH_HA / u <= MAX_ICONS
		) ?? 1000;

	function pictogramRows(d: SoilSealingRawData, p: typeof period) {
		const span = p === 'day' ? 1 : p === 'year' ? days(last - 1, last) : days(first, last);
		const actual =
			p === 'day' ? (d.latest.perDay ?? 0) : p === 'year' ? (d.latest.added ?? 0) : d.added;
		return [
			{
				label: p === 'total' ? `Tatsächlich seit ${first}` : `Tatsächlich ${last}`,
				value: actual,
				color: ACTUAL_COLOR
			},
			...(d.target != null
				? [
						{
							label: `${NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel (Anteil)`,
							value: d.target * span,
							color: TARGET_COLOR
						}
					]
				: []),
			...(d.target2030 != null && p !== 'total'
				? [
						{
							label: `${NATIONAL_TARGET_2030_HA_PER_DAY}-ha-Ziel 2030 (Anteil)`,
							value: d.target2030 * span,
							color: TARGET_2030_COLOR
						}
					]
				: [])
		];
	}

	function icons(value: number) {
		const n = value / FOOTBALL_PITCH_HA / unit;
		return { full: Math.floor(n), part: n - Math.floor(n) };
	}

	// --- Cumulative chart: increase since the first year, target paths and outlook to 2030 ---
	$: lines = data ? cumulativeRows(data) : [];
	$: gap = lines.filter((r) => r.actual != null);
	$: yMax = niceMax(
		Math.max(...lines.map((r) => Math.max(r.actual ?? 0, r.projected ?? 0, r.path30 ?? 0)))
	);
	$: excess = data?.targetAdded != null ? data.added - data.targetAdded : null;
	$: gapLabelRow = gap[Math.floor(gap.length / 2)];

	function cumulativeRows(d: SoilSealingRawData) {
		const byYear = new Map(d.series.map((s) => [Number(s.period), s.cumulative]));
		const out = [];
		for (let y = first; y <= TARGET_YEAR; y++) {
			out.push({
				year: y,
				actual: byYear.get(y) ?? null,
				projected: y >= last ? d.added + d.recentPerDay * days(last, y) : null,
				path30: d.target != null ? d.target * days(first, y) : null,
				path20:
					d.target2030 != null && d.targetAdded != null && y >= last
						? d.targetAdded + d.target2030 * days(last, y)
						: null
			});
		}
		return out;
	}

	function niceMax(v: number) {
		const step = 10 ** Math.floor(Math.log10(v || 1)) / 2;
		return Math.ceil((v * 1.05) / step) * step;
	}

	$: legendItems = [
		{ key: 'actual', label: `Zuwachs seit ${first}`, color: ACTUAL_COLOR },
		{
			key: 'projected',
			label: 'weiter im Tempo der letzten drei Jahre',
			color: ACTUAL_COLOR,
			dashed: true
		},
		...(data?.target != null
			? [
					{
						key: 'path30',
						label: `Anteil am ${NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel der Nationalen Nachhaltigkeitsstrategie`,
						color: TARGET_COLOR
					}
				]
			: []),
		...(data?.target2030 != null
			? [
					{
						key: 'path20',
						label: `Anteil am ${NATIONAL_TARGET_2030_HA_PER_DAY}-ha-Ziel ab ${last + 1}`,
						color: TARGET_2030_COLOR,
						dashed: true
					}
				]
			: [])
	];

	function tooltipItems(year: number | null) {
		const r = lines.find((l) => l.year === year);
		if (!r) return [];
		const value = r.actual ?? r.projected;
		return [
			...(value != null
				? [
						{
							label: r.actual != null ? `Zuwachs seit ${first}` : 'im aktuellen Tempo',
							value: ha(value),
							color: ACTUAL_COLOR
						}
					]
				: []),
			...(r.path30 != null
				? [
						{
							label: `${NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel`,
							value: ha(r.path30),
							color: TARGET_COLOR
						}
					]
				: []),
			...(r.path20 != null
				? [
						{
							label: `${NATIONAL_TARGET_2030_HA_PER_DAY}-ha-Ziel`,
							value: ha(r.path20),
							color: TARGET_2030_COLOR
						}
					]
				: []),
			...(value != null && r.path30 != null && value > r.path30
				? [
						{
							label: `über dem ${NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel`,
							value: `≈ ${pitchCount(value - r.path30)} Fußballfelder`
						}
					]
				: [])
		];
	}

	async function loadData(r: Region | null) {
		loading = true;
		error = null;
		try {
			data = await fetchData(r);
			onChartData?.(data ? buildChartData(data, r) : null);
		} catch (e) {
			console.error('[SoilSealing] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Region shown in the chart: the card's region, or one picked in the RegionSwitcher
	// (the switcher only appears for aggregate regions such as a Metropolregion)
	let switchedRegion: Region | null = null;
	let switcherId: string | null = null;
	let switcherFor: string | null = null;
	$: if (region?.id !== switcherFor) {
		switcherFor = region?.id ?? null;
		switchedRegion = null;
		switcherId = region?.id ?? null;
	}
	$: activeRegion = switchedRegion ?? region;

	$: loadData(activeRegion);
</script>

<div bind:clientWidth={containerWidth}>
	<!-- Outside the loading state so focus stays on the dropdown while the data reloads -->
	{#if region}
		<div class="mb-4">
			<RegionSwitcher
				{region}
				bind:selectedId={switcherId}
				on:change={(e) => (switchedRegion = e.detail.id === region?.id ? null : e.detail)}
			/>
		</div>
	{/if}
	{#if loading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data || !gap.length}
		<div class="h-[300px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{:else}
		<ChartSettings>
			<RadioGroup
				label="Ansicht"
				hideLabel
				bind:value={view}
				options={[
					{ value: 'trend', label: 'Verlauf' },
					{ value: 'pitches', label: 'Fußballfelder' }
				]}
			/>
		</ChartSettings>

		{#if view === 'pitches'}
			<!-- Pictograms -->
			<RadioGroup
				label="Zeitraum"
				hideLabel
				bind:value={period}
				options={[
					{ value: 'day', label: 'pro Tag' },
					{ value: 'year', label: `im Jahr ${last}` },
					{ value: 'total', label: `seit ${first}` }
				]}
			/>
			<div class="mt-3 grid gap-3">
				{#each rows as row (row.label)}
					{@const n = icons(row.value)}
					<div>
						<div
							class="flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-gray-700 dark:text-gray-300"
						>
							<span>{row.label}</span>
							<span class="tabular-nums">
								<span class="text-base font-semibold text-gray-900 dark:text-white"
									>{pitchCount(row.value)} Fußballfelder</span
								>
								· {ha(row.value)}
							</span>
						</div>
						<div class="mt-1 flex flex-wrap gap-[3px]" aria-hidden="true">
							{#each Array(n.full) as _}
								<svg width="22" height="15" viewBox="0 0 22 15">
									<rect x="0.5" y="0.5" width="21" height="14" rx="1.5" fill={row.color} />
									<line
										x1="11"
										y1="0.5"
										x2="11"
										y2="14.5"
										class="stroke-white dark:stroke-gray-900"
										stroke-width="0.8"
									/>
									<circle
										cx="11"
										cy="7.5"
										r="2.6"
										fill="none"
										class="stroke-white dark:stroke-gray-900"
										stroke-width="0.8"
									/>
								</svg>
							{/each}
							{#if n.part > 0.05}
								<svg
									width={Math.max(2, 22 * n.part)}
									height="15"
									viewBox="0 0 {Math.max(2, 22 * n.part)} 15"
								>
									<rect
										x="0.5"
										y="0.5"
										width={Math.max(1, 22 * n.part - 1)}
										height="14"
										rx="1.5"
										fill={row.color}
									/>
								</svg>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
				1 Symbol = {unit === 1 ? '1 Fußballfeld' : `${formatNumber(unit)} Fußballfelder`} (105 × 68 m)
			</p>
		{:else}
			<!-- Cumulative chart -->
			<div>
				<Chart
					data={lines}
					x="year"
					y={['actual', 'projected', 'path30', 'path20']}
					height={isMobile ? 240 : 300}
					yMin={0}
					{yMax}
					margin={{ top: 20, right: isMobile ? 12 : 130, bottom: 30, left: isMobile ? 48 : 60 }}
				>
					<svelte:fragment
						slot="default"
						let:xScale
						let:yScale
						let:xDomain
						let:innerWidth
						let:innerHeight
						let:hover
					>
						<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} tickCount={4} />

						{#if data.target != null}
							<!-- Area between actual and target path: brown when above the target, green when below -->
							<Area
								data={gap}
								x="year"
								y="actual"
								y0Field="path30"
								y1Field="actual"
								{xScale}
								{yScale}
								color={excess != null && excess < 0 ? TARGET_2030_COLOR : ACTUAL_COLOR}
								opacity={0.15}
								curve="linear"
							/>
							<Line
								data={lines}
								x="year"
								y="path30"
								{xScale}
								{yScale}
								stroke={TARGET_COLOR}
								strokeWidth={2}
							/>
						{/if}
						{#if data.target2030 != null}
							<Line
								data={lines}
								x="year"
								y="path20"
								{xScale}
								{yScale}
								stroke={TARGET_2030_COLOR}
								strokeWidth={2}
								strokeDasharray="5 4"
							/>
						{/if}
						<Line
							data={lines}
							x="year"
							y="projected"
							{xScale}
							{yScale}
							stroke={ACTUAL_COLOR}
							strokeWidth={2.5}
							strokeDasharray="6 5"
						/>
						<Line
							data={lines}
							x="year"
							y="actual"
							{xScale}
							{yScale}
							stroke={ACTUAL_COLOR}
							strokeWidth={3}
							{hover}
							dots
							dotRadius={2.5}
						/>

						{#if xScale && yScale}
							{#if excess != null && gapLabelRow?.actual != null && gapLabelRow.path30 != null}
								<text
									x={(xScale as any)(gapLabelRow.year) + 6}
									y={(yScale(gapLabelRow.actual) + yScale(gapLabelRow.path30)) / 2 + 4}
									class="text-xs font-semibold fill-gray-800 dark:fill-gray-100"
								>
									{excess >= 0 ? `+${ha(excess)} über dem Ziel` : `${ha(-excess)} unter dem Ziel`}
								</text>
							{/if}
							{#if !isMobile}
								{@const end = lines.at(-1)}
								{#if end?.projected != null}
									<text
										x={innerWidth + 8}
										y={yScale(end.projected) + 4}
										class="text-xs font-semibold"
										fill={ACTUAL_COLOR}
									>
										{ha(end.projected)} bis {TARGET_YEAR}
									</text>
								{/if}
								{#if end?.path30 != null}
									<text
										x={innerWidth + 8}
										y={yScale(end.path30) - 4}
										class="text-xs"
										fill={TARGET_COLOR}
									>
										{ha(end.path30)} · {NATIONAL_TARGET_HA_PER_DAY} ha
									</text>
								{/if}
								{#if end?.path20 != null}
									<text
										x={innerWidth + 8}
										y={yScale(end.path20) + 12}
										class="text-xs"
										fill={TARGET_2030_COLOR}
									>
										{ha(end.path20)} · {NATIONAL_TARGET_2030_HA_PER_DAY} ha
									</text>
								{/if}
							{/if}
						{/if}

						<AxisY
							mode="labels"
							{yScale}
							{innerWidth}
							{innerHeight}
							tickCount={4}
							format={(v) => formatNumber(v)}
							unit="ha"
						/>
						<AxisX
							{xScale}
							{xDomain}
							{innerWidth}
							{innerHeight}
							format={String}
							tickCount={isMobile ? 4 : 8}
						/>
					</svelte:fragment>

					<svelte:fragment slot="tooltip" let:hover>
						{@const items = tooltipItems(hover.x)}
						<Tooltip
							visible={items.length > 0}
							x={hover.clientX}
							y={hover.clientY}
							title={`Ende ${hover.x}`}
							{items}
						/>
					</svelte:fragment>
				</Chart>
			</div>

			<div class="mt-2">
				<Legend items={legendItems} />
			</div>
		{/if}

		{#each data.notes as note}
			<p class="mt-2 text-xs text-gray-600 dark:text-gray-400">{note}</p>
		{/each}
	{/if}
</div>
