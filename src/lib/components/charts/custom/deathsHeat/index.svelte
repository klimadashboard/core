<script>
	import Papa from 'papaparse';
	import Select from '$lib/components/ui/Select.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { Chart, AxisX, AxisY, Tooltip } from '$lib/components/charts/primitives';

	export let chart;
	export let v;
	export let onChartData = undefined;

	const ASSET_URL = 'https://base.klimadashboard.org/assets/e5eb29a4-6c13-445e-8f01-bbf5f01c52ca';
	const BAR_COLOR = '#e85d04';
	const BAR_COLOR_ESTIMATE = '#9d0208';

	let rawData = [];
	let regions = /** @type {string[]} */ ([]);
	let selectedRegion = 'Deutschland';
	let perCapita = false;
	let loading = true;

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
		const barColor = point.year === 2026 ? BAR_COLOR_ESTIMATE : BAR_COLOR;
		const items = [
			{
				label: perCapita ? 'Geschätzte Sterbefälle / 100.000' : 'Geschätzte Sterbefälle',
				value: fmt(point.value),
				color: barColor
			}
		];
		if (point.lower != null && point.upper != null) {
			items.push({
				label: '95%-Prädiktionsintervall',
				value: `${fmt(point.lower)} – ${fmt(point.upper)}`,
				icon: '<svg width="10" height="14" viewBox="0 0 10 14" xmlns="http://www.w3.org/2000/svg"><line x1="5" y1="0" x2="5" y2="14" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="0" x2="8" y2="0" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="14" x2="8" y2="14" stroke="currentColor" stroke-width="1.5"/></svg>'
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
						const deData = rawData.filter((/** @type {any} */ d) => d.Region === 'Deutschland');
						const latest = deData.reduce((/** @type {any} */ a, /** @type {any} */ b) => (b.Year > a.Year ? b : a), deData[0]);

						const fmt = (/** @type {any} */ val) =>
							typeof val === 'number' ? val.toLocaleString('de-DE') : '–';
						const fmt1 = (/** @type {any} */ val) =>
							typeof val === 'number'
								? val.toLocaleString('de-DE', { maximumFractionDigits: 1 })
								: '–';
						const updateRaw = rawData.find((/** @type {any} */ d) => d.Update)?.Update;
						const updateDate = updateRaw ? new Date(updateRaw) : null;
						const update = updateDate && !isNaN(+updateDate)
							? updateDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
							: '';
						const fmtPer100k = (/** @type {any} */ val) =>
							val != null ? val.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '';
						const saarland2026 = rawData.find((/** @type {any} */ d) => d.Region === 'Saarland' && d.Year === 2026);
						const schleswig2026 = rawData.find((/** @type {any} */ d) => d.Region === 'Schleswig-Holstein' && d.Year === 2026);
						onChartData({
							raw: rawData,
							table: {
								columns: [
									{ key: 'Year', label: 'Jahr', align: 'left' },
									{ key: 'Region', label: 'Region', align: 'left' },
									{ key: 'ExpectedValue', label: 'Geschätzte Anzahl Sterbefälle', align: 'right', format: fmt },
									{ key: 'LowerPredictionLimit', label: 'Untere Prädiktionsgrenze', align: 'right', format: fmt },
									{ key: 'UpperPredictionLimit', label: 'Obere Prädiktionsgrenze', align: 'right', format: fmt },
									{ key: 'Population', label: 'Bevölkerung', align: 'right', format: fmt },
									{ key: 'ExpectedValuePer100000', label: 'Sterbefälle pro 100.000 Einw.', align: 'right', format: fmt1 },
									{ key: 'LowerPredictionLimitPer100000', label: 'Untere Prädiktionsgrenze pro 100.000 Einw.', align: 'right', format: fmt1 },
									{ key: 'UpperPredictionLimitPer100000', label: 'Obere Prädiktionsgrenze pro 100.000 Einw.', align: 'right', format: fmt1 }
								],
								rows: rawData,
								filename: 'hitzetote'
							},
							placeholders: {
								deaths: latest?.ExpectedValue != null ? latest.ExpectedValue.toLocaleString('de-DE') : '',
								year: latest?.Year ?? '',
								update,
								deathsSaarland2026per100000: fmtPer100k(saarland2026?.ExpectedValuePer100000),
								'deathsSchleswig-Holstein2026per100000': fmtPer100k(schleswig2026?.ExpectedValuePer100000)
							}
						});
					}
					resolve(undefined);
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
				{#key selectedRegion}
				<g>
					{#each data as d, i}
						{@const bx = xScale(d.year) ?? 0}
						{@const bw = xScale.bandwidth?.() ?? 20}
						{@const zero = yScale(0) ?? innerHeight}
						{@const isHovered = hover.x === d.year}
						{@const dimmed = hover.x !== null && !isHovered}
						{@const isEstimate = d.year === 2026}

						<!-- Main bar — only when value != 0 -->
						{#if d.value != null && d.value !== 0}
							{@const barTop = d.value >= 0 ? (yScale(d.value) ?? 0) : zero}
							{@const barBot = d.value >= 0 ? zero : (yScale(d.value) ?? zero)}
							{@const barHeight = Math.max(1, barBot - barTop)}
							<rect
								x={bx}
								y={barTop}
								width={bw}
								height={barHeight}
								fill={isEstimate ? BAR_COLOR_ESTIMATE : BAR_COLOR}
								opacity={dimmed ? 0.4 : 1}
								rx="2"
								class="bar-animated transition-opacity duration-100"
								style="animation-delay: {i * 0.182}s"
							>
								<title
									>{perCapita
										? d.value.toLocaleString('de-DE', { maximumFractionDigits: 1 }) +
											' / 100.000'
										: d.value.toLocaleString('de-DE') + ' Todesfälle'}</title
								>
							</rect>
						{/if}

						<!-- Error bar for CI range -->
						{#if d.lower != null && d.upper != null}
							{@const cx = bx + bw / 2}
							{@const capW = bw * 0.2}
							{@const ciTop = yScale(d.upper) ?? 0}
							{@const ciBot = yScale(d.lower) ?? zero}
							<g class="errorbar-animated" style="animation-delay: {i * 0.182 + 1.452}s">
							<g class="dark:opacity-80">
							<g class="text-black dark:text-white" opacity={dimmed ? 0.3 : 1}>
								<line x1={cx} y1={ciTop} x2={cx} y2={ciBot} stroke="currentColor" stroke-width="1.5" />
								<line x1={cx - capW / 2} y1={ciTop} x2={cx + capW / 2} y2={ciTop} stroke="currentColor" stroke-width="1.5" />
								<line x1={cx - capW / 2} y1={ciBot} x2={cx + capW / 2} y2={ciBot} stroke="currentColor" stroke-width="1.5" />
							</g>
							</g>
							</g>
						{/if}
					{/each}
				</g>
				{/key}
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

<style>
	.bar-animated {
		transform-box: fill-box;
		transform-origin: bottom;
		animation: bar-grow 0.847s ease-out both;
	}

	@keyframes bar-grow {
		from { transform: scaleY(0); }
		to   { transform: scaleY(1); }
	}

	.errorbar-animated {
		animation: errorbar-appear 0.303s ease-out both;
	}

	@keyframes errorbar-appear {
		from { opacity: 0; }
		to   { opacity: 1; }
	}
</style>
