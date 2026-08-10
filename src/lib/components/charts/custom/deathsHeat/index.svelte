<script>
	import Papa from 'papaparse';
	import Select from '$lib/components/ui/Select.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { Chart, AxisX, AxisY, Tooltip } from '$lib/components/charts/primitives';
	import { theme } from '$lib/stores/theme';

	export let chart;
	export let v;
	export let onChartData = undefined;

	const ASSET_URL = 'https://base.klimadashboard.org/assets/e5eb29a4-6c13-445e-8f01-bbf5f01c52ca';
	const BAR_COLOR = '#991B1B';

	let rawData = [];
	let regions = /** @type {string[]} */ ([]);
	let selectedRegion = 'Deutschland';
	let perCapita = false;
	let loading = true;

	$: isDark = $theme === 'dark';
	$: ciOverlayFill = isDark ? '#000000' : 'white';
	$: ciOverlayOpacity = isDark ? 0.25 : 0.45;
	$: hatchStroke = isDark ? '#cccccc' : '#606060';

	$: regionOptions = regions.map((r) => ({ value: r, label: r }));
	$: valueKey = perCapita ? 'ExpectedValuePer100000' : 'ExpectedValue';
	$: lowerKey = perCapita ? 'LowerPredictionLimitPer100000' : 'LowerPredictionLimit';
	$: upperKey = perCapita ? 'UpperPredictionLimitPer100000' : 'UpperPredictionLimit';

	$: dataset = rawData
		.filter((d) => d.Region === selectedRegion)
		.map((d) => ({
			year: d.Year,
			value: d[valueKey],
			lower: d[lowerKey],
			upper: d[upperKey]
		}))
		.sort((a, b) => a.year - b.year);

	$: yMaxValue =
		dataset.length > 0 ? Math.max(...dataset.map((d) => Math.max(d.upper ?? 0, d.value ?? 0))) : 0;
	$: yMinValue =
		dataset.length > 0 ? Math.min(0, ...dataset.map((d) => d.lower ?? 0)) : 0;

	$: yDivisor = yMaxValue >= 1_000 ? 1_000 : 1;
	$: yUnit = yMaxValue >= 1_000 ? 'Tsd.' : '';

	$: formatY = (val) => {
		const divided = val / yDivisor;
		if (Number.isInteger(divided)) return String(divided);
		return divided.toLocaleString('de-DE', { maximumFractionDigits: 1 });
	};

	$: leftMargin = (() => {
		const sample = formatY(Math.ceil(yMaxValue));
		return Math.max(sample.length * 7 + 16, 35);
	})();

	function buildTooltipItems(hoverX) {
		const point = dataset.find((d) => d.year === hoverX);
		if (!point) return [];
		const unit = perCapita ? '' : '';
		const fmt = (n) =>
			n != null ? n.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '–';
		const items = [
			{
				label: perCapita ? 'Erwartete Todesfälle / 100.000' : 'Erwartete Todesfälle',
				value: fmt(point.value),
				color: BAR_COLOR
			}
		];
		if (point.lower != null && point.upper != null) {
			items.push({
				label: '95%-Prognoseintervall',
				value: `${fmt(point.lower)} – ${fmt(point.upper)}`,
				color: BAR_COLOR + '60'
			});
		}
		return items;
	}

	async function fetchData() {
		return new Promise((resolve, reject) => {
			Papa.parse(ASSET_URL, {
				download: true,
				dynamicTyping: true,
				header: true,
				delimiter: ';',
				skipEmptyLines: true,
				complete(results) {
					rawData = results.data.filter((d) => d.Year != null && d.Region != null);
					regions = [...new Set(rawData.map((d) => d.Region))].sort((a, b) => {
						if (a === 'Deutschland') return -1;
						if (b === 'Deutschland') return 1;
						return a.localeCompare(b, 'de');
					});
					loading = false;

					if (onChartData) {
						const deData = rawData.filter((d) => d.Region === 'Deutschland');
						onChartData({
							raw: rawData,
							table: {
								columns: [
									{ key: 'Year', label: 'Jahr', align: 'left' },
									{
										key: 'ExpectedValue',
										label: 'Erwartete Todesfälle',
										align: 'right',
										format: (val) =>
											typeof val === 'number' ? val.toLocaleString('de-DE') : '–'
									},
									{
										key: 'LowerPredictionLimit',
										label: 'Untere Grenze',
										align: 'right',
										format: (val) =>
											typeof val === 'number' ? val.toLocaleString('de-DE') : '–'
									},
									{
										key: 'UpperPredictionLimit',
										label: 'Obere Grenze',
										align: 'right',
										format: (val) =>
											typeof val === 'number' ? val.toLocaleString('de-DE') : '–'
									},
									{
										key: 'ExpectedValuePer100000',
										label: 'Pro 100.000 Einw.',
										align: 'right',
										format: (val) =>
											typeof val === 'number'
												? val.toLocaleString('de-DE', { maximumFractionDigits: 1 })
												: '–'
									}
								],
								rows: deData,
								filename: 'hitzetote_deutschland'
							},
							placeholders: {},
							meta: { source: 'Klimadashboard' }
						});
					}
					resolve();
				},
				error: reject
			});
		});
	}

	fetchData();
