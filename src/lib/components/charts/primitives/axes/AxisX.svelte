<!-- $lib/components/charts/primitives/axes/AxisX.svelte -->
<script lang="ts">
	export let xScale: any;
	export let xDomain: any[] = [];
	export let innerWidth: number;
	export let innerHeight: number;
	export let format: (v: any) => string = String;
	export let tickCount: number = 5;
	export let label: string = '';

	$: isBandScale = xScale && 'bandwidth' in xScale;

	$: ticks = (() => {
		if (!xScale) return [];
		if (isBandScale) {
			if (xDomain.length > tickCount * 2) {
				const step = Math.ceil(xDomain.length / tickCount);
				return xDomain.filter((_: any, i: number) => i % step === 0);
			}
			return xDomain;
		}
		return xScale.ticks?.(tickCount) ?? [];
	})();

	function getX(tick: any): number {
		if (!xScale) return 0;
		if (isBandScale) {
			return (xScale(tick) ?? 0) + xScale.bandwidth() / 2;
		}
		return xScale(tick) ?? 0;
	}
</script>

{#if xScale}
	<g class="axis-x" transform="translate(0,{innerHeight})">
		<line x1="0" x2={innerWidth} y1="0" y2="0" stroke="currentColor" class="text-gray-300" />

		{#each ticks as tick}
			<g transform="translate({getX(tick)},0)">
				<line y1="0" y2="5" stroke="currentColor" class="text-gray-300" />
				<text y="18" text-anchor="middle" class="text-xs fill-gray-500 dark:fill-gray-400">
					{format(tick)}
				</text>
			</g>
		{/each}

		{#if label}
			<text
				x={innerWidth / 2}
				y="32"
				text-anchor="middle"
				class="text-xs fill-gray-600 font-medium"
			>
				{label}
			</text>
		{/if}
	</g>
{/if}
