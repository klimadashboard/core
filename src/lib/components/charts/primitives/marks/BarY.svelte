<!-- $lib/components/charts/primitives/marks/BarY.svelte -->
<script lang="ts">
	import type { HoverState } from '../../types';

	export let data: any[] = [];
	export let x: string = 'x';
	export let y: string = 'value';
	export let xScale: any;
	export let yScale: any;
	export let color: string = '#3b82f6';
	export let opacity: number = 1;
	export let hover: HoverState = { x: null, clientX: 0, clientY: 0 };
	export let hoverDim: boolean = true;

	$: isBandScale = xScale && 'bandwidth' in xScale;

	$: bandwidth = isBandScale
		? xScale.bandwidth()
		: xScale && data.length > 1
			? Math.max(1, Math.abs((xScale(data[1]?.[x]) ?? 0) - (xScale(data[0]?.[x]) ?? 0)) - 2)
			: 20;

	$: zeroY = yScale?.(0) ?? 0;

	// Debug
	$: if (xScale && data.length > 0) {
		console.log('[BarY] Debug:', {
			isBandScale,
			bandwidth,
			xField: x,
			firstDataX: data[0]?.[x],
			firstBarX: xScale(data[0]?.[x]),
			secondBarX: data[1] ? xScale(data[1]?.[x]) : 'N/A',
			scaleRange: xScale.range?.(),
			scaleDomain: xScale.domain?.()
		});
	}

	function getBarX(d: any): number {
		if (!xScale) return 0;
		const val = xScale(d[x]) ?? 0;
		if (isBandScale) return val;
		return val - bandwidth / 2;
	}
</script>

{#if xScale && yScale && data.length > 0}
	<g class="mark-bar-y">
		{#each data as d, i}
			{@const barX = getBarX(d)}
			{@const value = d[y]}
			{@const barY = value >= 0 ? yScale(value) : zeroY}
			{@const barHeight = Math.abs(yScale(value) - zeroY)}
			{@const isHovered = hover.x === d[x]}
			{@const dimmed = hoverDim && hover.x !== null && !isHovered}

			{#if i < 3}
				<!-- Debug first few bars -->
				{@const _ = console.log(
					`[BarY] Bar ${i}: x=${d[x]}, barX=${barX}, value=${value}, barY=${barY}, height=${barHeight}`
				)}
			{/if}

			<rect
				x={barX}
				y={barY}
				width={bandwidth}
				height={barHeight}
				fill={color}
				opacity={dimmed ? opacity * 0.4 : opacity}
				class="transition-opacity duration-100"
			/>
		{/each}
	</g>
{/if}
