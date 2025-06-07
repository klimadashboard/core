<script>
	import formatNumber from '$lib/stores/formatNumber';
	import SmallLine from './SmallLineChart.svelte';
	import { colors } from './scales';

	export let selectedRegionData;
	export let region;
	export let selectedPeriod;
</script>

{#if region}
	<h2 class="text-2xl">
		Autotypen in <span
			class="underline underline-offset-4"
			style="text-decoration-color: {colors.electric[1]}">{region.name}</span
		>
	</h2>
	<div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
		{#each selectedRegionData as view}
			<div style="color: {view.color}" class="dark:brightness-175">
				<div class={view.selected ? 'font-bold' : ''}>{view.label}</div>

				<p class="text-4xl sm:text-5xl font-light">
					{formatNumber(view.history.find((d) => d.period == selectedPeriod)?.percentage)}<span
						class="text-xl font-bold">%</span
					>
				</p>

				<SmallLine {selectedPeriod} data={view.history} />
			</div>
		{/each}
	</div>
{/if}
