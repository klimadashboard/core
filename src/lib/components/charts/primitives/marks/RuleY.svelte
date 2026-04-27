<!-- $lib/components/charts/primitives/marks/RuleY.svelte -->
<script lang="ts">
	export let y: number = 0;
	export let yScale: any;
	export let innerWidth: number;
	export let stroke: string = 'currentColor';
	export let strokeWidth: number = 1;
	export let strokeDasharray: string | null = null;
	export let opacity: number = 1;

	$: yPos = yScale?.(y) ?? 0;
</script>

{#if yScale}
	<line
		x1="0"
		x2={innerWidth}
		y1={yPos}
		y2={yPos}
		{stroke}
		stroke-width={strokeWidth}
		stroke-dasharray={strokeDasharray}
		{opacity}
		class="text-gray-400"
	/>
{/if}
