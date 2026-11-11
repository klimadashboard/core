<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Chart, AxisX, AxisY, BarY, RuleY, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';
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

	const BAR_COLOR = '#B7693D';
	const TARGET_COLOR = '#4880A8';
	const TARGET_2030_COLOR = '#65987D';

	let data: SoilSealingRawData | null = null;
	let loading = true;
	let error: string | null = null;
	let containerWidth = 0;

	$: isMobile = containerWidth < 500;
	$: bars = (data?.series ?? []).filter((d) => d.perDay != null);
	$: latestPeriod = bars.at(-1)?.period;
	$: history = bars.slice(0, -1).filter((d) => !d.breakNote);
	$: latest = bars.slice(-1);
	// Years distorted by a data correction: hatched, with a footnote
	$: breakBars = bars.slice(0, -1).filter((d) => d.breakNote);
	$: breakNotes = [...new Set(breakBars.map((d) => d.breakNote as string))];
	const hatchId = `soil-sealing-hatch-${Math.random().toString(36).slice(2, 8)}`;
	// The 2030 target is drawn as an extra bar after the last data year (PV chart style)
	const TARGET_YEAR = '2030';
	// Years between the last data year and 2030 stay empty, so the gap to the target reads as time
	$: gapYears = Array.from(
		{ length: Math.max(0, Number(TARGET_YEAR) - Number(latestPeriod ?? TARGET_YEAR) - 1) },
		(_, i) => ({ period: String(Number(latestPeriod) + 1 + i), perDay: null })
	);
	$: chartData =
		data?.target2030 != null
			? [...bars, ...gapYears, { period: TARGET_YEAR, perDay: data.target2030 }]
			: bars;
	$: values = [...bars.map((d) => d.perDay as number), data?.target ?? 0];
	// Headroom for the value labels above the bars
	$: yMax = Math.max(0.1, ...values) * 1.2;
	$: yMin = Math.min(0, ...values);
	$: targetFactor =
		data?.target && data.latest.perDay != null ? data.latest.perDay / data.target : null;

	$: legendItems = [
		{ key: 'perDay', label: 'Zuwachs pro Tag', color: BAR_COLOR },
		...(data?.target != null
			? [{ key: 'target', label: `Anteil am ${NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel`, color: TARGET_COLOR, dashed: true }]
			: [])
	];

	const ha = (v: number, decimals = 1) => `${formatNumber(v, decimals)} ha`;
	const pitches = (v: number) => {
		const n = v / FOOTBALL_PITCH_HA;
		return `≈ ${formatPitches(n)} ${n >= 0.95 && n < 1.05 ? 'Fußballfeld' : 'Fußballfelder'}`;
	};

	function tooltipItems(period: string | null) {
		if (period === TARGET_YEAR && data?.target2030 != null) {
			return [
				{ label: `${NATIONAL_TARGET_2030_HA_PER_DAY}-ha-Ziel 2030`, value: ha(data.target2030), color: TARGET_2030_COLOR },
				{ label: 'entspricht', value: pitches(data.target2030) },
				...(data.latest.perDay != null
					? [{ label: `Zuwachs ${data.latest.period}`, value: ha(data.latest.perDay), color: BAR_COLOR }]
					: [])
			];
		}
		const row = bars.find((d) => d.period === period);
		if (!row) return [];
		return [
			{ label: 'Zuwachs pro Tag', value: ha(row.perDay as number), color: BAR_COLOR },
			{ label: 'entspricht', value: pitches(row.perDay as number) },
			{ label: `Zuwachs im Jahr`, value: ha(row.added as number, 0) },
			...(row.breakNote ? [{ label: 'Hinweis', value: 'Datenkorrektur*' }] : []),
			...(data?.target != null
				? [{ label: `${NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel`, value: ha(data.target), color: TARGET_COLOR }]
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

	$: loadData(region);
</script>

<div bind:clientWidth={containerWidth}>
	{#if loading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data || !bars.length}
		<div class="h-[300px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<Chart
			data={chartData}
			x="period"
			y="perDay"
			xType="band"
			height={isMobile ? 240 : 280}
			{yMin}
			{yMax}
			padding={isMobile ? 0.2 : 0.3}
			margin={{ top: 20, right: isMobile ? 8 : 16, bottom: 30, left: isMobile ? 36 : 44 }}
		>
			<svelte:fragment
				slot="default"
				let:xScale
				let:yScale
				let:xDomain
				let:innerWidth
				let:innerHeight
				let:bandwidth
				let:hover
			>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} tickCount={4} />

				<!-- The 30 ha target spans the data years only; 2030 has its own target bar -->
				{@const targetEnd =
					xScale && latestPeriod && 'step' in xScale
						? (xScale as any)(latestPeriod) + bandwidth + ((xScale as any).step() - bandwidth) / 2
						: innerWidth}
				{#if data.target != null && yScale}
					<!-- Zielbereich: everything at or below the region's share of the target -->
					<rect
						x={0}
						y={yScale(data.target)}
						width={targetEnd}
						height={Math.max(0, yScale(0) - yScale(data.target))}
						fill={TARGET_COLOR}
						opacity={0.12}
					/>
				{/if}

				<BarY data={history} x="period" y="perDay" {xScale} {yScale} {hover} color={BAR_COLOR} opacity={0.55} radius={3} />
				{#if breakBars.length}
					<defs>
						<pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
							<line x1="0" y1="0" x2="0" y2="6" stroke={BAR_COLOR} stroke-width="2.5" />
						</pattern>
					</defs>
					<BarY data={breakBars} x="period" y="perDay" {xScale} {yScale} {hover} color="url(#{hatchId})" radius={3} />
				{/if}
				<BarY data={latest} x="period" y="perDay" {xScale} {yScale} {hover} color={BAR_COLOR} radius={3} />

				{#if xScale && yScale && bandwidth >= 18}
					{#each bars as d (d.period)}
						<text
							x={((xScale as any)(d.period) ?? 0) + bandwidth / 2}
							y={yScale(Math.max(0, d.perDay ?? 0)) - 5}
							text-anchor="middle"
							class="text-[11px] tabular-nums {d.period === latestPeriod
								? 'font-bold fill-gray-900 dark:fill-white'
								: 'fill-gray-600 dark:fill-gray-400'}"
						>
							{formatNumber(d.perDay ?? 0, 1)}{d.breakNote ? '*' : ''}
						</text>
					{/each}
				{/if}

				{#if data.target != null && yScale}
					<RuleY y={data.target} {yScale} innerWidth={targetEnd} stroke={TARGET_COLOR} strokeWidth={2} strokeDasharray="6 4" />
					<text
						x={4}
						y={yScale(data.target) - 6}
						class="text-[11px] font-semibold stroke-white dark:stroke-gray-900"
						fill={TARGET_COLOR}
						stroke-width="3"
						paint-order="stroke"
					>
						{NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel: {ha(data.target)}/Tag
					</text>
				{/if}

				{#if data.target2030 != null && xScale && yScale}
					{@const tx = (xScale as any)(TARGET_YEAR) ?? 0}
					{@const ty = yScale(data.target2030)}
					{@const th = Math.max(0, yScale(0) - ty)}
					{@const dimmed = hover.x !== null && hover.x !== TARGET_YEAR}
					<g opacity={dimmed ? 0.4 : 1} class="transition-opacity duration-100">
						<!-- Light fill + dashed outline, as the target bars in the PV chart -->
						<rect x={tx} y={ty} width={bandwidth} height={th} fill={TARGET_2030_COLOR} opacity="0.25" />
						<rect
							x={tx}
							y={ty}
							width={bandwidth}
							height={th}
							fill="none"
							stroke={TARGET_2030_COLOR}
							stroke-width="1.5"
							stroke-dasharray="4,2"
						/>
						{#if bandwidth >= 18}
							<text
								x={tx + bandwidth / 2}
								y={ty - 5}
								text-anchor="middle"
								class="text-[11px] font-bold tabular-nums"
								fill={TARGET_2030_COLOR}
							>
								{formatNumber(data.target2030, 1)}
							</text>
						{/if}
					</g>
				{/if}

				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					tickCount={4}
					format={(v) => formatNumber(v, 0)}
					unit="ha/Tag"
				/>
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={String}
					tickCount={isMobile ? 4 : 14}
					forceTicks={[latestPeriod, data.target2030 != null ? TARGET_YEAR : null].filter(Boolean) as any[]}
				/>
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				<Tooltip
					visible={hover.x !== null && tooltipItems(hover.x).length > 0}
					x={hover.clientX}
					y={hover.clientY}
					title={`Jahr ${hover.x ?? ''}`}
					items={tooltipItems(hover.x)}
				/>
			</svelte:fragment>
		</Chart>

		<div class="flex flex-wrap items-baseline justify-between gap-2 mt-2">
			<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
				<Legend items={legendItems} />
				{#if data.target2030 != null}
					<span class="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
						<span
							class="inline-block w-3 h-3 rounded-sm border-[1.5px] border-dashed"
							style="border-color: {TARGET_2030_COLOR}; background: {TARGET_2030_COLOR}33"
						></span>
						{NATIONAL_TARGET_2030_HA_PER_DAY}-ha-Ziel 2030
					</span>
				{/if}
			</div>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Ø {data.firstYear}–{data.latest.period}: {ha(data.averagePerDay)} pro Tag{breakBars.length ? '*' : ''}
			</p>
		</div>

		{#each breakNotes as note}
			<p class="mt-2 flex gap-2 text-xs text-gray-600 dark:text-gray-400">
				<svg width="12" height="12" class="mt-0.5 shrink-0" aria-hidden="true">
					<rect width="12" height="12" fill="url(#{hatchId})" />
				</svg>
				<span>
					* {breakBars
						.filter((d) => d.breakNote === note)
						.map((d) => d.period)
						.join(', ')}: {note}
				</span>
			</p>
		{/each}

		<dl
			class="mt-4 grid grid-cols-1 sm:grid-cols-3 border-t border-gray-200 dark:border-gray-800 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-800"
		>
			<div class="py-3 sm:pr-4">
				<dt class="text-sm text-gray-600 dark:text-gray-400">Zuwachs pro Tag {data.latest.period}</dt>
				<dd class="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
					{data.latest.perDay != null ? ha(data.latest.perDay) : '–'}
				</dd>
				<dd class="text-sm text-gray-600 dark:text-gray-400">
					{#if data.latest.perDay != null}{pitches(data.latest.perDay)}{/if}{#if targetFactor != null && targetFactor > 1},
						{formatNumber(targetFactor, 1)}-mal das {NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel{/if}
				</dd>
			</div>
			<div class="py-3 sm:px-4">
				<dt class="text-sm text-gray-600 dark:text-gray-400">Zielwerte pro Tag</dt>
				<dd class="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
					{data.target != null ? ha(data.target) : '–'}
					{#if data.target2030 != null}
						<span class="text-gray-400 dark:text-gray-600 font-normal">/</span> {ha(data.target2030)}
					{/if}
				</dd>
				<dd class="text-sm text-gray-600 dark:text-gray-400">
					{NATIONAL_TARGET_HA_PER_DAY}-ha-Ziel{#if data.target2030 != null}{' / '}{NATIONAL_TARGET_2030_HA_PER_DAY}-ha-Ziel 2030{/if}{#if data.populationShare != null},
						nach Einwohneranteil ({formatPercent(data.populationShare * 100, 1)}){/if}
				</dd>
			</div>
			<div class="py-3 sm:pl-4">
				<dt class="text-sm text-gray-600 dark:text-gray-400">Siedlungs- und Verkehrsfläche</dt>
				<dd class="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{ha(data.latest.suv, 0)}</dd>
				<dd class="text-sm text-gray-600 dark:text-gray-400">{formatPercent(data.suvShare, 1)} der Gesamtfläche</dd>
			</div>
		</dl>
	{/if}
</div>
