<!-- $lib/components/charts/custom/renewablesChart/CumulativeLineView.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { getRegions } from '$lib/utils/regions';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		fetchData,
		fetchComparisonData,
		buildChartData,
		getColors,
		getDistance,
		comparisonPalette,
		formatPower,
		formatNumber,
		type EnergyType,
		type RenewablesRawData,
		type ComparisonSeries
	} from './config';

	// Props
	export let selectedEnergy: EnergyType = 'solar';
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Optional: pre-provided regions list (if empty, will fetch from API)
	export let regions: Array<{
		code: string;
		code_short?: string;
		name: string;
		center?: [number, number] | [string, string];
		area?: number;
		layer?: string;
		layer_label?: string;
		visible?: boolean;
		parents?: Array<{ id: string; layer: string }>;
	}> = [];

	// State
	let mainData: RenewablesRawData[] = [];
	let comparisonSeries: ComparisonSeries[] = [];
	let loading = true;
	let error: string | null = null;
	let containerEl: HTMLElement;
	let selectedUnit: 'absolute' | 'perArea' = 'absolute';
	let searchTerm = '';
	let hoveredSeries: string | null = null;

	// Region search state
	let allRegions: Array<{
		id?: string;
		code: string;
		code_short?: string;
		name: string;
		center?: [number, number] | [string, string];
		area?: number;
		layer?: string;
		layer_label?: string;
		visible?: boolean;
		parents?: Array<{ id: string; layer: string }>;
	}> = [];
	let regionsLoading = false;
	let regionsLoaded = false;
	let searchDropdownOpen = false;

	// Derived
	$: params = { energy: selectedEnergy };
	$: colors = getColors(selectedEnergy);
	$: regionArea = region?.area_km2 || region?.area || null;

	// Use provided regions or fetched regions
	$: effectiveRegions = regions.length > 0 ? regions : allRegions;

	// Get parent region IDs from current region
	$: parentRegionIds = new Set(region?.parents?.map((p) => p.id) || []);

	// Prepare chart data with unit conversion
	$: chartData = prepareChartData(comparisonSeries, mainData, selectedUnit, regionArea);

	function prepareChartData(
		series: ComparisonSeries[],
		main: RenewablesRawData[],
		unit: string,
		area: number | null
	) {
		const result: Array<{
			name: string;
			code?: string;
			color: string;
			isDashed?: boolean;
			data: Array<{ year: number; value: number }>;
		}> = [];

		// Add comparison series
		for (const s of series) {
			const regionInfo = effectiveRegions.find((r) => r.code === s.code || r.code_short === s.code);
			const regionArea = regionInfo?.area || null;
			result.push({
				name: s.name,
				code: s.code,
				color: s.color,
				data: s.data.map((point) => ({
					year: point.year,
					value:
						unit === 'perArea' && regionArea
							? point.cumulative_power_kw / regionArea
							: point.cumulative_power_kw
				}))
			});
		}

		// Add goal line (+50% by 2035)
		if (main.length > 0) {
			const baseValue = main.find((d) => d.year === 2024)?.cumulative_power_kw || 0;
			const goalValue = baseValue * 1.5;
			const currentYear = new Date().getFullYear();

			const goalData: Array<{ year: number; value: number }> = [];
			for (let year = currentYear; year <= 2035; year++) {
				const value = unit === 'perArea' && area ? goalValue / area : goalValue;
				goalData.push({ year, value });
			}

			result.push({
				name: 'Ziel (+50% bis 2035)',
				color: '#999',
				isDashed: true,
				data: goalData
			});
		}

		return result;
	}

	// Flatten data for Chart component
	$: allLineData = chartData.flatMap((s) => s.data);
	$: allValues = chartData.flatMap((s) => s.data.map((d) => d.value));
	$: maxValue = Math.max(...allValues, 1);

	// Unit label
	$: unitLabel = (() => {
		const suffix = selectedEnergy === 'solar' ? 'p' : '';
		if (selectedUnit === 'perArea') return `kW${suffix}/km²`;
		if (maxValue >= 1_000_000) return `GW${suffix}`;
		if (maxValue >= 1_000) return `MW${suffix}`;
		return `kW${suffix}`;
	})();

	// Divisor for display
	$: divisor =
		selectedUnit === 'perArea'
			? 1
			: maxValue >= 1_000_000
				? 1_000_000
				: maxValue >= 1_000
					? 1_000
					: 1;

	// Y-axis formatter
	$: yFormat = (v: number) => formatNumber(v, 0);

	// Searchable regions: show parent regions first when no search term, otherwise search all
	$: selectedCodes = new Set(comparisonSeries.map((s) => s.code));

	// Parent regions (from current region's parents array)
	$: parentRegions = effectiveRegions.filter((r) => {
		if (!r.id) return false;
		return parentRegionIds.has(r.id);
	});

	$: searchableRegions = (() => {
		// If no search term, show parent regions first
		if (!searchTerm || searchTerm.length < 2) {
			return parentRegions.filter((r) => {
				const code = r.code_short || r.code;
				return !selectedCodes.has(code);
			});
		}

		// Otherwise search all regions
		return effectiveRegions
			.filter((r) => {
				// Exclude countries
				if (r.layer === 'country') return false;
				// Exclude hidden regions
				if (r.visible === false) return false;
				// Exclude already selected regions
				const code = r.code_short || r.code;
				if (selectedCodes.has(code)) return false;
				// Filter by search term
				if (!r.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
				return true;
			})
			.sort((a, b) => {
				// Sort parents first, then by distance
				const aIsParent = a.id && parentRegionIds.has(a.id);
				const bIsParent = b.id && parentRegionIds.has(b.id);
				if (aIsParent && !bIsParent) return -1;
				if (!aIsParent && bIsParent) return 1;

				if (!region?.center) return 0;
				const parseCenter = (
					c: [number, number] | [string, string] | undefined
				): [number, number] | null => {
					if (!c) return null;
					return [parseFloat(String(c[0])), parseFloat(String(c[1]))];
				};
				const centerA = parseCenter(a.center);
				const centerB = parseCenter(b.center);
				const regionCenter = parseCenter(region.center as [string, string]);
				return getDistance(regionCenter, centerA) - getDistance(regionCenter, centerB);
			})
			.slice(0, 15);
	})();

	$: filteredSearchRegions = searchableRegions;

	// Fetch available regions using getRegions helper
	async function fetchAvailableRegions() {
		if (regions.length > 0) {
			console.log('[CumulativeLineView] Using provided regions:', regions.length);
			return;
		}
		if (regionsLoaded) {
			console.log('[CumulativeLineView] Regions already loaded:', allRegions.length);
			return;
		}

		regionsLoading = true;
		console.log('[CumulativeLineView] Fetching regions via getRegions()...');

		try {
			const result = await getRegions();
			console.log('[CumulativeLineView] getRegions() returned:', result);

			if (Array.isArray(result)) {
				allRegions = result;
				console.log('[CumulativeLineView] Loaded regions:', allRegions.length);
				console.log('[CumulativeLineView] Sample region:', allRegions[0]);
			} else if (result && typeof result === 'object' && 'data' in result) {
				allRegions = (result as any).data || [];
				console.log('[CumulativeLineView] Loaded regions from .data:', allRegions.length);
			} else {
				console.warn('[CumulativeLineView] Unexpected result format:', typeof result);
				allRegions = [];
			}

			regionsLoaded = true;
		} catch (e) {
			console.error('[CumulativeLineView] Failed to fetch regions:', e);
			allRegions = [];
		} finally {
			regionsLoading = false;
		}
	}

	// Debounced search (regions are pre-loaded, so just filter)
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	function handleSearchInput() {
		// Regions are already loaded, filtering happens reactively
		// Just ensure regions are loaded
		if (!regionsLoaded && !regionsLoading) {
			fetchAvailableRegions();
		}
	}

	// Load data when region or energy changes
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		console.log('[CumulativeLineView] loadData() called');
		console.log('[CumulativeLineView] Current region:', region);
		console.log('[CumulativeLineView] Parent region IDs:', [...parentRegionIds]);

		try {
			// Fetch regions list if not provided
			if (regions.length === 0 && !regionsLoaded) {
				console.log('[CumulativeLineView] No regions yet, fetching...');
				await fetchAvailableRegions();
			}

			console.log('[CumulativeLineView] Fetching main data...');
			const result = await fetchData(region, params);
			mainData = result.data;
			console.log('[CumulativeLineView] Main data loaded:', mainData.length, 'records');

			// Initialize comparison series with main region
			comparisonSeries = [
				{
					code: region?.codeShort || region?.code_short || 'DE',
					name: region?.name || 'Deutschland',
					data: mainData,
					color: colors.dark
				}
			];
			console.log('[CumulativeLineView] Initial comparison series:', comparisonSeries);

			const builtChartData = buildChartData(
				mainData,
				result.updateDate,
				region,
				params,
				'cumulative'
			);
			onChartData?.(builtChartData);
		} catch (e) {
			console.error('[CumulativeLineView] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			mainData = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	async function toggleRegion(toggledRegion: { code: string; code_short?: string; name?: string }) {
		const codeToUse = toggledRegion.code_short || toggledRegion.code;
		console.log('[CumulativeLineView] toggleRegion called:', toggledRegion);
		console.log('[CumulativeLineView] Using code:', codeToUse);

		const isSelected = comparisonSeries.some((d) => d.code === codeToUse);

		if (isSelected && comparisonSeries.length > 1) {
			console.log('[CumulativeLineView] Removing region:', codeToUse);
			comparisonSeries = comparisonSeries.filter((d) => d.code !== codeToUse);
		} else if (!isSelected) {
			loading = true;
			try {
				console.log('[CumulativeLineView] Fetching comparison data for:', codeToUse);
				const data = await fetchComparisonData(codeToUse, params);
				console.log('[CumulativeLineView] Comparison data received:', data.length, 'records');

				if (data.length === 0) {
					console.warn(`[CumulativeLineView] No data found for region ${codeToUse}`);
					loading = false;
					return;
				}

				const colorIndex = comparisonSeries.length - 1;
				comparisonSeries = [
					...comparisonSeries,
					{
						code: codeToUse,
						name: toggledRegion.name || codeToUse,
						data,
						color: comparisonPalette[colorIndex % comparisonPalette.length]
					}
				];
				console.log(
					'[CumulativeLineView] Updated comparison series:',
					comparisonSeries.map((s) => s.name)
				);
			} catch (e) {
				console.error('[CumulativeLineView] Failed to fetch comparison data:', e);
			} finally {
				loading = false;
			}
		}

		searchTerm = '';
		searchDropdownOpen = false;
	}

	function handleInputFocus() {
		searchDropdownOpen = true;
	}

	function handleInputBlur() {
		// Delay closing to allow click on dropdown items
		setTimeout(() => {
			searchDropdownOpen = false;
		}, 200);
	}
</script>

<div bind:this={containerEl} class="cumulative-line-view">
	{#if loading || regionLoading}
		<div class="h-96 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-96 flex items-center justify-center text-red-500">{error}</div>
	{:else if mainData.length === 0}
		<div class="h-96 flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<!-- Controls -->
		<div class="flex items-center gap-2 flex-wrap mb-4">
			<!-- Region Search -->
			<div class="relative">
				<input
					type="text"
					bind:value={searchTerm}
					on:input={handleSearchInput}
					on:focus={handleInputFocus}
					on:blur={handleInputBlur}
					placeholder="Region hinzufügen..."
					class="bg-gray-100 dark:bg-gray-800 rounded-full py-2 px-4 text-sm w-48"
				/>
				{#if regionsLoading}
					<div class="absolute right-3 top-1/2 -translate-y-1/2">
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
					</div>
				{/if}

				{#if searchDropdownOpen && (filteredSearchRegions.length > 0 || searchTerm.length >= 2)}
					<div
						class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto w-64"
					>
						{#if filteredSearchRegions.length > 0}
							{#if !searchTerm || searchTerm.length < 2}
								<div
									class="px-4 py-1 text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700"
								>
									Übergeordnete Regionen
								</div>
							{/if}
							{#each filteredSearchRegions as searchRegion}
								<button
									class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex justify-between items-center"
									on:mousedown|preventDefault={() => toggleRegion(searchRegion)}
								>
									<span>{searchRegion.name}</span>
									{#if searchRegion.layer_label}
										<span class="text-xs text-gray-400">{searchRegion.layer_label}</span>
									{:else if searchRegion.layer}
										<span class="text-xs text-gray-400">{searchRegion.layer}</span>
									{/if}
								</button>
							{/each}
						{:else if searchTerm.length >= 2 && !regionsLoading}
							<div class="px-4 py-2 text-sm text-gray-500">Keine Regionen gefunden</div>
						{:else if searchTerm.length < 2}
							<div class="px-4 py-2 text-sm text-gray-500">Mind. 2 Zeichen eingeben...</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Unit Toggle -->
			<div class="bg-gray-100 dark:bg-gray-800 rounded-full p-2 px-3 text-sm inline-flex gap-2">
				<label class:font-bold={selectedUnit === 'absolute'}>
					<input type="radio" value="absolute" class="mr-1" bind:group={selectedUnit} />
					absolut
				</label>
				<label class:font-bold={selectedUnit === 'perArea'}>
					<input type="radio" value="perArea" class="mr-1" bind:group={selectedUnit} />
					pro km²
				</label>
			</div>
		</div>

		<!-- Chart -->
		<div class="relative">
			{#if loading}
				<div
					class="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10"
				>
					<div
						class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"
					></div>
				</div>
			{/if}

			<Chart
				data={allLineData}
				x="year"
				y="value"
				xType="linear"
				height={280}
				yMax={maxValue / divisor}
				margin={{ top: 10, right: 20, bottom: 40, left: 70 }}
			>
				<svelte:fragment
					slot="default"
					let:xScale
					let:yScale
					let:innerWidth
					let:innerHeight
					let:hover
				>
					<AxisY {yScale} {innerWidth} {innerHeight} format={yFormat} unit={unitLabel} />
					<AxisX
						{xScale}
						xDomain={[]}
						{innerWidth}
						{innerHeight}
						format={(v) => String(Math.round(v))}
					/>

					{#each chartData as series}
						{@const seriesData = series.data.map((d) => ({
							year: d.year,
							value: d.value / divisor
						}))}
						<g
							class="cursor-pointer"
							on:mouseenter={() => (hoveredSeries = series.name)}
							on:mouseleave={() => (hoveredSeries = null)}
						>
							<Line
								data={seriesData}
								x="year"
								y="value"
								{xScale}
								{yScale}
								stroke={series.color}
								strokeWidth={hoveredSeries === series.name || !hoveredSeries ? 2 : 1}
								strokeDasharray={series.isDashed ? '5,5' : null}
								{hover}
							/>
						</g>
					{/each}
				</svelte:fragment>

				<svelte:fragment slot="tooltip" let:hover>
					{#if hover.x !== null}
						{@const year = Math.round(hover.x)}
						{@const items = chartData
							.map((s) => {
								const point = s.data.find((d) => d.year === year);
								return point
									? {
											label: s.name,
											value:
												selectedUnit === 'perArea'
													? `${formatNumber(point.value, 1)} kW/km²`
													: formatPower(point.value, selectedEnergy),
											color: s.color
										}
									: null;
							})
							.filter(Boolean)}
						<Tooltip
							visible={true}
							x={hover.clientX}
							y={hover.clientY}
							title={String(year)}
							{items}
							container={containerEl}
						/>
					{/if}
				</svelte:fragment>
			</Chart>
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap gap-3 mt-4 text-sm">
			{#each chartData as series}
				<div
					class="flex items-center gap-2 cursor-pointer"
					on:mouseenter={() => (hoveredSeries = series.name)}
					on:mouseleave={() => (hoveredSeries = null)}
					role="button"
					tabindex="0"
				>
					<div
						class="w-5 h-0.5"
						style="background: {series.color}; {series.isDashed
							? `background-image: repeating-linear-gradient(to right, ${series.color} 0, ${series.color} 5px, transparent 5px, transparent 10px);`
							: ''}"
					></div>
					<span class:font-bold={hoveredSeries === series.name}>{series.name}</span>
					{#if !series.isDashed && series.code && comparisonSeries.length > 1}
						<button
							on:click|stopPropagation={() => toggleRegion({ code: series.code || '' })}
							class="text-red-600 hover:text-red-700 ml-1"
							aria-label="Entfernen"
						>
							×
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
