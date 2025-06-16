<script>
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from './SmallLineChart.svelte';
	import { colors } from './scales';

	export let region;
	export let views;
	export let selectedPeriod;

	console.log(region);
</script>

{#if region}
	<h2 class="text-2xl">
		Autos in <span class="underline underline-offset-4" style="text-decoration-color: "
			>{region.name}</span
		>
	</h2>
	<div class="grid grid-cols-3 gap-3 mt-2">
		{#each views as view}
			<div style="color: {view.color}" class="dark:brightness-175">
				<div class="font-bold leading-tight">{view.description}</div>

				<div class="flex">
					<p class="text-4xl sm:text-5xl font-light tabular-nums">
						{formatNumber(
							region[view.dataKey].find((d) => d.period == selectedPeriod)?.value
						)}{view.unit}
					</p>
					<SmallLine {selectedPeriod} data={region[view.dataKey]} />
				</div>
				<div class="mt-1 bg-current/10 rounded-full h-2 relative overflow-hidden">
					{#if view.chart === 'progressBar'}
						<div
							class="h-full relative left-0"
							style="width: {region[view.dataKey].find((d) => d.period == selectedPeriod)
								?.value}%; background: {view.color}"
						></div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
