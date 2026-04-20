<script lang="ts">
	import {
		storageTypeConfigs,
		formatNumber,
		formatCapacity,
		formatPercentage,
		getImageUrl,
		fetchStorageTypesData,
		buildChartData,
		type StorageTypeData,
		type Region
	} from './config';

	export let region: Region;
	export let onChartData: (data: ReturnType<typeof buildChartData> | null) => void = () => {};

	let currentByCategory: Record<string, StorageTypeData> = {};
	let updateDate: string | null = null;
	let loading = true;
	let error: string | null = null;

	$: if (region) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;
		try {
			const result = await fetchStorageTypesData(region);
			currentByCategory = result.currentByCategory;
			updateDate = result.updateDate;
			onChartData(buildChartData(currentByCategory, region, updateDate));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
			onChartData(null);
		} finally {
			loading = false;
		}
	}

	$: knownKeys = new Set(storageTypeConfigs.map((t) => t.key));
	$: totalUnits = Object.entries(currentByCategory)
		.filter(([k]) => knownKeys.has(k))
		.reduce((s, [, d]) => s + (d.units || 0), 0);
	$: totalPower = Object.entries(currentByCategory)
		.filter(([k]) => knownKeys.has(k))
		.reduce((s, [, d]) => s + (d.power_kw || 0), 0);
	$: totalCapacity = Object.entries(currentByCategory)
		.filter(([k]) => knownKeys.has(k))
		.reduce((s, [, d]) => s + (d.capacity_kwh || 0), 0);

	const currentYear = new Date().getFullYear();

	$: enrichedTypes = storageTypeConfigs
		.map((config) => {
			const entry = currentByCategory[config.key];
			if (!entry && !config.alwaysShow) return null;
			const units = entry?.units || 0;
			const power_kw = entry?.power_kw || 0;
			const capacity_kwh = entry?.capacity_kwh || 0;
			const added_units = entry?.added_units_this_year || 0;
			const added_power_kw = entry?.added_power_kw_this_year || 0;
			const added_capacity_kwh = entry?.added_capacity_kwh_this_year || 0;
			const prevUnits = units - added_units;
			const prevCapacity = capacity_kwh - added_capacity_kwh;
			return {
				...config,
				units,
				power_kw,
				capacity_kwh,
				added_units,
				added_power_kw,
				added_capacity_kwh,
				unit_pct: formatPercentage(units, totalUnits),
				power_pct: formatPercentage(power_kw, totalPower),
				capacity_pct: formatPercentage(capacity_kwh, totalCapacity),
				unit_growth_pct: prevUnits > 0 ? Math.round((added_units / prevUnits) * 100) : null,
				capacity_growth_pct:
					prevCapacity > 0 ? Math.round((added_capacity_kwh / prevCapacity) * 100) : null
			};
		})
		.filter(Boolean)
		.filter((t) => t!.units > 0 || t!.alwaysShow)
		.sort((a, b) => b!.units - a!.units);
</script>

{#snippet trendIcon()}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="12"
		height="12"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
		<polyline points="17 6 23 6 23 12" />
	</svg>
{/snippet}

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

{#snippet metricCard(value: string, unit: string, pctLabel: string, addedText: string)}
	{@const pctValue = parseFloat(pctLabel) || 0}
	<div class="min-w-0">
		<div class="flex items-baseline gap-1">
			<span class="text-3xl font-condensed">{value}</span>
			{#if unit}<span class="text-sm font-medium">{unit}</span>{/if}
		</div>
		<div
			class="max-w-full inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-500/40 text-emerald-600 dark:text-emerald-400 mt-2"
		>
			{@render shareIcon(pctValue)}
			<span class="truncate">{pctLabel}% Anteil an Gesamt</span>
		</div>
		{#if addedText}
			<div
				class="max-w-full inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-green-200 dark:bg-green-400/40 text-emerald-600 dark:text-emerald-400 mt-2"
			>
				{@render trendIcon()}
				<span class="truncate">{addedText}</span>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet skeletonCard()}
	<div class="bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse">
		<div class="p-4">
			<div class="h-5 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-3"></div>
			<div class="grid grid-cols-2 gap-3">
				<div class="h-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
				<div class="h-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
			</div>
		</div>
	</div>
{/snippet}

{#if loading}
	<div class="flex flex-col gap-3">
		{#each [1, 2, 3] as _}
			{@render skeletonCard()}
		{/each}
	</div>
{:else if error}
	<div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl">
		<p>Fehler beim Laden der Daten: {error}</p>
	</div>
{:else}
	<div class="flex flex-col gap-3">
		{#each enrichedTypes as type}
			{#if type}
				<div class="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
					<div class="flex flex-col md:flex-row">
						{#if type.image}
							<div class="h-32 md:h-auto md:w-36 flex-shrink-0 m-2 rounded-l-lg overflow-hidden">
								<img
									src={getImageUrl(type.image)}
									alt={type.label}
									class="w-full h-full object-cover"
								/>
							</div>
						{/if}

						<div class="flex-1 p-4">
							<h3 class="text-lg leading-none font-semibold">{type.label}</h3>

							<div class="grid grid-cols-2 gap-3 mt-2">
								{@render metricCard(
									formatNumber(type.units),
									'Anlagen',
									type.unit_pct,
									type.added_units > 0 ? `+${formatNumber(type.added_units)} Anlagen in ${currentYear}` : ''
								)}
								{@render metricCard(
									formatCapacity(type.capacity_kwh),
									'',
									type.capacity_pct,
									type.added_capacity_kwh > 0 ? `+${formatCapacity(type.added_capacity_kwh)} in ${currentYear}` : ''
								)}
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/if}
