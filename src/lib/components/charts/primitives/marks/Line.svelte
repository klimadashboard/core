<!-- $lib/components/charts/primitives/marks/Line.svelte -->
<script lang="ts">
	import { line as d3Line, curveLinear, curveMonotoneX } from 'd3-shape';
	import type { HoverState } from '../../types';

	export let data: any[] = [];
	export let x: string = 'x';
	export let y: string = 'value';
	export let xScale: any;
	export let yScale: any;
	export let stroke: string = '#3b82f6';
	export let strokeWidth: number = 2;
	export let strokeDasharray: string | null = null;
	export let curve: 'linear' | 'monotone' = 'linear';
	export let dots: boolean = false;
	export let dotRadius: number = 3;
	export let hover: HoverState = { x: null, clientX: 0, clientY: 0 };

	function getX(d: any): number {
		if (!xScale) return 0;
		const val = xScale(d[x]) ?? 0;
		if ('bandwidth' in xScale) {
			return val + xScale.bandwidth() / 2;
		}
		return val;
	}

	$: lineGenerator = d3Line<any>()
		.x((d) => getX(d))
		.y((d) => yScale?.(d[y]) ?? 0)
		.curve(curve === 'monotone' ? curveMonotoneX : curveLinear)
		.defined((d) => d[y] != null && !isNaN(d[y]));

	$: pathD = xScale && yScale ? lineGenerator(data) || '' : '';
</script>

{#if xScale && yScale && data.length > 0}
	<g class="mark-line">
		<path
			d={pathD}
			fill="none"
			{stroke}
			stroke-width={strokeWidth}
			stroke-dasharray={strokeDasharray}
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		{#if dots}
			{#each data as d}
				{@const cx = getX(d)}
				{@const cy = yScale(d[y]) ?? 0}
				{@const isHovered = hover.x === d[x]}

				{#if d[y] != null}
					<circle {cx} {cy} r={isHovered ? dotRadius * 1.5 : dotRadius} fill={stroke} />
				{/if}
			{/each}
		{/if}

		{#if hover.x !== null}
			{@const hoveredPoint = data.find((d) => d[x] === hover.x)}
			{#if hoveredPoint && hoveredPoint[y] != null}
				<circle
					cx={getX(hoveredPoint)}
					cy={yScale(hoveredPoint[y]) ?? 0}
					r={dotRadius * 2}
					fill={stroke}
					stroke="white"
					stroke-width="2"
				/>
			{/if}
		{/if}
	</g>
{/if}
