<!-- $lib/components/charts/custom/snow/index.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { scaleBand, scaleLinear } from 'd3-scale';
	import type { ChartData } from '$lib/components/charts/types';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import StationPicker from '$lib/components/charts/custom/stationPicker/index.svelte';
	import { t } from '$lib/utils/t';
	import { fetchSnowData, buildChartData, SNOW_COLOR, type SnowResult } from './config';

	// Props
	export let chart: any = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// State
	let selectedStation: any = null;
	let result: SnowResult | null = null;
	let loading = false;

	// Chart config
	const height = 320;
	const margin = { top: 20, right: 20, bottom: 30, left: 40 };

	// Resize tracking
	let containerEl: HTMLElement;
	let width = 0;

	$: innerWidth = Math.max(0, width - margin.left - margin.right);
	$: innerHeight = Math.max(0, height - margin.top - margin.bottom);

	// Hover state
	let hoveredYear: number | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	// ResizeObserver - observe when element becomes available
	let ro: ResizeObserver | null = null;

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.width > 0) width = entry.contentRect.width;
			}
		});
		return () => ro?.disconnect();
	});

	$: if (containerEl && ro) {
		ro.observe(containerEl);
		width = containerEl.clientWidth;
	}

	// Load data when station changes
	$: if (selectedStation) loadData(selectedStation.id);

	async function loadData(stationId: string) {
		loading = true;
		try {
			result = await fetchSnowData(stationId);
			if (onChartData && result) {
				onChartData(buildChartData(result, page.data.translations || {}));
			}
		} catch (e) {
			console.error('Error fetching snow data:', e);
			result = null;
			onChartData?.({ raw: [], hasData: false, table: { columns: [], rows: [], filename: '' }, placeholders: {}, meta: {} });
		} finally {
			loading = false;
		}
	}

	// Data and scales
	$: winters = result?.winters ?? [];
	$: xDomain = winters.map((w) => w.year);
	$: yMax = Math.max(...winters.map((w) => w.daysWithSnow), 0) * 1.1;

	$: xScale = scaleBand<number>().domain(xDomain).range([0, innerWidth]).padding(0.15);
	$: yScale = scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);
	$: barWidth = xScale.bandwidth();

	// X-axis ticks (responsive)
	$: tickCount = width > 600 ? 10 : width > 400 ? 6 : 4;
	$: xTicks = xDomain.length <= tickCount
		? xDomain
		: xDomain.filter((_, i) => i % Math.ceil(xDomain.length / tickCount) === 0);

	function formatWinterLabel(year: number): string {
		return `${year}/${String(year + 1).slice(2)}`;
	}

	// Tooltip
	$: tooltipData = (() => {
		if (hoveredYear === null) return null;
		const w = winters.find((w) => w.year === hoveredYear);
		if (!w) return null;
		const items = [{ label: 'Schneedeckentage', value: `${w.daysWithSnow}`, color: SNOW_COLOR }];
		if (w.totalSnowAccumulation > 0) items.push({ label: 'Neuschnee', value: `${Math.round(w.totalSnowAccumulation)} cm` });
		if (w.isCurrentWinter) items.push({ label: 'Status', value: 'Laufend (unvollständig)' });
		return { title: `Winter ${w.label}`, items };
	})();

	function handleMouseMove(e: MouseEvent, year: number) {
		hoveredYear = year;
		hoverClientX = e.clientX;
		hoverClientY = e.clientY;
	}
</script>

