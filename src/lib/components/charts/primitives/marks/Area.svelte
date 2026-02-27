<!--
	Stacked/simple area mark for chart primitives.
	Renders filled areas between y0 (baseline) and y1 (top).
	For stacked usage, pre-compute y0/y1 fields; for simple areas, just set y (fills from 0).

	Usage (simple area):
		<Area data={points} x="year" y="value" color="#3b82f6" {xScale} {yScale} />

	Usage (stacked area, pre-computed):
		<Area data={points} x="year" y0Field="y0" y1Field="y1" color="#3b82f6" {xScale} {yScale} />
-->
<script lang="ts">
	import { area as d3Area, curveLinear, curveMonotoneX } from 'd3-shape';
	import type { HoverState } from '../../types';

	export let data: any[] = [];
	export let x: string = 'x';
	export let y: string = 'value';
	export let y0Field: string | null = null;
	export let y1Field: string | null = null;
	export let xScale: any;
	export let yScale: any;
	export let color: string = '#3b82f6';
	export let opacity: number = 0.7;
	export let stroke: string | null = null;
	export let strokeWidth: number = 1.5;
	export let curve: 'linear' | 'monotone' = 'monotone';
	export let hover: HoverState = { x: null, clientX: 0, clientY: 0 };

	function getX(d: any): number {
		if (!xScale) return 0;
		const val = xScale(d[x]) ?? 0;
		if ('bandwidth' in xScale) {
			return val + xScale.bandwidth() / 2;
		}
		return val;
	}

	$: curveFunc = curve === 'monotone' ? curveMonotoneX : curveLinear;

	$: areaGenerator = d3Area<any>()
		.x((d) => getX(d))
		.y0((d) => {
			if (y0Field) return yScale?.(d[y0Field]) ?? yScale?.range()[0] ?? 0;
			return yScale?.(0) ?? yScale?.range()[0] ?? 0;
		})
		.y1((d) => {
			if (y1Field) return yScale?.(d[y1Field]) ?? 0;
			return yScale?.(d[y]) ?? 0;
		})
		.curve(curveFunc)
		.defined((d) => {
			const val = y1Field ? d[y1Field] : d[y];
			return val != null && !isNaN(val);
		});

	$: pathD = xScale && yScale ? areaGenerator(data) || '' : '';
</script>

{#if xScale && yScale && data.length > 0 && pathD}
	<g class="mark-area">
		<path
			d={pathD}
			fill={color}
			fill-opacity={opacity}
			stroke={stroke || color}
			stroke-width={stroke ? strokeWidth : 0}
			stroke-linejoin="round"
		/>
	</g>
{/if}
