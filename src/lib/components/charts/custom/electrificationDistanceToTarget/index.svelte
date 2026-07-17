<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import { page } from '$app/stores';
	import TargetToggles from '$lib/components/electrification/TargetToggles.svelte';
	import TargetSources from '$lib/components/electrification/TargetSources.svelte';
	import {
		fetchElectrificationDataset,
		latestValue,
		TARGETS,
		REFERENCE_TARGETS,
		maxTargetValue,
		EU_REGION_CODE,
		SMALL_COUNTRY_CODES,
		type ElectrificationDataset
	} from '$lib/utils/electrification';
	import { strings, formatters, targetAnnotation, refLabel, toLang } from '$lib/utils/electrification.i18n';
	import { buildChartData } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let dataset: ElectrificationDataset | null = null;
	let loading = true;
	let error: string | null = null;

	let sort: 'value' | 'name' = 'value';

	$: lang = toLang($page.data.language?.code);
	$: t = strings(lang);
	$: f = formatters(lang);

	/** Contextual benchmarks, off by default. */
	let refIds: string[] = [];
	$: visibleRefs = REFERENCE_TARGETS.filter((r) => refIds.includes(r.id));
	$: refPoints = visibleRefs.flatMap((r) => r.points.map((p) => ({ ...p, ref: r })));

	// Re-fetches when the locale changes: region names come back translated.
	async function loadData(l: string) {
		loading = true;
		error = null;
		try {
			const result = await fetchElectrificationDataset(fetch, l);
			dataset = result;
			onChartData?.(buildChartData(result, l));
		} catch (e) {
			console.error('[electrificationDistanceToTarget] Error:', e);
			error = e instanceof Error ? e.message : strings(l).loadError;
			dataset = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	$: loadData(lang);

	interface Row {
		id: string;
		name: string;
		code: string;
		value: number;
		isEU: boolean;
		small: boolean;
		label: string;
	}

	// Bar-chart layout is width-driven: narrow screens get short country codes and
	// tight margins instead of full names, rather than shrinking everything via viewBox scale.
	let width = 900;
	$: isMobile = width < 500;
	// Benchmark labels get their own row above the EU ones rather than being nudged sideways
	// off their own lines, so the top margin has to grow to make room for it.
	$: margin = isMobile
		? { top: visibleRefs.length ? 44 : 26, right: 12, bottom: 26, left: 34 }
		: { top: visibleRefs.length ? 48 : 30, right: 16, bottom: 30, left: 130 };
	const rowH = 24;
	$: innerWidth = Math.max(10, width - margin.left - margin.right);
	$: innerHeight = rows.length * rowH;
	$: height = innerHeight + margin.top + margin.bottom;
	// This svg is not overflow-visible, so anything past the domain is hard-clipped: the domain
	// has to cover the highest visible target (60% for the Advisory Board's 2050 point).
	$: xMax = Math.max(55, Math.ceil((maxTargetValue(visibleRefs) + 5) / 5) * 5);
	$: xScale = scaleLinear().domain([0, xMax]).range([0, innerWidth]);
	$: xTicks = Array.from({ length: Math.floor(xMax / 10) + 1 }, (_, i) => i * 10);

	// `rows` (including the display label) is recomputed whenever isMobile changes, not just
	// once at mount — a plain helper called from the template wouldn't pick up that dependency.
	$: rows = dataset
		? (() => {
				const d = dataset as ElectrificationDataset;
				const r: Row[] = d.regions.map((reg) => {
					const isEU = reg.code === EU_REGION_CODE;
					const small = SMALL_COUNTRY_CODES.includes(reg.code);
					const base = isMobile ? (isEU ? 'EU-27' : reg.code.toUpperCase()) : reg.name;
					return {
						id: reg.id,
						name: reg.name,
						code: reg.code,
						value: latestValue(d, reg.id, 'total_economy') ?? 0,
						isEU,
						small,
						label: small ? `${base}*` : base
					};
				});
				if (sort === 'value') r.sort((a, b) => b.value - a.value);
				else r.sort((a, b) => a.name.localeCompare(b.name));
				return r;
			})()
		: [];

	let hoverId: string | null = null;
	let tip = { x: 0, y: 0 };
	function onEnter(row: Row, ev: PointerEvent) {
		hoverId = row.id;
		tip = { x: ev.clientX, y: ev.clientY };
	}
	function onLeave() {
		hoverId = null;
	}
	$: hoverRow = rows.find((r) => r.id === hoverId) ?? null;
	$: tooltipItems = hoverRow
		? [
				{ label: String(dataset?.latestYear ?? ''), value: f.pct(hoverRow.value, 1) },
				...TARGETS.map((tg) => ({
					label: t.dtVs(tg.year, f.pct(tg.value)),
					value: f.signedPP((hoverRow?.value ?? 0) - tg.value)
				})),
				...refPoints.map((p) => ({
					label: t.dtVsRef(refLabel(p.ref.id, lang), p.year, f.pct(p.value)),
					value: f.signedPP((hoverRow?.value ?? 0) - p.value)
				}))
			]
		: [];
</script>

{#if loading}
	<div class="h-[500px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[500px] flex items-center justify-center text-red-500">{error}</div>
{:else if !dataset}
	<div class="h-[500px] flex items-center justify-center text-gray-500">{t.noDataAvailable}</div>
{:else}
	<div>
		<div class="flex flex-wrap gap-4 items-center mb-3">
			<Switch
				label={t.sort}
				views={[
					{ key: 'value', label: t.sortValue },
					{ key: 'name', label: t.sortAZ }
				]}
				activeView={sort}
				on:itemClick={(e) => (sort = e.detail)}
			/>
			<TargetToggles bind:selected={refIds} />
		</div>

		<div class="relative" bind:clientWidth={width}>
			<svg viewBox="0 0 {width} {height}" width="100%" {height} role="img" aria-label={t.dtAria}>
				<g transform="translate({margin.left},{margin.top})">
					{#each xTicks as xt}
						<line
							x1={xScale(xt)}
							x2={xScale(xt)}
							y1="0"
							y2={innerHeight}
							stroke="currentColor"
							class="text-gray-200 dark:text-gray-700"
						/>
						{#if !isMobile || xt % 20 === 0}
							<text
								x={xScale(xt)}
								y={innerHeight + 20}
								text-anchor="middle"
								class="text-xs fill-gray-500 dark:fill-gray-400"
							>
								{f.pct(xt)}
							</text>
						{/if}
					{/each}

					{#each rows as r, i (r.id)}
						{@const cy = i * rowH}
						<g
							transform="translate(0,{cy})"
							opacity={hoverId && hoverId !== r.id ? 0.55 : 1}
						>
							<rect
								x="0"
								y="3"
								width={xScale(r.value)}
								height={rowH - 6}
								rx="2"
								fill={r.isEU ? '#F5AF4A' : '#4880A8'}
								opacity={r.small ? 0.55 : 1}
								role="presentation"
								on:pointerenter={(e) => onEnter(r, e)}
								on:pointerleave={onLeave}
							/>
							<text
								x="-6"
								y={rowH / 2}
								dy="0.32em"
								text-anchor="end"
								class="{isMobile ? 'text-[10px]' : 'text-xs'} fill-gray-900 dark:fill-gray-100"
								class:font-bold={r.isEU}
							>
								{r.label}
							</text>
							<text
								x={xScale(r.value) + 6}
								y={rowH / 2}
								dy="0.32em"
								class="{isMobile ? 'text-[9px]' : 'text-[11px]'} fill-gray-600 dark:fill-gray-300"
							>
								{f.pct(r.value, 1)}
							</text>
						</g>
					{/each}

					{#each TARGETS as tg (tg.year)}
						<line
							x1={xScale(tg.value)}
							x2={xScale(tg.value)}
							y1="-10"
							y2={innerHeight}
							stroke="#F5AF4A"
							stroke-dasharray="2 4"
						/>
						<text
							x={xScale(tg.value)}
							y="-14"
							text-anchor="middle"
							class="text-xs font-bold"
							fill="#F5AF4A"
							stroke="white"
							stroke-width="3"
							stroke-linejoin="round"
							paint-order="stroke fill"
						>
							{targetAnnotation(tg.year, tg.value, tg.sourceKey, isMobile, lang)}
						</text>
					{/each}

					<!-- Benchmarks get a second label row above the EU one; each keeps its own dash so
					     the lines aren't told apart by colour alone. -->
					{#each refPoints as p (`${p.ref.id}-${p.year}`)}
						<line
							x1={xScale(p.value)}
							x2={xScale(p.value)}
							y1="-28"
							y2={innerHeight}
							stroke={p.ref.color}
							stroke-dasharray={p.ref.dash}
						/>
						<text
							x={xScale(p.value)}
							y="-32"
							text-anchor="middle"
							class="text-xs font-bold"
							fill={p.ref.color}
							stroke="white"
							stroke-width="3"
							stroke-linejoin="round"
							paint-order="stroke fill"
						>
							{targetAnnotation(p.year, p.value, p.ref.sourceKey, isMobile, lang)}
						</text>
					{/each}
				</g>
			</svg>
		</div>

		<TargetSources refs={visibleRefs} />

		{#if hoverRow}
			<Tooltip visible={true} x={tip.x} y={tip.y} title={hoverRow.name} items={tooltipItems} />
		{/if}
	</div>
{/if}
