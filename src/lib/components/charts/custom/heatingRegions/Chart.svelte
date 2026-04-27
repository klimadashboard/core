<script lang="ts">
	import {
		processChartData,
		getCategoryConfig,
		formatNumber,
		type HeatingDataPoint,
		type HeatingCategory
	} from './config';

	export let data: HeatingDataPoint[];
	export let categories: HeatingCategory[];

	$: processed = processChartData(data);
</script>

<div class="flex flex-col gap-2">
	{#each processed.visualised as datapoint}
		{@const category = getCategoryConfig(datapoint.category)}
		{@const pct = datapoint.percentage ?? 0}
		<div class="my-1">
			<div class="flex flex-col sm:flex-row sm:items-center gap-3">
				<div class="flex-1">
					<h4 class="font-semibold leading-tight text-gray-900 dark:text-white">
						{category?.label || datapoint.category}
					</h4>
					<div class="flex items-end gap-3">
						<span class="text-3xl font-light tabular-nums" style="color: {category?.color}">
							{formatNumber(pct)}%
						</span>
						<span class="text-sm text-gray-500 dark:text-gray-400">
							{formatNumber(datapoint.value)} Heizungen
						</span>
					</div>
				</div>
			</div>

			<div class="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-500"
					style="width: {pct}%; background-color: {category?.color}"
				></div>
			</div>
		</div>
	{/each}
</div>

{#if processed.other.length > 0}
	<div class="mt-1">
		<p class="text-xs opacity-70">
			<span class="font-medium"
				>Sonstige ({formatNumber(
					processed.other.reduce((s, d) => s + (d.percentage ?? 0), 0)
				)}%):</span
			>
			{#each processed.other as datapoint, i}
				{@const category = getCategoryConfig(datapoint.category)}
				<span style="color: {category?.color}">
					{category?.label || datapoint.category} ({formatNumber(datapoint.percentage)}%)
				</span>
				{#if i !== processed.other.length - 1},
				{/if}
			{/each}
		</p>
	</div>
{/if}
