<!-- $lib/components/charts/primitives/axes/AxisY.svelte -->
<script lang="ts">
	export let yScale: any;
	export let innerWidth: number;
	export let innerHeight: number;
	export let format: (v: any) => string = String;
	export let tickCount: number = 5;
	export let label: string = '';
	export let unit: string = '';
	export let gridLines: boolean = true;
	/**
	 * Rendering mode:
	 *   'all'    — grid lines + labels together (default, backward compatible)
	 *   'grid'   — only grid lines (place before chart content)
	 *   'labels' — only tick labels + unit with opaque backgrounds (place after chart content)
	 */
	export let mode: 'all' | 'grid' | 'labels' = 'all';

	$: ticks = yScale?.ticks?.(tickCount) ?? [];
	$: showGrid = mode === 'all' || mode === 'grid';
	$: showLabels = mode === 'all' || mode === 'labels';
</script>

{#if yScale}
	<g class="axis-y">
		<!-- Grid lines -->
		{#if showGrid && gridLines}
			{#each ticks as tick}
				{@const y = yScale(tick)}
				{@const isZero = tick === 0}
				<line
					x1="0"
					x2={innerWidth}
					y1={y}
					y2={y}
					stroke="currentColor"
					class={isZero ? 'text-gray-400' : 'text-gray-200'}
					stroke-width={isZero ? 1 : 0.5}
				/>
			{/each}
		{/if}

		<!-- Tick labels + unit -->
		{#if showLabels}
			{#each ticks as tick, i}
				{@const y = yScale(tick)}
				{@const isLast = i === ticks.length - 1}
				{@const labelText = format(tick)}
				<text x="-4" {y} dy="0.32em" text-anchor="end" class="text-xs fill-gray-500">
					{labelText}
				</text>
				{#if isLast && unit}
					<!-- Unit sits inside the plot area: use a thin halo instead of an opaque box,
					     so data reaching the top of the axis (e.g. 100 % stacks) is not covered. -->
					<text
						x="4"
						{y}
						dy="0.32em"
						class="text-xs fill-gray-500 stroke-white dark:stroke-gray-900"
						stroke-width="3"
						stroke-linejoin="round"
						paint-order="stroke"
					>
						{unit}
					</text>
				{/if}
			{/each}

			{#if label}
				<text
					transform="rotate(-90)"
					x={-innerHeight / 2}
					y="-42"
					text-anchor="middle"
					class="text-xs fill-gray-600 font-medium"
				>
					{label}
				</text>
			{/if}
		{/if}
	</g>
{/if}
