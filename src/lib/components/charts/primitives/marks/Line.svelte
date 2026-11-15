<!-- $lib/components/charts/primitives/marks/Line.svelte -->
<script lang="ts">
	import { line as d3Line, area as d3Area, curveLinear, curveMonotoneX } from 'd3-shape';
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
	export let fillGradient: boolean = false;
	export let fillOpacity: number = 0.5;

	let gradientId = `line-gradient-${Math.random().toString(36).substr(2, 9)}`;

	// A point is only drawable when its y value is a finite number
	function hasValue(v: any): boolean {
		return v != null && v !== '' && !isNaN(Number(v));
	}

	// scale is passed explicitly in the template so Svelte re-renders the dots when xScale changes
	// (e.g. resize or an extended x domain); otherwise dots keep their old positions
	function getX(d: any, scale: any = xScale): number {
		if (!scale) return 0;
		const val = scale(d[x]) ?? 0;
		if ('bandwidth' in scale) {
			return val + scale.bandwidth() / 2;
		}
		return val;
	}

	$: lineGenerator = d3Line<any>()
		.x((d) => getX(d))
		.y((d) => yScale?.(d[y]) ?? 0)
		.curve(curve === 'monotone' ? curveMonotoneX : curveLinear)
		.defined((d) => hasValue(d[y]));

	$: areaGenerator = d3Area<any>()
		.x((d) => getX(d))
		.y0(yScale?.range()[0] ?? 0)
		.y1((d) => yScale?.(d[y]) ?? 0)
		.curve(curve === 'monotone' ? curveMonotoneX : curveLinear)
		.defined((d) => hasValue(d[y]));

	$: pathD = xScale && yScale ? lineGenerator(data) || '' : '';
	$: areaD = xScale && yScale && fillGradient ? areaGenerator(data) || '' : '';
</script>

{#if xScale && yScale && data.length > 0}
	<defs>
		{#if fillGradient}
			<linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" style="stop-color:{stroke};stop-opacity:{fillOpacity}" />
				<stop offset="100%" style="stop-color:{stroke};stop-opacity:0" />
			</linearGradient>
		{/if}
	</defs>

	<g class="mark-line">
		{#if fillGradient && areaD}
			<path d={areaD} fill="url(#{gradientId})" />
		{/if}

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
				{@const cx = getX(d, xScale)}
				{@const cy = yScale(d[y]) ?? 0}
				{@const isHovered = hover.x === d[x]}

				{#if hasValue(d[y])}
					<circle {cx} {cy} r={isHovered ? dotRadius * 1.5 : dotRadius} fill={stroke} />
				{/if}
			{/each}
		{/if}

		{#if hover.x !== null}
			{@const hoveredPoint = data.find((d) => d[x] === hover.x)}
			{#if hoveredPoint && hasValue(hoveredPoint[y])}
				<circle
					cx={getX(hoveredPoint, xScale)}
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
