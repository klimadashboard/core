<script>
	import Select from '$lib/components/ui/Select.svelte';
	import RadioGroup from '$lib/components/ui/RadioGroup.svelte';
	import { Chart, AxisX, AxisY, Tooltip } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import { fetchRows, getRegions, buildChartData, NATIONAL, PERIOD_LABELS } from './config';

	export let region = null;
	export let onChartData = undefined;

	const BAR_COLOR = '#e85d04';

	let rawData = [];
	let selectedRegion = NATIONAL;
	/** @type {'Jun-Aug' | 'Jun-Sep'} */
	let period = 'Jun-Aug';
	let loading = true;
	let error = /** @type {string | null} */ (null);

	const periodOptions = [
		{ value: 'Jun-Aug', label: PERIOD_LABELS['Jun-Aug'] },
		{ value: 'Jun-Sep', label: PERIOD_LABELS['Jun-Sep'] }
	];

	// Federal state values exist only for June–September
	$: periodRows = rawData.filter((d) => d.Period === period);
	$: regions = getRegions(periodRows);
	$: if (!regions.includes(selectedRegion)) selectedRegion = NATIONAL;
	$: regionOptions = regions.map((r) => ({ value: r, label: r }));

	$: dataset = periodRows
		.filter((d) => d.Region === selectedRegion)
		.map((d) => ({
			year: d.Year,
			value: d.ExpectedValue,
			lower: d.LowerPredictionLimit,
			upper: d.UpperPredictionLimit
		}))
		.sort((a, b) => a.year - b.year);

	$: yMaxValue =
		dataset.length > 0 ? Math.max(...dataset.map((d) => Math.max(d.upper ?? 0, d.value ?? 0))) : 0;
	$: yMinValue = dataset.length > 0 ? Math.min(0, ...dataset.map((d) => d.lower ?? 0)) : 0;

	$: yDivisor = yMaxValue >= 1_000 ? 1_000 : 1;
	$: yUnit = yMaxValue >= 1_000 ? 'Tsd.' : '';

	$: formatY = (val) => {
		const divided = val / yDivisor;
		return formatNumber(divided, Number.isInteger(divided) ? 0 : 1);
	};

	$: leftMargin = (() => {
		const sample = formatY(Math.ceil(yMaxValue));
		return Math.max(sample.length * 7 + 16, 35);
	})();

	const fmt = (n) => (n != null ? formatNumber(n) : '–');

	function buildTooltipItems(hoverX) {
		const point = dataset.find((d) => d.year === hoverX);
		if (!point) return [];
		const items = [{ label: 'Geschätzte Sterbefälle', value: fmt(point.value), color: BAR_COLOR }];
		if (point.lower != null && point.upper != null) {
			items.push({
				label: '95 %-Unsicherheitsintervall',
				value: `${fmt(point.lower)} – ${fmt(point.upper)}`,
				icon: '<svg width="10" height="14" viewBox="0 0 10 14" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="0" x2="5" y2="14" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="0" x2="8" y2="0" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="14" x2="8" y2="14" stroke="currentColor" stroke-width="1.5"/></svg>'
			});
		}
		return items;
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			rawData = await fetchRows();
			onChartData?.(buildChartData(rawData));
		} catch (e) {
			console.error('[deathsHeatAustria] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			rawData = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	loadData();
</script>

<div class="flex flex-wrap items-center gap-3 mb-4">
	<RadioGroup label="Zeitraum" bind:value={period} options={periodOptions} inline hideLabel />
	<Select
		label="Region"
		bind:value={selectedRegion}
		options={regionOptions}
		hideLabel
		disabled={regions.length <= 1}
	/>
	{#if period === 'Jun-Aug'}
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Werte für die Bundesländer gibt es nur für Juni–September.
		</p>
	{/if}
</div>

{#if loading}
	<div class="h-80 animate-pulse rounded bg-gray-100 dark:bg-gray-800"></div>
{:else if error}
	<div class="h-80 flex items-center justify-center text-red-500">{error}</div>
{:else if dataset.length === 0}
	<div class="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
		Keine Daten verfügbar
	</div>
{:else}
	<Chart
		data={dataset}
		x="year"
		y={['value']}
		xType="band"
		height={320}
		yMin={yMinValue < 0 ? yMinValue * 1.1 : 0}
		yMax={yMaxValue * 1.15}
		margin={{ top: 10, right: 20, bottom: 40, left: leftMargin }}
		padding={0.25}
	>
		<svelte:fragment
			slot="default"
			let:data
			let:xScale
			let:yScale
			let:xDomain
			let:innerWidth
			let:innerHeight
			let:hover
		>
			<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
			<AxisX
				{xScale}
				{xDomain}
				{innerWidth}
				{innerHeight}
				format={String}
				tickCount={dataset.length}
			/>

			{#if xScale && yScale}
				<g>
					{#each data as d}
						{@const bx = xScale(d.year) ?? 0}
						{@const bw = xScale.bandwidth?.() ?? 20}
						{@const zero = yScale(0) ?? innerHeight}
						{@const dimmed = hover.x !== null && hover.x !== d.year}

						{#if d.value != null && d.value !== 0}
							{@const barTop = d.value >= 0 ? (yScale(d.value) ?? 0) : zero}
							{@const barBot = d.value >= 0 ? zero : (yScale(d.value) ?? zero)}
							<rect
								x={bx}
								y={barTop}
								width={bw}
								height={Math.max(1, barBot - barTop)}
								fill={BAR_COLOR}
								opacity={dimmed ? 0.4 : 1}
								rx="2"
								class="transition-opacity duration-100"
							>
								<title>{fmt(d.value)} Todesfälle</title>
							</rect>
						{/if}

						{#if d.lower != null && d.upper != null}
							{@const cx = bx + bw / 2}
							{@const capW = bw * 0.2}
							{@const ciTop = yScale(d.upper) ?? 0}
							{@const ciBot = yScale(d.lower) ?? zero}
							<g class="text-black dark:text-white dark:opacity-80">
								<g opacity={dimmed ? 0.3 : 1}>
									<line x1={cx} y1={ciTop} x2={cx} y2={ciBot} stroke="currentColor" stroke-width="1.5" />
									<line x1={cx - capW / 2} y1={ciTop} x2={cx + capW / 2} y2={ciTop} stroke="currentColor" stroke-width="1.5" />
									<line x1={cx - capW / 2} y1={ciBot} x2={cx + capW / 2} y2={ciBot} stroke="currentColor" stroke-width="1.5" />
								</g>
							</g>
						{/if}
					{/each}
				</g>
			{/if}

			<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={formatY} unit={yUnit} />
		</svelte:fragment>

		<svelte:fragment slot="tooltip" let:hover>
			<Tooltip
				visible={hover.x !== null}
				x={hover.clientX}
				y={hover.clientY}
				title={String(hover.x ?? '')}
				items={buildTooltipItems(hover.x)}
			/>
		</svelte:fragment>
	</Chart>
{/if}
