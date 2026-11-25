<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { linear } from 'svelte/easing';
	import {
		processChartData,
		getCategoryConfig,
		formatNumber,
		type HeatingDataPoint,
		type HeatingCategory
	} from './config';

	export let data: HeatingDataPoint[];
	export const categories: HeatingCategory[] = [];

	$: processed = processChartData(data);

	// Ring geometry (viewBox 110): grey track 36.5–47.5, coloured arc shares the inner edge and reaches out to 51.5
	const R = 42;
	const W = 11;
	const RA = 44;
	const WA = 15;
	const CA = 2 * Math.PI * RA;

	// Draw-in: one shared clock, each ring starts 90 ms after the previous and eases out over 900 ms.
	// Starts at 1 so server-rendered and reduced-motion output show the final state.
	const STAGGER = 90;
	const DURATION = 900;
	const progress = tweened(1, { easing: linear });
	let mounted = false;
	onMount(() => (mounted = true));

	$: if (mounted && data) animate(processed.visualised.length);

	function animate(count: number) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const total = DURATION + Math.max(0, count - 1) * STAGGER;
		progress.set(0, { duration: 0 });
		progress.set(1, { duration: total });
	}

	function ringProgress(p: number, index: number, count: number): number {
		const total = DURATION + Math.max(0, count - 1) * STAGGER;
		const local = Math.min(1, Math.max(0, (p * total - index * STAGGER) / DURATION));
		return 1 - Math.pow(1 - local, 3);
	}

	// Unique gradient ids per chart instance
	const uid = Math.random().toString(36).slice(2, 8);
</script>

<div class="grid grid-cols-2 min-[421px]:grid-cols-3 gap-x-3 gap-y-[18px]">
	{#each processed.visualised as datapoint, i}
		{@const category = getCategoryConfig(datapoint.category)}
		{@const color = category?.color ?? '#6B7280'}
		{@const pct = datapoint.percentage ?? 0}
		{@const t = ringProgress($progress, i, processed.visualised.length)}
		<figure class="group m-0 flex flex-col items-center text-center min-w-0">
			<svg
				viewBox="0 0 110 110"
				class="w-full max-w-24 h-auto overflow-visible transition-transform duration-200 group-hover:scale-[1.06]"
				role="img"
				aria-label="{category?.label || datapoint.category}: {formatNumber(pct)} Prozent, {formatNumber(datapoint.value)} Heizungen"
			>
				<defs>
					<linearGradient id="heating-{uid}-{i}" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" style="stop-color: color-mix(in srgb, {color} 55%, white)" />
						<stop offset="1" style="stop-color: {color}" />
					</linearGradient>
				</defs>
				<circle cx="55" cy="55" r={R} fill="none" stroke-width={W} class="stroke-gray-200 dark:stroke-gray-700" />
				<circle
					cx="55"
					cy="55"
					r={RA}
					fill="none"
					stroke="url(#heating-{uid}-{i})"
					stroke-width={WA}
					stroke-dasharray="{((pct / 100) * CA * t).toFixed(2)} {CA.toFixed(2)}"
					transform="rotate(-90 55 55)"
				/>
				<text x="55" y="57" text-anchor="middle" class="text-2xl font-bold fill-gray-900 dark:fill-white tabular-nums">
					{formatNumber(pct * t)}
				</text>
				<text x="55" y="72" text-anchor="middle" class="text-xs fill-gray-500 dark:fill-gray-400">Prozent</text>
			</svg>
			<figcaption>
				<div class="mt-1.5 font-bold leading-tight" style="color: {color}">
					{category?.label || datapoint.category}
				</div>
				<div class="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
					{formatNumber(datapoint.value)} Heizungen
				</div>
			</figcaption>
		</figure>
	{/each}
</div>

{#if processed.other.length > 0}
	<p class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
		<span class="font-semibold text-gray-900 dark:text-white"
			>Sonstige ({formatNumber(processed.other.reduce((s, d) => s + (d.percentage ?? 0), 0))}%):</span
		>
		{#each processed.other as datapoint, i}
			{@const category = getCategoryConfig(datapoint.category)}
			<span style="color: {category?.color}">
				{category?.label || datapoint.category} ({formatNumber(datapoint.percentage)}%)
			</span>
			{#if i !== processed.other.length - 1},
			{/if}
		{/each}
	</p>
{/if}
