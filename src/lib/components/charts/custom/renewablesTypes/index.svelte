<script lang="ts">
	import { onMount } from 'svelte';
	import {
		solarTypeConfigs,
		formatNumber,
		formatPercentage,
		getImageUrl,
		fetchSolarTypesData,
		type SolarTypesResponse,
		type SolarTypeData,
		type Region
	} from './config';

	export let region: Region;

	let data: SolarTypesResponse | null = null;
	let loading = true;
	let error: string | null = null;

	// Fetch data on mount and when region changes
	$: if (region) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;
		try {
			data = await fetchSolarTypesData(region);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	// Calculate totals for percentages
	$: totalUnits = Object.values(data?.current_by_type || {}).reduce(
		(sum, d) => sum + (d.units || 0),
		0
	);
	$: totalPower = Object.values(data?.current_by_type || {}).reduce(
		(sum, d) => sum + (d.power_kw || 0),
		0
	);

	// Get current year for display
	const currentYear = new Date().getFullYear();

	// Known type keys
	$: knownTypes = new Set(solarTypeConfigs.map((t) => t.key));

	// Map selected types with enriched stats
	$: enrichedTypes = solarTypeConfigs.map((config) => {
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
	});

	// Derive 'other' types (everything not in our known types)
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

{#if loading}
	<div class="flex flex-col gap-4">
		{#each [1, 2, 3] as _}
			<div
				class="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse"
			>
				<div class="w-24 h-[130px] bg-gray-200 flex-shrink-0"></div>
				<div class="flex-1 p-4">
					<div class="h-5 bg-gray-200 rounded w-32 mb-3"></div>
					<div class="flex gap-8">
						<div class="flex flex-col gap-2">
							<div class="h-3 bg-gray-200 rounded w-12"></div>
							<div class="h-7 bg-gray-200 rounded w-20"></div>
						</div>
						<div class="flex flex-col gap-2">
							<div class="h-3 bg-gray-200 rounded w-20"></div>
							<div class="h-7 bg-gray-200 rounded w-24"></div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else if error}
	<div class="max-w-lg p-4 bg-red-50 text-red-700 rounded-xl">
		<p>Fehler beim Laden der Daten: {error}</p>
	</div>
{:else if data}
	<div class="flex flex-col gap-4">
		{#each enrichedTypes as type}
			<div class="flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<!-- Image section -->
				<div class="w-24 min-h-[130px] flex-shrink-0">
					<img src={getImageUrl(type.image)} alt={type.label} class="w-full h-full object-cover" />
				</div>

				<!-- Content section -->
				<div class="flex-1 p-4">
					<h3 class="text-base font-semibold text-gray-800 mb-3">{type.label}</h3>

					<div class="flex gap-8">
						<!-- Units stat -->
						<div class="flex flex-col gap-1">
							<span class="text-[0.65rem] font-medium text-gray-500 tracking-wide">ANZAHL</span>
							<span class="text-2xl font-bold text-gray-900 leading-tight">
								{formatNumber(type.units)}
							</span>
							{#if type.added_units_this_year > 0}
								<span
									class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 w-fit"
								>
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
										class="flex-shrink-0"
									>
										<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
										<polyline points="17 6 23 6 23 12" />
									</svg>
									+{formatNumber(type.added_units_this_year)} in {currentYear}
								</span>
							{/if}
						</div>

						<!-- Power stat -->
						<div class="flex flex-col gap-1">
							<span class="text-[0.65rem] font-medium text-gray-500 tracking-wide"
								>LEISTUNG (KWP)</span
							>
							<span class="text-2xl font-bold text-gray-900 leading-tight">
								{formatNumber(type.power_kw)}
								<span class="text-sm font-medium text-gray-400 ml-1">{type.power_pct}%</span>
							</span>
							{#if type.added_power_kw_this_year > 0}
								<span
									class="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 w-fit"
								>
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
										class="flex-shrink-0"
									>
										<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
										<polyline points="17 6 23 6 23 12" />
									</svg>
									+{formatNumber(type.added_power_kw_this_year)} in {currentYear}
								</span>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if other.units > 0}
		<p class="mt-6 text-gray-500 text-sm leading-relaxed">
			Neben den Freiflächenanlagen, Dachanlagen und Balkonkraftwerken gibt es noch weitere Arten von
			PV-Anlagen. Diese sind den Kategorien „Bauliche Anlage (Sonstige)", „Gewässer" und
			„Großparkplatz" zuzuordnen. In {region.name} gibt es {formatNumber(other.units)} Anlagen, die dieser
			Kategorie zuzuordnen sind. Diese haben eine Leistung von {formatNumber(other.power_kw)} kWp, was
			einen Anteil an der Gesamtleistung von {otherPowerPct}% ausmacht.
			{#if other.added_units_this_year > 0}
				Im Jahr {currentYear} wurden davon {formatNumber(other.added_units_this_year)} Anlagen mit
				{formatNumber(other.added_power_kw_this_year)} kWp neu in Betrieb genommen.
			{/if}
		</p>
	{/if}
{/if}
