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

{#snippet shareIcon(pct: number)}
	{@const percentage = Math.min(Math.max(pct, 0), 100)}
	{@const angle = (percentage / 100) * 360}
	{@const radians = ((angle - 90) * Math.PI) / 180}
	{@const x = 12 + 9 * Math.cos(radians)}
	{@const y = 12 + 9 * Math.sin(radians)}
	{@const largeArc = angle > 180 ? 1 : 0}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="w-3.5 h-3.5"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		{#if percentage > 0}
			<path d="M 12 3 A 9 9 0 {largeArc} 1 {x} {y} L 12 12 Z" fill="currentColor" stroke="none" />
		{/if}
		<circle cx="12" cy="12" r="9" />
	</svg>
{/snippet}

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

				<div class="flex items-center gap-2">
					<div
						class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-700"
						style="color: {category?.color}"
					>
						{@render shareIcon(pct)}
						{formatNumber(pct)}% Anteil
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
