<!-- $lib/components/charts/primitives/Chart.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { min, max } from 'd3-array';
	import { page } from '$app/state';
	import { t } from '$lib/utils/t';
	import type { DataPoint, HoverState } from '../types';

	// Props
	export let data: DataPoint[] = [];
	export let x: string = 'x';
	export let y: string | string[] = 'y';
	export let height: number = 300;
	export let margin = { top: 15, right: 20, bottom: 35, left: 55 };
	export let xType: 'linear' | 'band' = 'linear';
	export let yMin: number | null = null;
	export let yMax: number | null = null;
	export let padding: number = 0.2;

	// State
	let containerEl: HTMLElement;
	let width = 0;
	let ready = false;
	let hover: HoverState = { x: null, clientX: 0, clientY: 0 };

	// Dimensions
	$: innerWidth = Math.max(0, width - margin.left - margin.right);
	$: innerHeight = Math.max(0, height - margin.top - margin.bottom);

	// X domain
	$: xValues = data.map((d) => d[x]);
	$: xDomain = xType === 'band' ? xValues : [min(xValues) ?? 0, max(xValues) ?? 1];

	// Y domain
	$: yFields = Array.isArray(y) ? y : [y];
	$: allYValues = data.flatMap((d) => yFields.map((f) => d[f]).filter((v) => v != null));
	$: yDomain = [
		yMin ?? Math.min(0, min(allYValues) ?? 0),
		yMax ?? Math.max(0, max(allYValues) ?? 1)
	];

	// Scales - only create when we have valid dimensions
	$: xScale =
		innerWidth > 0
			? xType === 'band'
				? scaleBand().domain(xDomain).range([0, innerWidth]).padding(padding)
				: scaleLinear().domain(xDomain).range([0, innerWidth])
			: null;

	$: yScale = innerHeight > 0 ? scaleLinear().domain(yDomain).range([innerHeight, 0]).nice() : null;

	$: bandwidth =
		xScale && xType === 'band'
			? ((xScale as any).bandwidth?.() ?? 0)
			: (innerWidth / Math.max(data.length, 1)) * (1 - padding);

	// Mouse handling
	function handleMouseMove(e: MouseEvent) {
		if (!containerEl || !xScale) return;
		const rect = containerEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left - margin.left;

		let closestX: any = null;
		if (xType === 'band') {
			const bandScale = xScale as ReturnType<typeof scaleBand>;
			const step = bandScale.step();
			if (step > 0) {
				const index = Math.floor(mouseX / step);
				const domain = bandScale.domain();
				if (index >= 0 && index < domain.length) {
					closestX = domain[index];
				}
			}
		} else {
			const linearScale = xScale as ReturnType<typeof scaleLinear>;
			const xVal = linearScale.invert(mouseX);
			let minDist = Infinity;
			for (const d of data) {
				const dist = Math.abs(d[x] - xVal);
				if (dist < minDist) {
					minDist = dist;
					closestX = d[x];
				}
			}
		}

		hover = { x: closestX, clientX: e.clientX, clientY: e.clientY };
	}

	function handleMouseLeave() {
		hover = { x: null, clientX: 0, clientY: 0 };
	}

	onMount(() => {
		const measure = () => {
			if (containerEl) {
				const newWidth = containerEl.clientWidth;
				if (newWidth > 0) {
					width = newWidth;
					ready = true;
				}
			}
		};

		measure();

		// Also measure on next tick in case layout hasn't settled
		requestAnimationFrame(measure);

		const ro = new ResizeObserver(measure);
		if (containerEl) ro.observe(containerEl);

		return () => ro.disconnect();
	});
</script>

<div
	bind:this={containerEl}
	class="chart-container relative w-full select-none"
	style="height: {height}px;"
>
	{#if ready && width > 0 && innerWidth > 0 && height > 0 && xScale && yScale && data.length > 0}
		<svg {width} {height} class="overflow-visible">
			<g transform="translate({margin.left},{margin.top})">
				<slot
					{data}
					{x}
					{xScale}
					{yScale}
					{xDomain}
					{yDomain}
					{innerWidth}
					{innerHeight}
					{bandwidth}
					{hover}
				/>

				<rect
					width={innerWidth}
					height={innerHeight}
					fill="transparent"
					on:mousemove={handleMouseMove}
					on:mouseleave={handleMouseLeave}
					style="cursor: crosshair;"
				/>
			</g>
		</svg>

		<slot name="tooltip" {hover} {data} {x} {xScale} {yScale} {margin} />
	{:else if ready && data.length === 0}
		<div class="flex items-center justify-center h-full text-gray-400">{t(page.data.translations, 'status.noData')}</div>
	{:else}
		<!-- Loading placeholder while measuring -->
		<div class="h-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{/if}
</div>
