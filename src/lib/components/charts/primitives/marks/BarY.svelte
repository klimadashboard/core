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
	/** Corner radius of the bar's top (or bottom, for negative values) */
	export let radius: number = 0;

	$: isBandScale = xScale && 'bandwidth' in xScale;

	$: bandwidth = isBandScale
		? xScale.bandwidth()
		: xScale && data.length > 1
			? Math.max(1, Math.abs((xScale(data[1]?.[x]) ?? 0) - (xScale(data[0]?.[x]) ?? 0)) - 2)
			: 20;

	$: zeroY = yScale?.(0) ?? 0;

	function barPath(x0: number, y0: number, w: number, h: number, positive: boolean, r: number) {
		r = Math.min(r, w / 2, h);
		if (positive) {
			return `M${x0},${y0 + h}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + w - r}Q${x0 + w},${y0} ${x0 + w},${y0 + r}V${y0 + h}Z`;
		}
		return `M${x0},${y0}V${y0 + h - r}Q${x0},${y0 + h} ${x0 + r},${y0 + h}H${x0 + w - r}Q${x0 + w},${y0 + h} ${x0 + w},${y0 + h - r}V${y0}Z`;
	}

	// Computed here (not via a helper called in the template) so a resized scale
	// moves the bars along with their width
	$: bars =
		xScale && yScale
			? data.map((d) => {
					const value = d[y];
					const xPos = xScale(d[x]) ?? 0;
					const barX = isBandScale ? xPos : xPos - bandwidth / 2;
					const top = value >= 0 ? yScale(value) : zeroY;
					const height = Math.abs(yScale(value) - zeroY);
					return { key: d[x], path: barPath(barX, top, bandwidth, height, value >= 0, radius) };
				})
			: [];
</script>

{#if xScale && yScale && data.length > 0}
	<g class="mark-bar-y">
		{#each bars as b (b.key)}
			{@const isHovered = hover.x === b.key}
			{@const dimmed = hoverDim && hover.x !== null && !isHovered}

			<path
				d={b.path}
				fill={color}
				opacity={dimmed ? opacity * 0.4 : opacity}
				class="transition-opacity duration-100"
			/>
		{/each}
	</g>
{/if}