<div>
	<StationPicker bind:selectedStation {chart} snowCoverageMinimum={90} />

	{#if !selectedStation}
		<p class="max-w-2xl mx-auto mb-2 text-center">
			Wähle eine Wetterstation aus, um mehr zum Schneefall in deiner Region zu erfahren. Es werden
			nur Wetterstationen mit Schneemessungen angezeigt.
		</p>
	{:else if loading}
		<p class="text-sm text-gray-500">{t(page.data.translations, 'status.loadingData')}</p>
	{:else if result && winters.length > 0}
		<!-- Headline -->
		{#if result.recordWinter && result.recordWinter.daysWithSnow < 200}
			{@const lastCompleted = winters.filter((w) => !w.isCurrentWinter).slice(-1)[0]}
			<h2 class="text-2xl max-w-4xl text-center mx-auto text-balance mb-4">
				Im Rekordwinter {result.recordWinter.label} verzeichnete die Wetterstation {result.station.name}
				{result.recordWinter.daysWithSnow} Tage mit einer Schneehöhe von mindestens 1cm{#if lastCompleted}
					– im Winter {lastCompleted.label} waren es {lastCompleted.daysWithSnow}.{/if}
			</h2>
		{/if}

		<!-- Chart -->
		<div bind:this={containerEl} class="relative select-none w-full" style="height: {height}px;">
			{#if width > 0}
				<svg {width} {height}>
					<!-- Y axis -->
					<g transform="translate(0,{margin.top})">
						{#each yScale.ticks(5) as tick, i}
							{@const isLast = i === yScale.ticks(5).length - 1}
							<g transform="translate(0,{yScale(tick)})" class="text-xs">
								<line x1={margin.left} x2={width - margin.right} class="stroke-current opacity-10" />
								<text x={margin.left - 4} dominant-baseline="middle" text-anchor="end" fill="currentColor" class="opacity-70">{tick}</text>
								{#if isLast}
									<text x={margin.left + 2} dominant-baseline="middle" fill="currentColor" class="opacity-70">Tage</text>
								{/if}
							</g>
						{/each}
					</g>

					<!-- X axis -->
					<g transform="translate({margin.left},{margin.top + innerHeight})">
						{#each xTicks as year}
							<g transform="translate({(xScale(year) ?? 0) + barWidth / 2},0)" class="text-xs">
								<line y2={5} class="stroke-current opacity-10" />
								<text y={18} text-anchor="middle" fill="currentColor" class="opacity-70">{formatWinterLabel(year)}</text>
							</g>
						{/each}
					</g>

					<!-- Bars -->
					<g transform="translate({margin.left},{margin.top})">
						{#each winters as w}
							{@const x = xScale(w.year) ?? 0}
							{@const y = yScale(w.daysWithSnow)}
							{@const h = innerHeight - y}
							{@const dimmed = hoveredYear !== null && hoveredYear !== w.year}

							<rect
								{x} {y} width={barWidth} height={h}
								fill={w.isCurrentWinter ? 'transparent' : SNOW_COLOR}
								stroke={w.isCurrentWinter ? SNOW_COLOR : 'none'}
								stroke-width={w.isCurrentWinter ? 1.5 : 0}
								stroke-dasharray={w.isCurrentWinter ? '3,2' : 'none'}
								opacity={dimmed ? 0.4 : 1}
								class="cursor-pointer transition-opacity"
								on:mouseenter={(e) => handleMouseMove(e, w.year)}
								on:mousemove={(e) => { hoverClientX = e.clientX; hoverClientY = e.clientY; }}
								on:mouseleave={() => (hoveredYear = null)}
							/>
						{/each}
					</g>
				</svg>

				{#if tooltipData}
					<Tooltip visible={true} x={hoverClientX} y={hoverClientY} title={tooltipData.title} items={tooltipData.items} />
				{/if}
			{:else}
				<div class="h-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
			{/if}
		</div>

		<!-- Description -->
		<p class="text-lg mt-4">
			Während es auch in den vergangenen Jahren einzelne Winter mit relativ hoher Schneedeckung gab,
			ist über die vergangenen Jahre insgesamt ein Rückgang in der Anzahl der Tage mit mindestens 1
			cm Schnee zu beobachten. Die Schwankungen zwischen den Jahren bleiben dabei deutlich.
		</p>

		<!-- Legend -->
		{#if winters.some((w) => w.isCurrentWinter)}
			<div class="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
				<span class="w-4 h-3 border border-dashed rounded-sm" style="border-color: {SNOW_COLOR}; border-width: 1.5px;"></span>
				<span>Laufender Winter (unvollständig)</span>
			</div>
		{/if}
	{:else if result}
		<p class="text-sm text-gray-500 text-center">Keine Schneedaten für diese Station verfügbar.</p>
	{/if}
</div>
