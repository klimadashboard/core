<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import {
		fetchElectrificationDataset,
		latestValue,
		TARGETS,
		EU_REGION_CODE,
		SMALL_COUNTRY_CODES,
		fmtPct,
		fmtSignedPP,
		type ElectrificationDataset
	} from '$lib/utils/electrification';
	import { buildChartData } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let dataset: ElectrificationDataset | null = null;
	let loading = true;
	let error: string | null = null;

	let sort: 'value' | 'name' = 'value';

	async function loadData() {
		loading = true;
		error = null;
		try {
			const result = await fetchElectrificationDataset(fetch);
			dataset = result;
			onChartData?.(buildChartData(result));
		} catch (e) {
			console.error('[electrificationDistanceToTarget] Error:', e);
			error = e instanceof Error ? e.message : 'Failed to load data';
			dataset = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	loadData();

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
	$: margin = isMobile
		? { top: 26, right: 12, bottom: 26, left: 34 }
		: { top: 30, right: 16, bottom: 30, left: 130 };
	const rowH = 24;
	$: innerWidth = Math.max(10, width - margin.left - margin.right);
	$: innerHeight = rows.length * rowH;
	$: height = innerHeight + margin.top + margin.bottom;
	$: xScale = scaleLinear().domain([0, 55]).range([0, innerWidth]);
	const xTicks = [0, 10, 20, 30, 40, 50];

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
				{ label: String(dataset?.latestYear ?? ''), value: fmtPct(hoverRow.value, 1) },
				...TARGETS.map((t) => ({
					label: `vs ${t.year} (${fmtPct(t.value)})`,
					value: fmtSignedPP(hoverRow.value - t.value)
				}))
			]
		: [];
</script>

{#if loading}
	<div class="h-[500px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[500px] flex items-center justify-center text-red-500">{error}</div>
{:else if !dataset}
	<div class="h-[500px] flex items-center justify-center text-gray-500">No data available</div>
{:else}
	<div>
		<div class="flex flex-wrap gap-4 items-center mb-3">
			<Switch
				label="Sort"
				views={[
					{ key: 'value', label: 'Value' },
					{ key: 'name', label: 'A–Z' }
				]}
				activeView={sort}
				on:itemClick={(e) => (sort = e.detail)}
			/>
		</div>

		<div class="relative" bind:clientWidth={width}>
			<svg viewBox="0 0 {width} {height}" width="100%" {height} role="img" aria-label="Distance to the EU electrification targets">
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
								{fmtPct(xt)}
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
								{fmtPct(r.value, 1)}
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
							{isMobile ? fmtPct(tg.value) : `${tg.year} · ${fmtPct(tg.value)}`}
						</text>
					{/each}
				</g>
			</svg>
		</div>

		{#if hoverRow}
			<Tooltip visible={true} x={tip.x} y={tip.y} title={hoverRow.name} items={tooltipItems} />
		{/if}
	</div>
{/if}
