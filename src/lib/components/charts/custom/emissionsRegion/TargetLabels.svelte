<!-- Reduction labels at the top of the climate-target columns and a dashed path from the latest
     actual total to the first target (only for targets that declare a reference year, see targetLabels.ts) -->
<script lang="ts">
	import type { ScaleLinear } from 'd3-scale';
	import type { EmissionsRawData } from './config';
	import type { TargetLabel } from './targetLabels';

	export let labels: TargetLabel[] = [];
	export let targets: EmissionsRawData[] = []; // in display units, same as the bars
	export let xScale: ScaleLinear<number, number>;
	export let yScale: ScaleLinear<number, number>;
	export let innerWidth = 0;
	export let hoveredYear: number | null = null;
	export let latestYear: number | null = null; // last year with actual data
	export let latestTotal = 0; // its total, in display units

	$: firstTarget = targets.find((t) => t.year === labels[0]?.year && latestYear !== null && t.year > latestYear);

	$: placed = labels
		.map((label) => {
			const target = targets.find((t) => t.year === label.year);
			if (!target) return null;
			const x = xScale(label.year);
			// keep labels inside the plot: right-align when close to the right edge
			const anchor = x > innerWidth - 40 ? 'end' : 'middle';
			return { ...label, x, anchor };
		})
		.filter((l): l is NonNullable<typeof l> => l !== null);
</script>

{#if firstTarget && latestYear !== null && latestTotal > 0}
	<line
		x1={xScale(latestYear)}
		y1={yScale(latestTotal)}
		x2={xScale(firstTarget.year)}
		y2={yScale(firstTarget.value)}
		stroke="currentColor"
		stroke-width={2}
		stroke-dasharray="4 4"
		opacity={0.5}
		class="pointer-events-none"
	/>
{/if}

{#each placed as l (l.year)}
	<g
		class="pointer-events-none text-xs transition-opacity"
		opacity={hoveredYear === null || hoveredYear === l.year ? 1 : 0.5}
	>
		<text
			x={l.x}
			y={10}
			text-anchor={l.anchor}
			class="fill-gray-800 dark:fill-gray-100 font-semibold"
		>
			−{l.reductionPercent} %
		</text>
		{#if l.netZero}
			<text x={l.x} y={24} text-anchor={l.anchor} class="fill-gray-600 dark:fill-gray-300">
				Klimaneutralität
			</text>
		{/if}
	</g>
{/each}
