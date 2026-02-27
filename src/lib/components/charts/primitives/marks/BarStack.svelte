<!--
	Stacked Bar mark — renders pre-computed stacked segments.
	Each data item must have:
	  - a key matching the x field (e.g. label)
	  - a `segments` array with { key, value, y0, y1, color, label? }

	Usage:
		<BarStack {data} x="label" {xScale} {yScale} {hover} />
-->
<script lang="ts">
	import type { HoverState } from '../../types';

	export let data: Array<{
		[key: string]: any;
		segments: Array<{ key: string; value: number; y0: number; y1: number; color: string; label?: string }>;
	}> = [];
	export let x: string = 'x';
	export let xScale: any;
	export let yScale: any;
	export let hover: HoverState = { x: null, clientX: 0, clientY: 0 };
	export let hoverDim: boolean = true;
	export let radius: number = 0;
</script>

{#if xScale && yScale && data.length > 0}
	<g class="mark-bar-stack">
		{#each data as d}
			{@const barX = xScale(d[x]) ?? 0}
			{@const bw = xScale.bandwidth?.() ?? 20}
			{@const isHovered = hover.x === d[x]}
			{@const dimmed = hoverDim && hover.x !== null && !isHovered}

			{#each d.segments as seg, si}
				{@const segY = yScale(seg.y1)}
				{@const segH = Math.max(0, yScale(seg.y0) - yScale(seg.y1))}
				{@const isTop = si === d.segments.length - 1}

				<rect
					x={barX}
					y={segY}
					width={bw}
					height={segH}
					fill={seg.color}
					opacity={dimmed ? 0.4 : 1}
					rx={isTop && radius ? radius : 0}
					ry={isTop && radius ? radius : 0}
					class="transition-opacity duration-100"
				>
					<title>{seg.label || seg.key}: {seg.value.toLocaleString('de-AT')}</title>
				</rect>
			{/each}
		{/each}
	</g>
{/if}
