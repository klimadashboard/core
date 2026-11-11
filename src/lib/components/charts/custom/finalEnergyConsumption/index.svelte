<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Chart, AxisX, AxisY, BarStack, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import { formatNumber } from '$lib/utils/formatters';
	import {
		fetchData,
		buildChartData,
		categoriesOf,
		valueOf,
		defaultDimension,
		type Dimension,
		type FinalEnergyData
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let data: FinalEnergyData | null = null;
	let loading = true;
	let error: string | null = null;
	let dimension: Dimension = 'sector';
	let hidden = new Set<string>();
	let containerWidth = 0;

	$: isMobile = containerWidth < 500;
	$: dimensionOptions = data
		? [
				{ value: 'sector', label: 'Sektoren' },
				{ value: 'carrier', label: 'Energieträger' }
			].filter((o) => categoriesOf(data!, o.value as Dimension).length)
		: [];
	$: categories = data ? categoriesOf(data, dimension) : [];
	$: visible = categories.filter((c) => !hidden.has(c.key));

	// TWh for the chart
	$: stackedData = (data?.years ?? []).map((year) => {
		let y0 = 0;
		const segments = visible.map((c) => {
			const value = valueOf(data!, year, c.key) / 1e6;
			const seg = { key: c.key, label: c.label, value, y0, y1: y0 + value, color: c.color };
			y0 += value;
			return seg;
		});
		return { year: String(year), total: y0, segments };
	});
	$: yMax = Math.max(1, ...stackedData.map((d) => d.total)) * 1.05;

	function selectDimension(d: Dimension) {
		hidden = new Set();
		if (data) onChartData?.(buildChartData(data, region, d));
	}
	$: selectDimension(dimension);

	function tooltipItems(year: string | null) {
		const bar = stackedData.find((d) => d.year === year);
		if (!bar) return [];
		return [
			...[...bar.segments]
				.reverse()
				.map((s) => ({ label: s.label, value: `${formatNumber(s.value, 1)} TWh`, color: s.color })),
			{ label: 'Gesamt', value: `${formatNumber(bar.total, 1)} TWh` }
		];
	}

	async function loadData(r: Region | null) {
		loading = true;
		error = null;
		try {
			data = await fetchData(r?.id ?? null, fetch);
			if (data) dimension = defaultDimension(data);
			onChartData?.(data ? buildChartData(data, r, dimension) : null);
		} catch (e) {
			console.error('[FinalEnergyConsumption] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	$: loadData(region);
</script>

<div bind:clientWidth={containerWidth}>
	{#if loading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data}
		<div class="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
			Keine Daten verfügbar
		</div>
	{:else}
		{#if dimensionOptions.length > 1}
			<div class="mb-3">
				<RadioGroup label="Ansicht" hideLabel bind:value={dimension} options={dimensionOptions} />
			</div>
		{/if}

		<Chart
			data={stackedData}
			x="year"
			y="total"
			xType="band"
			height={300}
			yMin={0}
			{yMax}
			padding={0.25}
			margin={{ top: 15, right: isMobile ? 10 : 20, bottom: 35, left: isMobile ? 40 : 55 }}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<BarStack data={stackedData} x="year" {xScale} {yScale} {hover} radius={2} />
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={(v) => formatNumber(v)} unit="TWh" />
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={String} tickCount={isMobile ? 6 : 12} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={String(hover.x ?? '')}
					items={tooltipItems(hover.x)}
				/>
			</svelte:fragment>
		</Chart>

		<div class="mt-3">
			<Legend items={categories} bind:hidden interactive />
		</div>
	{/if}
</div>
