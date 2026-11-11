<!--
	Public transport supply per mode as horizontal bars, each bar drawn as the vehicle itself:
	a train, tram or bus whose body stretches to the value. Year via slider; changing it
	(and the first render) lets the vehicles grow/shrink, skipped with prefers-reduced-motion.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { scaleLinear } from 'd3-scale';
	import { tweened } from 'svelte/motion';
	import { prefersReducedMotion } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Tooltip } from '$lib/components/charts/primitives';
	import { RangeSlider } from '$lib/components/ui';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import { formatNumber } from '$lib/utils/formatters';
	import { t } from '$lib/utils/t';
	import Vehicle from './Vehicle.svelte';
	import {
		fetchPtSupply,
		buildChartData,
		getScale,
		unitLabel,
		signedPercent,
		type PtSupplyData,
		type PtMode
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let chart: { config?: Record<string, any> | null } | null = null;

	$: translations = (page.data?.translations ?? {}) as Record<string, string>;
	$: lang = page.params?.lang ?? 'de';
	$: regionId = region?.id ?? page.data?.page?.id ?? null;
	$: parentIds = ((region ?? page.data?.page)?.parents ?? []).map((p: { id: string }) => p.id);

	let data: PtSupplyData | null = null;
	let loading = true;
	let error: string | null = null;
	let loadedFor: string | null = null;

	$: if (regionId !== loadedFor) load(regionId);

	async function load(id: string | null) {
		loadedFor = id;
		loading = true;
		error = null;
		try {
			data = await fetchPtSupply({
				regionId: id,
				parentIds,
				lang,
				fetch,
				chartConfig: chart?.config
			});
			if (data) year = data.years[data.years.length - 1];
			onChartData?.(data ? buildChartData(data, translations) : null);
		} catch (e) {
			console.error('[ptSupply]', e);
			error = e instanceof Error ? e.message : String(e);
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// ── layout ───────────────────────────────────────────────────────────────
	const LANE = 54;
	const AXIS = 24;
	let width = 0;
	let year = 0;
	$: years = data?.years ?? [];
	$: modes = data?.modes ?? [];
	$: yearIndex = Math.max(0, years.indexOf(year));
	$: NAME = width < 500 ? 84 : 110;
	$: LABEL = width < 500 ? 64 : 120;
	$: barWidth = Math.max(40, width - NAME - LABEL);
	$: maxValue = Math.max(0, ...modes.flatMap((m) => m.values.map((v) => v ?? 0)));
	$: scale = getScale(maxValue, translations);
	$: unit = data ? `${scale.label} ${unitLabel(data.type, translations)}`.trim() : '';
	$: x = scaleLinear().domain([0, maxValue]).range([0, barWidth]).nice();
	// leave room for the unit label at the right end of the axis (≈ 6 px per character)
	$: ticks = x.ticks(width < 500 ? 3 : 5).filter((d) => x(d) < width - NAME - unit.length * 6 - 12);
	$: height = modes.length * LANE + AXIS;
	$: fmt = (v: number | null) => (v == null ? '–' : formatNumber(v / scale.divisor, 1));

	// ── motion: bar lengths tween between years; starts from 0 ───────────────
	const lengths = tweened<number[]>([], { easing: cubicInOut });
	$: target = modes.map((m) => x(m.values[yearIndex] ?? 0));
	$: if (width > 0 && modes.length) {
		const from = $lengths.length === target.length ? undefined : target.map(() => 0);
		if (from) lengths.set(from, { duration: 0 });
		lengths.set(target, { duration: prefersReducedMotion.current ? 0 : 900 });
	}

	const pct = (a: number | null, b: number | null) => (a && b != null ? (b / a - 1) * 100 : null);

	// ── tooltip ──────────────────────────────────────────────────────────────
	let hovered: PtMode | null = null;
	let hx = 0;
	let hy = 0;
	function track(e: MouseEvent, mode: PtMode) {
		hovered = mode;
		hx = e.clientX;
		hy = e.clientY;
	}

	$: ariaLabel = data
		? `${unitLabel(data.type, translations)} ${year}: ` +
			modes.map((m) => `${m.label} ${fmt(m.values[yearIndex])} ${scale.label}`).join(', ')
		: '';
</script>

{#if loading}
	<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data || !modes.length}
	<!-- No data: render nothing, the Card hides the chart -->
{:else}
	{#if years.length > 1}
		<ChartSettings>
			<div class="w-full max-w-xs">
				<RangeSlider
					label={t(translations, 'ui.time.year')}
					bind:value={year}
					min={years[0]}
					max={years[years.length - 1]}
				/>
			</div>
		</ChartSettings>
	{/if}

	<p class="mb-2 text-sm">
		<span class="font-bold">{t(translations, 'table.total')}: {fmt(data.totals[yearIndex])} {unit}</span>
		{#if data.operator}<span class="opacity-70"> · {data.operator}</span>{/if}
	</p>

	<div bind:clientWidth={width} class="relative w-full select-none" style="height: {height}px">
		{#if width > 0}
			<svg {width} {height} role="img" aria-label={ariaLabel}>
				<!-- grid + axis -->
				<g transform="translate({NAME},0)">
					{#each ticks as tick}
						<line
							x1={x(tick)}
							x2={x(tick)}
							y1="4"
							y2={modes.length * LANE}
							class="stroke-current"
							opacity={tick === 0 ? 0.3 : 0.08}
						/>
						<text
							x={x(tick)}
							y={modes.length * LANE + 16}
							text-anchor="middle"
							fill="currentColor"
							class="text-xs opacity-70">{formatNumber(tick / scale.divisor, 0)}</text
						>
					{/each}
					<text
						x={width - NAME}
						y={modes.length * LANE + 16}
						text-anchor="end"
						fill="currentColor"
						class="text-xs opacity-70">{unit}</text
					>
				</g>

				{#each modes as mode, i (mode.key)}
					{@const ground = i * LANE + 40}
					{@const len = $lengths[i] ?? 0}
					{@const change = yearIndex > 0 ? pct(mode.values[0], mode.values[yearIndex]) : null}
					<g
						role="presentation"
						opacity={hovered && hovered.key !== mode.key ? 0.4 : 1}
						class="transition-opacity"
						on:mouseenter={(e) => track(e, mode)}
						on:mousemove={(e) => track(e, mode)}
						on:mouseleave={() => (hovered = null)}
					>
						<rect x="0" y={i * LANE} {width} height={LANE} fill="transparent" />
						<text
							x="0"
							y={ground - 12}
							dominant-baseline="middle"
							fill="currentColor"
							class="{width < 500 ? 'text-xs' : 'text-sm'} font-semibold">{mode.label}</text
						>
						<g transform="translate({NAME},0)">
							<!-- rails or road along the whole lane -->
							{#if mode.vehicle === 'bus'}
								<rect x="0" y={ground} width={barWidth} height="3" rx="1" fill="currentColor" opacity="0.08" />
							{:else}
								<line
									x1="0"
									x2={barWidth}
									y1={ground + 0.5}
									y2={ground + 0.5}
									class="stroke-current"
									opacity="0.2"
								/>
								<line
									x1="0"
									x2={barWidth}
									y1={ground + 2}
									y2={ground + 2}
									class="stroke-current"
									stroke-width="3"
									stroke-dasharray="1.5 4"
									opacity="0.1"
								/>
							{/if}
							<g transform="translate(0,{ground})">
								<Vehicle vehicle={mode.vehicle} length={len} color={mode.color} />
							</g>
							<text
								x={len + 8}
								y={change != null ? ground - 19 : ground - 9}
								fill="currentColor"
								class="text-sm font-bold"
								>{fmt(mode.values[yearIndex])}<tspan class="font-normal">{' '}{scale.label}</tspan></text
							>
							{#if change != null}
								<text x={len + 8} y={ground - 2} fill="currentColor" class="text-xs">
									<tspan class="font-semibold">{signedPercent(change)}</tspan>{#if width >= 500}<tspan
											fill-opacity="0.7"
											>{' '}{t(translations, 'ui.time.vsYear').replace('{year}', String(years[0]))}</tspan
										>{/if}
								</text>
							{/if}
						</g>
					</g>
				{/each}
			</svg>

			{#if hovered}
				<Tooltip
					visible={true}
					x={hx}
					y={hy}
					title={hovered.label}
					items={years.map((y, i) => ({
						label: String(y),
						value: `${fmt(hovered?.values[i] ?? null)} ${unit}`,
						color: y === year ? hovered?.color : '#9ca3af'
					}))}
				/>
			{/if}
		{/if}
	</div>
{/if}
