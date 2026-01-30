<!-- $lib/components/charts/custom/renewablesYearlyBar/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import BarY from '$lib/components/charts/primitives/marks/BarY.svelte';
	import RuleX from '$lib/components/charts/primitives/marks/RuleX.svelte';
	import RuleY from '$lib/components/charts/primitives/marks/RuleY.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import { formatPower, formatNumber, getPowerUnit, convertPowerUnit } from '$lib/utils/formatters';
	import { fetchData, buildChartData, getColor, type RenewablesRawData } from './config';

	// Props from Card slot
	export let selectedEnergy: 'solar' | 'wind' = 'solar';
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// State
	let data: RenewablesRawData[] = [];
	let loading = true;
	let error: string | null = null;
	let containerEl: HTMLElement;

	// Derived
	$: params = { energy: selectedEnergy };
	$: color = getColor(params);
	$: maxAbs = Math.max(...data.map((d) => Math.abs(d.net_power_kw)), 1);
	$: unit = getPowerUnit(maxAbs, selectedEnergy);
	$: yFormat = (v: number) => formatNumber(convertPowerUnit(v, maxAbs), 0);

	// Load data
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			const result = await fetchData(region, params);
			data = result.data;
			const chartData = buildChartData(data, result.updateDate, region, params);
			console.log('[RenewablesChart] Calling onChartData with:', chartData);
			onChartData?.(chartData);
		} catch (e) {
			console.error('[RenewablesChart] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}
</script>

<div bind:this={containerEl} class="renewables-yearly-bar">
	{#if loading || regionLoading}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-72 flex items-center justify-center text-red-500">{error}</div>
	{:else if data.length === 0}
		<div class="h-72 flex items-center justify-center text-gray-500">Keine Daten</div>
	{:else}
		<Chart
			{data}
			x="year"
			y="net_power_kw"
			xType="band"
			height={280}
			margin={{ top: 15, right: 15, bottom: 35, left: 55 }}
		>
			<svelte:fragment
				slot="default"
				let:xScale
				let:yScale
				let:xDomain
				let:innerWidth
				let:innerHeight
				let:hover
				let:data
				let:x
			>
				<AxisY {yScale} {innerWidth} {innerHeight} format={yFormat} {unit} />
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={String} />
				<RuleY y={0} {yScale} {innerWidth} />
				<BarY {data} {x} y="net_power_kw" {xScale} {yScale} {color} {hover} />
				<RuleX {xScale} {innerHeight} {hover} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover let:data let:x>
				{@const point = data.find((d: any) => d[x] === hover.x)}
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={hover.x !== null ? String(hover.x) : ''}
					items={point
						? [
								{ label: 'Zubau', value: formatPower(point.net_power_kw, selectedEnergy), color },
								{
									label: 'Kumuliert',
									value: formatPower(point.cumulative_power_kw, selectedEnergy)
								}
							]
						: []}
					container={containerEl}
				/>
			</svelte:fragment>
		</Chart>
	{/if}
</div>
