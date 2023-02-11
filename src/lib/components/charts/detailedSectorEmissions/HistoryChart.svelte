<script>
	import { scaleLinear } from 'd3-scale';
	export let explanations;
	export let detailLayers;
	export let selectedYear;
	export let total1990;
	export let ksgSelection;
	export let crfSelection;

	const height = 300;

	$: yAxisScale = ksgSelection == null ? total1990 * 2 : total1990 * 0.5;

	$: yScale = scaleLinear().domain([0, yAxisScale]).range([0, height]);
</script>

{#if detailLayers}
	<div class="w-full grow shrink basis-1/2">
		<svg viewBox="0 0 1000 300">
			{#each Object.entries(detailLayers) as [year, ksgSectors], y}
				{@const x = 15 + y * 30}
				{#each ksgSectors as ksgSector, s}
					{@const previousSum = ksgSectors.slice(0, s).reduce((sum, entry) => sum + entry.value, 0)}
					{@const selected = ksgSelection == s}
					{@const h = yScale(ksgSector.value)}
					{@const y = selected ? 0 : yScale(previousSum)}

					{#if ksgSelection == null || selected}
						<rect width={28} height={h} x={0 + x} y={200 - h - y} fill={ksgSector.colorCode} />
					{/if}
				{/each}
				<text x={14 + x} y={220} font-size="10" text-anchor="middle"><tspan>{year}</tspan></text>

				{#if year == selectedYear}
					<line x1={x + 15} x2={x + 15} y1="0" y2="200" stroke="red" stroke-width="2" />
				{/if}
			{/each}
		</svg>
	</div>
{/if}
