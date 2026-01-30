<!-- $lib/components/charts/custom/vehicleRegistrations/index.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		fetchDataWithFallback,
		buildChartData,
		buildWaffleData,
		checkDataAvailabilityWithFallback,
		categoryConfig,
		type VehicleRawData,
		type VehicleShareData,
		type DataMode
	} from './config';
	import { formatNumber } from '$lib/utils/formatters';
	import Switch from '$lib/components/Switch.svelte';
	import { tick } from 'svelte';
	import { t } from '$lib/utils/t';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let layer: 'municipality' | 'district' = 'district';
	export let mode: DataMode | undefined = undefined;

	// Check URL for mode parameter (for embeds)
	$: urlMode = page.url?.searchParams?.get('mode') as DataMode | null;
	$: initialMode = urlMode || mode;

	// State
	let data: VehicleRawData | null = null;
	let waffleData: VehicleShareData[] = [];
	let regionName: string = '';
	let loading = true;
	let error: string | null = null;
	let visibleCells = new Set<number>();
	let animationComplete = false;

	// Data availability state
	let hasBestand = false;
	let hasNeuzulassungen = false;
	let availabilityChecked = false;

	// Mode switch
	let activeMode: DataMode = 'bestand';

	// Build region candidates from current region + parents (for fallback)
	$: regionCandidates = region
		? [
				{ id: region.id, name: region.name, layer: region.layer, layer_label: region.layer_label },
				...(region.parents?.map((p: any) => ({
					id: p.id,
					name: p.name || 'Parent region',
					layer: p.layer,
					layer_label: p.layer_label
				})) || [])
			]
		: [];

	// Track region candidates for reactivity (stringified for comparison)
	$: regionCandidatesKey = JSON.stringify(regionCandidates.map(c => c.id));

	// Dynamic mode views based on availability
	$: modeViews = [
		...(hasBestand ? [{ key: 'bestand', label: 'Bestand' }] : []),
		...(hasNeuzulassungen ? [{ key: 'neuzulassungen', label: 'Neuzulassungen' }] : [])
	];

	// Show switch if at least one mode is available
	$: showSwitch = hasBestand || hasNeuzulassungen;

	// Derived params
	$: params = { layer, mode: activeMode };

	// Get color for a category
	function getColor(key: string): string {
		return categoryConfig[key]?.color || '#6B7280';
	}

	// Sort waffle data by cells (percentage) descending
	$: sortedWaffleData = [...waffleData].sort((a, b) => b.cells - a.cells);

	// Build column-first grid (left to right, biggest to smallest)
	// 20 columns x 5 rows = 100 cells, filled column by column via CSS grid-auto-flow: column
	$: columnGrid = buildColumnGrid(sortedWaffleData);

	function buildColumnGrid(data: VehicleShareData[]): { key: string }[] {
		const grid: { key: string }[] = [];

		for (const category of data) {
			for (let i = 0; i < category.cells; i++) {
				grid.push({ key: category.key });
			}
		}

		return grid;
	}

	// Animation effect - animate by column (left to right)
	async function startAnimation() {
		visibleCells = new Set();
		animationComplete = false;

		// Wait for reactive updates to complete
		await tick();

		let count = 0;
		const totalCells = columnGrid.length;

		if (totalCells === 0) {
			animationComplete = true;
			return;
		}

		const interval = setInterval(() => {
			if (count < totalCells) {
				visibleCells.add(count);
				visibleCells = visibleCells; // Trigger reactivity
				count++;
			}
			if (count >= totalCells) {
				clearInterval(interval);
				animationComplete = true;
			}
		}, 25);
	}

	// Check availability when region candidates change or region loading completes
	$: if (!regionLoading && regionCandidatesKey !== undefined) {
		checkAvailability();
	}

	async function checkAvailability() {
		loading = true;
		availabilityChecked = false;

		try {
			const availability = await checkDataAvailabilityWithFallback(regionCandidates);
			hasBestand = availability.hasBestand;
			hasNeuzulassungen = availability.hasNeuzulassungen;
			availabilityChecked = true;

			// If no data is available at all, report hasData: false
			if (!hasBestand && !hasNeuzulassungen) {
				data = null;
				waffleData = [];
				const emptyChartData = buildChartData(
					{ year: 0, total: 0, categories: {}, shares: {} },
					[],
					new Date().toISOString(),
					'',
					region,
					'bestand',
					false
				);
				onChartData?.(emptyChartData);
				loading = false;
				return;
			}

			// Set mode: use initialMode if specified and available, otherwise prefer Bestand
			if (initialMode === 'neuzulassungen' && hasNeuzulassungen) {
				activeMode = 'neuzulassungen';
			} else if (initialMode === 'bestand' && hasBestand) {
				activeMode = 'bestand';
			} else if (hasBestand) {
				activeMode = 'bestand';
			} else {
				activeMode = 'neuzulassungen';
			}

			// Note: loadData() will be triggered by the reactive statement when availabilityChecked becomes true
		} catch (e) {
			console.error('[carsTypes] Error checking availability:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			loading = false;
		}
	}

	// Load data when mode changes (after availability check)
	$: if (availabilityChecked && activeMode) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			const result = await fetchDataWithFallback(regionCandidates, params);

			if (!result) {
				data = null;
				waffleData = [];
				const emptyChartData = buildChartData(
					{ year: 0, total: 0, categories: {}, shares: {} },
					[],
					new Date().toISOString(),
					'',
					region,
					activeMode,
					false
				);
				onChartData?.(emptyChartData);
				loading = false;
				return;
			}

			data = result.data;
			regionName = result.regionName;
			waffleData = buildWaffleData(result.data, result.categories);

			// Create a region object for the data source (may be a parent region)
			const dataRegion: Region = {
				id: result.regionId,
				name: result.regionName
			} as Region;

			// Build fallback info if showing data from a different region
			const fallbackInfo = region && result.regionName !== region.name
				? {
						originalRegionName: region.name,
						dataRegionName: result.regionName,
						originalLayerLabel: region.layer_label || '',
						dataLayerLabel: result.regionLayerLabel || ''
					}
				: undefined;

			const privacyNote = t(page.data.translations, 'ui.card.privacyNote');
			const builtChartData = buildChartData(
				result.data,
				waffleData,
				result.updateDate,
				regionName,
				dataRegion,
				activeMode,
				true,
				{ hasBestand, hasNeuzulassungen },
				result.source,
				fallbackInfo,
				result.regionLayerLabel,
				result.hasPrivacySuppression,
				privacyNote
			);
			onChartData?.(builtChartData);

			// Start animation after data loads
			startAnimation();
		} catch (e) {
			console.error('[carsTypes] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Calculate when each category becomes visible based on cell index
	function isCategoryVisible(categoryKey: string): boolean {
		for (let i = 0; i < columnGrid.length; i++) {
			if (columnGrid[i].key === categoryKey && visibleCells.has(i)) {
				return true;
			}
		}
		return false;
	}
</script>

<div class="vehicle-waffle">
	<!-- Mode Switch (only show if at least one mode is available) -->
	{#if showSwitch}
		<div class="mb-4">
			<Switch
				views={modeViews}
				activeView={activeMode}
				on:itemClick={(event) => {
					activeMode = event.detail;
				}}
			/>
		</div>
	{/if}

	{#if loading || regionLoading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data || columnGrid.length === 0}
		<div class="h-[300px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{:else}
		<div class="waffle-container">
			<!-- Waffle Grid - Plain Background -->
			<div class="waffle-plain">
				<!-- Car Grid (10 columns x 10 rows, filled by column) -->
				<div class="waffle-grid">
					{#each columnGrid as cell, i}
						<div
							class="waffle-cell"
							class:visible={visibleCells.has(i) || animationComplete}
							style="color: {getColor(cell.key)}"
						>
							<!-- Front-facing car SVG -->
							<svg viewBox="0 0 699 465" fill="currentColor" class="car-icon">
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M512 0C529 0 552 9 562 22C574 63 586 103 597 144C613 132 699 124 699 172C699 207 667 206 643 206C649 220 655 241 655 270C656 329 656 387 656 445C656 456 647 465 637 465H550C539 465 530 456 530 445C530 438 530 430 530 422H168C168 430 168 438 168 445C168 456 160 465 149 465H62C52 465 43 456 43 445C43 387 43 329 44 270C44 241 50 220 56 206C32 206 0 207 0 172C0 124 86 132 102 144C113 103 124 63 137 22C147 9 170 0 187 0H512ZM557 141C548 106 539 71 529 37H169C160 71 151 106 141 141H557ZM191 206C165 206 144 227 144 253C144 280 165 301 191 301C217 301 239 280 239 253C239 227 217 206 191 206ZM191 224C175 224 162 237 162 253C162 270 175 283 191 283C207 283 220 270 220 253C220 237 207 224 191 224ZM508 206C534 206 555 227 555 253C555 280 534 301 508 301C481 301 460 280 460 253C460 227 481 206 508 206ZM508 224C524 224 537 237 537 253C537 270 524 283 508 283C492 283 478 270 478 253C478 237 492 224 508 224Z"
								/>
							</svg>
						</div>
					{/each}
				</div>
			</div>

			<!-- Legend (sorted by size) -->
			<div class="waffle-legend">
				{#each sortedWaffleData as category}
					<div
						class="legend-item"
						class:visible={isCategoryVisible(category.key)}
						style="--color: {category.color}"
					>
						<div class="legend-color" style="background-color: {category.color}"></div>
						<div class="legend-content">
							<span class="legend-label">{category.label}: {category.cells}%</span>
							{#if category.absolute > 0}
								<span class="legend-value">{formatNumber(category.absolute, 0)}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.vehicle-waffle {
		width: 100%;
	}

	.waffle-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	:global(.dark) .waffle-plain {
		background: #1f2937;
	}

	.waffle-grid {
		display: grid;
		grid-template-columns: repeat(20, 1fr);
		grid-template-rows: repeat(5, 1fr);
		grid-auto-flow: column;
		gap: 4px 6px;
		padding: 8px;
	}

	.waffle-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		aspect-ratio: 1;
	}

	.waffle-cell.visible {
		opacity: 1;
		animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.waffle-cell:hover {
		transform: scale(1.15);
		z-index: 10;
	}

	.car-icon {
		width: 90%;
		height: 90%;
		max-height: 90%;
	}

	@keyframes fadeIn {
		0% {
			transform: scale(0.8);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.waffle-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.3;
		transition: opacity 0.3s ease;
	}

	.legend-item.visible {
		opacity: 1;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.legend-content {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}

	.legend-label {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color);
	}

	.legend-value {
		font-size: 0.75rem;
		color: #6b7280;
	}

	:global(.dark) .legend-value {
		color: #9ca3af;
	}
</style>
