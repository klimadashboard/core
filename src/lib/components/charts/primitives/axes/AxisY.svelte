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

	$: ticks = yScale?.ticks?.(tickCount) ?? [];
</script>

{#if yScale}
	<g class="axis-y">
		{#each ticks as tick, i}
			{@const y = yScale(tick)}
			{@const isZero = tick === 0}
			{@const isLast = i === ticks.length - 1}

			<g transform="translate(0,{y})">
				{#if gridLines}
					<line
						x1="0"
						x2={innerWidth}
						stroke="currentColor"
						class={isZero ? 'text-gray-400' : 'text-gray-200'}
						stroke-width={isZero ? 1 : 0.5}
					/>
				{/if}

				<text x="-4" dy="0.32em" text-anchor="end" class="text-xs fill-gray-500">
					{format(tick)}
				</text>
				{#if isLast && unit}
					{@const unitText = unit}
					<rect
						x="-2"
						y="-10"
						width={unitText.length * 7 + 10}
						height="20"
						class="fill-white dark:fill-gray-900"
					/>
					<text x="2" dy="0.32em" class="text-xs fill-gray-500">
						{unitText}
					</text>
				{/if}
			</g>
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
	</g>
{/if}
