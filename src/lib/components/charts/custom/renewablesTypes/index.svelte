<script lang="ts">
	import {
		solarTypeConfigs,
		formatNumber,
		formatPercentage,
		getImageUrl,
		fetchSolarTypesData,
		buildChartData,
		type SolarTypesResponse,
		type Region
	} from './config';

	export let region: Region;
	export let onChartData: (data: ReturnType<typeof buildChartData> | null) => void = () => {};

	let data: SolarTypesResponse | null = null;
	let loading = true;
	let error: string | null = null;

	$: if (region) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;
		try {
			data = await fetchSolarTypesData(region);
			onChartData(buildChartData(data, region));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
			onChartData(null);
		} finally {
			loading = false;
		}
	}

	$: totalUnits = Object.values(data?.current_by_type || {}).reduce(
		(sum, d) => sum + (d.units || 0),
		0
	);
	$: totalPower = Object.values(data?.current_by_type || {}).reduce(
		(sum, d) => sum + (d.power_kw || 0),
		0
	);

	const currentYear = new Date().getFullYear();

	$: knownTypes = new Set(solarTypeConfigs.map((t) => t.key));

	$: enrichedTypes = solarTypeConfigs
		.map((config) => {
			const entry = data?.current_by_type?.[config.key];
			return {
				...config,
				units: entry?.units || 0,
				power_kw: entry?.power_kw || 0,
				added_units_this_year: entry?.added_units_this_year || 0,
				added_power_kw_this_year: entry?.added_power_kw_this_year || 0,
				unit_pct: formatPercentage(entry?.units || 0, totalUnits),
				power_pct: formatPercentage(entry?.power_kw || 0, totalPower)
			};
		})
		.sort((a, b) => b.units - a.units);

	$: other = Object.entries(data?.current_by_type || {})
		.filter(([type]) => !knownTypes.has(type))
		.reduce(
			(acc, [_, val]) => {
				acc.units += val.units || 0;
				acc.power_kw += val.power_kw || 0;
				acc.added_units_this_year += val.added_units_this_year || 0;
				acc.added_power_kw_this_year += val.added_power_kw_this_year || 0;
				return acc;
			},
			{ units: 0, power_kw: 0, added_units_this_year: 0, added_power_kw_this_year: 0 }
		);

	$: otherPowerPct = formatPercentage(other.power_kw, totalPower);
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

{#snippet statCard(value: number, unit: string, pctLabel: string, added: number)}
	{@const pctValue = parseFloat(pctLabel) || 0}
	<div class="">
		<div class="flex items-baseline gap-1">
			<span class="text-3xl font-light font-condensed">{formatNumber(value)}</span>
			<span class="text-sm font-medium">{unit}</span>
		</div>
		<div
			class="w-max flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-500/40 text-emerald-600 dark:text-emerald-400 mt-2"
		>
			{@render shareIcon(pctValue)}
			{pctLabel} Anteil an Gesamt
		</div>
		{#if added > 0}
			<div
				class="w-max flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-green-200 dark:bg-green-400/40 text-emerald-600 dark:text-emerald-400 mt-2"
			>
				{@render trendIcon()}
				+{formatNumber(added)}
				{unit} in {currentYear}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet skeletonCard()}
	<div class="bg-white dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse">
		<div class="h-32 bg-gray-200 dark:bg-gray-800"></div>
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
{:else if data}
	<div class="flex flex-col gap-3">
		{#each enrichedTypes as type}
			<div class="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
				<div class="flex flex-col md:flex-row">
					<div class="h-32 md:h-auto md:w-36 flex-shrink-0">
						<img
							src={getImageUrl(type.image)}
							alt={type.label}
							class="w-full h-full object-cover"
						/>
					</div>

					<div class="flex-1 p-4">
						<h3 class="text-lg leading-none font-semibold">{type.label}</h3>

						<div class="grid grid-cols-2 gap-3 mt-2">
							{@render statCard(
								type.units,
								'Anlagen',
								`${type.unit_pct}%`,
								type.added_units_this_year
							)}
							{@render statCard(
								type.power_kw,
								'kWp',
								`${type.power_pct}%`,
								type.added_power_kw_this_year
							)}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if other.units > 0}
		<p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
			Sonstige Anlagen (z.B. auf Gewässern oder Großparkplätzen): {formatNumber(other.units)} Anlagen
			mit {formatNumber(other.power_kw)} kWp ({otherPowerPct}% der Gesamtleistung).
		</p>
	{/if}
{/if}
