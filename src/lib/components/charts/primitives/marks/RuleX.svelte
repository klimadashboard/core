<!-- $lib/components/charts/primitives/marks/RuleX.svelte -->
<script lang="ts">
	import type { HoverState } from '../../types';

	export let xScale: any;
	export let innerHeight: number;
	export let hover: HoverState = { x: null, clientX: 0, clientY: 0 };
	export let stroke: string = 'currentColor';
	export let strokeWidth: number = 1;
	export let strokeDasharray: string = '4 2';
	export let opacity: number = 0.5;

	$: xPos = (() => {
		if (hover.x === null || !xScale) return null;
		const val = xScale(hover.x) ?? 0;
		if ('bandwidth' in xScale) {
			return val + xScale.bandwidth() / 2;
		}
		return val;
	})();
</script>

{#if xPos !== null}
	<line
		x1={xPos}
		x2={xPos}
		y1="0"
		y2={innerHeight}
		{stroke}
		stroke-width={strokeWidth}
		{strokeDasharray}
		{opacity}
		class="text-gray-500 pointer-events-none"
	/>
{/if}
