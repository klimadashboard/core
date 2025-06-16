<script>
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from './SmallLineChart.svelte';
	import { colors } from './scales';

	export let region;
	export let views;
	export let selectedPeriod;
</script>

{#if region}
	<h2 class="text-2xl max-w-lg text-balance leading-tight">
		In <span class="underline underline-offset-4" style="text-decoration-color: "
			>{region.name}</span
		>
		gibt es {formatNumber(region.cars[0].value)} Autos bei {formatNumber(region.population)}
		Einwohner:innen.
	</h2>
	<div class="grid grid-cols-3 gap-3 mt-2">
		{#each views as view}
			<div style="color: {view.color}" class="dark:brightness-175">
				<div class="font-bold leading-tight">{view.description}</div>

				<div class="flex">
					<p class="text-4xl sm:text-5xl font-light tabular-nums">
						{Math.round(
							region[view.dataKey].find((d) => d.period == selectedPeriod)?.value
						)}{view.unit}
					</p>
					{#if region[view.dataKey].length > 1}
						<SmallLine {selectedPeriod} data={region[view.dataKey]} />
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