</script>

<div class="flex flex-wrap items-end gap-3">
	{#if regions.length > 1}
		<Select label="Region" bind:value={selectedRegion} options={regionOptions} hideLabel />
	{/if}
</div>

<div class="flex flex-wrap items-center gap-4 mt-3 mb-4">
	<Toggle label="Pro 100.000 Einw." bind:checked={perCapita} />
</div>

{#if !loading && dataset.length > 0}
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
				<defs>
					<pattern id="hatch-ci" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
						<line x1="0" y1="0" x2="0" y2="4" stroke={hatchStroke} stroke-width="1.5" />
					</pattern>
				</defs>
				<g>
					{#each data as d}
						{@const bx = xScale(d.year) ?? 0}
						{@const bw = xScale.bandwidth?.() ?? 20}
						{@const zero = yScale(0) ?? innerHeight}
						{@const isHovered = hover.x === d.year}
						{@const dimmed = hover.x !== null && !isHovered}

						<!-- Main bar — only when value != 0 -->
						{#if d.value != null && d.value !== 0}
							{@const isEstimate = d.year === 2026}
							{@const barTop = d.value >= 0 ? (yScale(d.value) ?? 0) : zero}
							{@const barBot = d.value >= 0 ? zero : (yScale(d.value) ?? zero)}
							{@const barHeight = Math.max(1, barBot - barTop)}
							<rect
								x={bx}
								y={barTop}
								width={bw}
								height={barHeight}
								fill={BAR_COLOR}
								fill-opacity={isEstimate ? 0.3 : 1}
								stroke={isEstimate ? BAR_COLOR : 'none'}
								stroke-width={isEstimate ? 1.5 : 0}
								stroke-dasharray={isEstimate ? '4,3' : undefined}
								opacity={dimmed ? 0.4 : 1}
								rx="2"
								class="transition-opacity duration-100"
							>
								<title
									>{perCapita
										? d.value.toLocaleString('de-DE', { maximumFractionDigits: 1 }) +
											' / 100.000'
										: d.value.toLocaleString('de-DE') + ' Todesfälle'}</title
								>
							</rect>
						{/if}

						<!-- Confidence interval band: white overlay + dark hatching on top -->
						{#if d.lower != null && d.upper != null}
							{@const ciTop = yScale(d.upper) ?? 0}
							{@const ciBot = yScale(d.lower) ?? zero}
							<rect
								x={bx}
								y={ciTop}
								width={bw}
								height={Math.max(0, ciBot - ciTop)}
								fill={ciOverlayFill}
								opacity={dimmed ? 0.1 : ciOverlayOpacity}
								rx="1"
							/>
							<rect
								x={bx}
								y={ciTop}
								width={bw}
								height={Math.max(0, ciBot - ciTop)}
								fill="url(#hatch-ci)"
								opacity={dimmed ? 0.15 : 0.7}
								rx="1"
							/>
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
{:else if loading}
	<div class="h-80 animate-pulse rounded bg-gray-100 dark:bg-gray-800"></div>
{/if}
