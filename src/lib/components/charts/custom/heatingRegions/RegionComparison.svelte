<script lang="ts">
	import {
		fetchHeatingData,
		getComparisonRegions,
		formatNumber,
		type RegionWithDistance,
		type HeatingCategory
	} from './config';

	export let allRegions: RegionWithDistance[];
	export let selectedRegion: RegionWithDistance | null;
	export let categories: HeatingCategory[];

	$: comparisonRegions = getComparisonRegions(selectedRegion, allRegions).filter(
		(r) => r.code !== selectedRegion?.code
	);

	$: featuredCategories = categories.filter((c) => c.featured);
</script>

{#if comparisonRegions.length > 0}
	<div class="mt-8">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
			Vergleich mit anderen Regionen
		</h3>

		<div class="space-y-3">
			{#each comparisonRegions as region (region.code)}
				{@const isNearby = (region.distance ?? Infinity) < 20}
				<div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
					<div class="flex items-center justify-between mb-3">
						<h4 class="font-semibold text-gray-900 dark:text-white">
							{region.name}
						</h4>
						{#if isNearby}
							<span
								class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
							>
								In der Nähe
							</span>
						{/if}
					</div>

					{#await fetchHeatingData(region, allRegions)}
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							{#each featuredCategories as _}
								<div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
							{/each}
						</div>
					{:then data}
						{#if data.length > 0}
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
								{#each featuredCategories as category}
									{@const datapoint = data.find((d) => d.category === category.key)}
									<div class="p-3 rounded-lg" style="background-color: {category.color}10;">
										<p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
											{category.label}
										</p>
										<p class="text-xl font-light tabular-nums" style="color: {category.color}">
											{formatNumber(datapoint?.percentage)}%
										</p>
										<p class="text-xs text-gray-500 dark:text-gray-400">
											{formatNumber(datapoint?.value)} Heizungen
										</p>
										<div
											class="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"
										>
											<div
												class="h-full rounded-full"
												style="width: {datapoint?.percentage ??
													0}%; background-color: {category.color}"
											></div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-gray-500 dark:text-gray-400">Keine Daten verfügbar.</p>
						{/if}
					{:catch}
						<p class="text-sm text-red-500">Fehler beim Laden der Daten.</p>
					{/await}
				</div>
			{/each}
		</div>
	</div>
{/if}
