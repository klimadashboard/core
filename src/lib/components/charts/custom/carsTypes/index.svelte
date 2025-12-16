<!-- $lib/components/charts/custom/vehicleRegistrations/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		fetchData,
		buildChartData,
		buildWaffleData,
		buildWaffleGrid,
		categoryConfig,
		type VehicleRawData,
		type VehicleShareData
	} from './config';
	import { formatNumber } from '$lib/utils/formatters';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let layer: 'municipality' | 'district' = 'district';
	export let country: string = 'DE';

	// State
	let data: VehicleRawData | null = null;
	let waffleData: VehicleShareData[] = [];
	let grid: string[] = [];
	let regionName: string = '';
	let loading = true;
	let error: string | null = null;
	let visibleCells = new Set<number>();
	let animationComplete = false;
	let shuffledIndices: number[] = [];

	// Derived params
	$: params = { layer, country };

	// Get color for a category
	function getColor(key: string): string {
		return categoryConfig[key]?.color || '#6B7280';
	}

	// Animation effect - random order per row
	function startAnimation() {
		visibleCells = new Set();
		animationComplete = false;

		// Create shuffled indices by row (each row shuffled independently)
		// 5 rows of 20 columns = 100 cells
		shuffledIndices = [];
		for (let row = 0; row < 5; row++) {
			const rowIndices = Array.from({ length: 20 }, (_, i) => row * 20 + i);
			// Fisher-Yates shuffle for each row
			for (let i = rowIndices.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[rowIndices[i], rowIndices[j]] = [rowIndices[j], rowIndices[i]];
			}
			shuffledIndices.push(...rowIndices);
		}

		let count = 0;
		const interval = setInterval(() => {
			if (count < 100) {
				visibleCells.add(shuffledIndices[count]);
				visibleCells = visibleCells; // Trigger reactivity
				count++;
			}
			if (count >= 100) {
				clearInterval(interval);
				animationComplete = true;
			}
		}, 35);
	}

	// Load data when region or params change
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			const result = await fetchData(region, params);
			data = result.data;
			regionName = result.regionName;
			waffleData = buildWaffleData(result.data, result.categories);
			grid = buildWaffleGrid(waffleData);

			const builtChartData = buildChartData(
				result.data,
				waffleData,
				result.updateDate,
				regionName,
				region
			);
			onChartData?.(builtChartData);

			// Start animation after data loads
			startAnimation();
		} catch (e) {
			console.error('[VehicleRegistrations] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Calculate when each category becomes visible based on cell index
	function isCategoryVisible(categoryKey: string): boolean {
		let cellsBefore = 0;
		for (const cat of waffleData) {
			if (cat.key === categoryKey) {
				// Check if any cell of this category is visible
				for (let i = 0; i < cat.cells; i++) {
					if (visibleCells.has(cellsBefore + i)) {
						return true;
					}
				}
				return false;
			}
			cellsBefore += cat.cells;
		}
		return false;
	}
</script>

<div class="vehicle-waffle">
	{#if loading || regionLoading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data || grid.length === 0}
		<div class="h-[300px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{:else}
		<div class="waffle-container">
			<!-- Waffle Grid with Highway Style -->
			<div class="waffle-highway">
				<!-- Road background -->
				<div class="road-bg"></div>

				<!-- Lane markings -->
				{#each Array.from({ length: 19 }, (_, i) => i + 1) as col}
					<div class="lane-marking" style="left: {col * 5}%"></div>
				{/each}

				<!-- Car Grid -->
				<div class="waffle-grid">
					{#each grid as cellType, i}
						<div class="waffle-cell" class:visible={visibleCells.has(i)}>
							{#if visibleCells.has(i)}
								<svg viewBox="0 0 24 17" fill={getColor(cellType)} class="car-icon">
									<path
										d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v7c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-7l-2.08-4.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"
									/>
								</svg>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Legend -->
			<div class="waffle-legend">
				{#each waffleData as category}
					<div
						class="legend-item"
						class:visible={isCategoryVisible(category.key)}
						style="--color: {category.color}"
					>
						<div class="legend-color" style="background-color: {category.color}"></div>
						<div class="legend-content">
							<span class="legend-label">{category.label}: {category.cells}%</span>
							<span class="legend-value">{formatNumber(category.absolute, 0)}</span>
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

	.waffle-highway {
		position: relative;
		overflow: hidden;
		border-radius: 8px;
	}

	.road-bg {
		position: absolute;
		inset: 0;
		background: #1f2937;
		border-radius: 8px;
	}

	.lane-marking {
		position: absolute;
		top: 2%;
		bottom: 2%;
		width: 2px;
		transform: translateX(-50%);
		background: repeating-linear-gradient(
			180deg,
			white 0px,
			white 14px,
			transparent 14px,
			transparent 28px
		);
		opacity: 0.8;
		z-index: 1;
	}

	.waffle-grid {
		display: grid;
		grid-template-columns: repeat(20, 1fr);
		grid-template-rows: repeat(5, 1fr);
		gap: 1px 2px;
		position: relative;
		z-index: 2;
		padding: 4px;
	}

	.waffle-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		opacity: 0;
	}

	.waffle-cell.visible {
		opacity: 1;
		animation: driveUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.waffle-cell:hover {
		transform: scale(1.2);
		z-index: 10;
	}

	@keyframes driveUp {
		0% {
			transform: translateY(60px);
			opacity: 0;
		}
		100% {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.car-icon {
		width: 100%;
		height: auto;
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
