<!-- $lib/components/charts/custom/carsDensity/index.svelte -->
<script lang="ts">
	import { formatNumber } from '$lib/utils/formatters';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/state';
	import { t } from '$lib/utils/t';
	import { scaleLinear } from 'd3-scale';
	import { line as d3Line, curveMonotoneX } from 'd3-shape';
	import { min, max } from 'd3-array';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		fetchData,
		getPlaceholders,
		getLatestData,
		buildChartData,
		getColor,
		type CarDensityData
	} from './config';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// SVG icon paths (Tabler Icons)
	const ICON_VIEWBOX = '0 0 24 24';

	// Tabler: man (filled)
	const MAN_PATH =
		'M15 8c1.628 0 3.2 .787 4.707 2.293a1 1 0 0 1 -1.414 1.414c-.848 -.848 -1.662 -1.369 -2.444 -1.587l-.849 5.944v4.936a1 1 0 0 1 -2 0v-4h-2v4a1 1 0 0 1 -2 0v-4.929l-.85 -5.951c-.781 .218 -1.595 .739 -2.443 1.587a1 1 0 1 1 -1.414 -1.414c1.506 -1.506 3.08 -2.293 4.707 -2.293z';
	const MAN_HEAD = 'M12 1a3 3 0 1 1 -3 3l.005 -.176a3 3 0 0 1 2.995 -2.824';

	// Tabler: woman (filled)
	const WOMAN_PATH =
		'M14 8c1.91 0 3.79 .752 5.625 2.219a1 1 0 1 1 -1.25 1.562c-1.019 -.815 -2.016 -1.345 -2.997 -1.6l1.584 5.544a1 1 0 0 1 -.962 1.275h-1v4a1 1 0 0 1 -2 0v-4h-2v4a1 1 0 0 1 -2 0v-4h-1a1 1 0 0 1 -.962 -1.275l1.584 -5.545c-.98 .256 -1.978 .786 -2.997 1.601a1 1 0 1 1 -1.25 -1.562c1.733 -1.386 3.506 -2.133 5.307 -2.212l.335 -.007z';
	const WOMAN_HEAD = 'M12 1a3 3 0 1 1 -3 3l.005 -.176a3 3 0 0 1 2.995 -2.824';

	// Tabler: car (filled, side view)
	const CAR_PATH =
		'M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z';

	// Unique ID for SVG clipPaths to avoid collisions
	const uid = Math.random().toString(36).slice(2, 8);

	// Number of icons in the pictogram row
	const ICON_COUNT = 10;

	// Line chart configuration
	const lineChartHeight = 120;
	const margin = { top: 10, right: 10, bottom: 24, left: 50 };

	// State
	let loading = true;
	let error: string | null = null;
	let data: CarDensityData | null = null;
	let chartWidth = 400;

	// Tooltip state
	let tooltipVisible = false;
	let tooltipX = 0;
	let tooltipY = 0;
	let tooltipTitle = '';
	let tooltipItems: Array<{ label: string; value: string; color?: string }> = [];

	// Theme-aware colors
	$: isDark = $theme === 'dark';
	$: carsColor = getColor('cars', isDark);
	$: privateColor = getColor('private', isDark);
	$: companyColor = getColor('company', isDark);

	// Load data when region changes
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			data = await fetchData(fetch, region);

			if (onChartData && data) {
				const privacyNote = t(page.data.translations, 'ui.card.privacyNote');
				onChartData(buildChartData(data, region, privacyNote));
			}
		} catch (e) {
			console.error('[CarDensity] Error loading data:', e);
			error = e instanceof Error ? e.message : t(page.data.translations, 'status.error');
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Derived data
	$: placeholders = data ? getPlaceholders(data) : null;
	$: latestData = data ? getLatestData(data.region, data.periods) : null;
	$: nationalLatest = data ? getLatestData(data.national, data.periods) : null;

	// ---- Chart 1: Autodichte (Pictogram table) ----
	$: regionCarsPer1000 = latestData?.carsPer1000 ?? 0;
	$: nationalCarsPer1000 = nationalLatest?.carsPer1000 ?? 0;

	// Cars per 10 people
	$: carsPerTenRegion = regionCarsPer1000 / 100;
	$: carsPerTenNational = nationalCarsPer1000 / 100;

	$: fullCarsRegion = Math.floor(carsPerTenRegion);
	$: partialFractionRegion = carsPerTenRegion - fullCarsRegion;

	$: fullCarsNational = Math.floor(carsPerTenNational);
	$: partialFractionNational = carsPerTenNational - fullCarsNational;

	// ---- Chart 2: Privat vs Firmen ----
	$: privateShare = latestData?.privateShare ?? 0;
	$: companyShare = latestData?.companyShare ?? 0;

	// ---- Chart 3: Historical line chart ----
	$: lineData = data
		? data.region.cars
				.filter((d) => d.value != null)
				.map((d) => ({ year: Number(d.period), value: d.value as number }))
		: [];

	$: innerWidth = chartWidth - margin.left - margin.right;
	$: innerHeight = lineChartHeight - margin.top - margin.bottom;

	type LinePoint = { year: number; value: number };

	$: xScale =
		lineData.length > 0
			? scaleLinear()
					.domain([
						min(lineData, (d: LinePoint) => d.year) ?? 0,
						max(lineData, (d: LinePoint) => d.year) ?? 0
					])
					.range([0, innerWidth])
			: scaleLinear().domain([0, 1]).range([0, innerWidth]);

	$: yMin = 0;
	$: yMax = lineData.length > 0 ? (max(lineData, (d: LinePoint) => d.value) ?? 0) * 1.05 : 1;

	$: yScale = scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

	$: linePath =
		lineData.length > 1
			? (d3Line<LinePoint>()
					.x((d: LinePoint) => xScale(d.year))
					.y((d: LinePoint) => yScale(d.value))
					.curve(curveMonotoneX)(lineData) ?? '')
			: '';

	function handleLineHover(event: MouseEvent) {
		if (!lineData.length) return;

		const svgEl = (event.currentTarget as SVGElement).closest('svg');
		if (!svgEl) return;

		const rect = svgEl.getBoundingClientRect();
		const mouseX = event.clientX - rect.left - margin.left;
		const year = Math.round(xScale.invert(mouseX));

		const point = lineData.find((d) => d.year === year);
		if (point) {
			tooltipVisible = true;
			tooltipX = event.clientX;
			tooltipY = event.clientY;
			tooltipTitle = String(point.year);
			tooltipItems = [
				{
					label: t(page.data.translations, 'domain.transport.carsTotal'),
					value: formatNumber(point.value),
					color: carsColor
				}
			];
		}
	}

	function handleLineLeave() {
		tooltipVisible = false;
	}
</script>

<Tooltip
	visible={tooltipVisible}
	x={tooltipX}
	y={tooltipY}
	title={tooltipTitle}
	items={tooltipItems}
/>

{#if loading || regionLoading}
	<div class="h-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-64 flex items-center justify-center text-red-500">{error}</div>
{:else if !data || !latestData?.cars}
	<p class="text-lg leading-snug">
		{t(page.data.translations, 'domain.transport.selectRegionDensity')}
	</p>
{:else}
	<div class="@container">
		<div class="grid grid-cols-1 @lg:grid-cols-2 gap-6">
			<!-- Left column: Pictogram + Private/Company -->
			<div class="flex flex-col gap-6">
				<!-- Pictogram: People vs Cars -->
				<section class="flex flex-col gap-1">
					<!-- Row 1: People (alternating man/woman) -->
					<div class="flex items-center gap-2">
						<div class="flex items-center shrink-0">
							{#each Array(ICON_COUNT) as _, i}
								<svg
									viewBox={ICON_VIEWBOX}
									class="w-6 h-6 shrink-0"
									fill="currentColor"
									opacity="0.45"
								>
									{#if i % 2 === 0}
										<path d={MAN_PATH} />
										<path d={MAN_HEAD} />
									{:else}
										<path d={WOMAN_PATH} />
										<path d={WOMAN_HEAD} />
									{/if}
								</svg>
							{/each}
						</div>
						<span class="text-xs leading-tight whitespace-nowrap shrink-0"
							>10 {t(page.data.translations, 'domain.transport.residents')}</span
						>
					</div>

					<!-- Row 2: Region cars -->
					<div class="flex items-center gap-2">
						<div class="flex items-center shrink-0">
							{#each Array(fullCarsRegion) as _, i}
								<svg viewBox={ICON_VIEWBOX} class="w-6 h-6 shrink-0" fill={carsColor}>
									<path d={CAR_PATH} />
								</svg>
							{/each}
							{#if partialFractionRegion > 0.05}
								<svg viewBox={ICON_VIEWBOX} class="w-6 h-6 shrink-0" style="overflow: hidden;">
									<defs>
										<clipPath id="partial-region-{uid}">
											<rect x="0" y="0" width={24 * partialFractionRegion} height="24" />
										</clipPath>
									</defs>
									<path d={CAR_PATH} fill={carsColor} opacity="0.15" />
									<path d={CAR_PATH} fill={carsColor} clip-path="url(#partial-region-{uid})" />
								</svg>
							{/if}
						</div>
						<span
							class="text-xs leading-tight whitespace-nowrap shrink-0"
							style="color: {carsColor}"
						>
							{carsPerTenRegion.toFixed(1)}
							{t(page.data.translations, 'domain.transport.carsIn')}
							{data.region.name}
						</span>
					</div>

					<!-- Row 3: National cars -->
					<div class="flex items-center gap-2">
						<div class="flex items-center shrink-0">
							{#each Array(fullCarsNational) as _, i}
								<svg viewBox={ICON_VIEWBOX} class="w-6 h-6 shrink-0" fill={carsColor} opacity="0.4">
									<path d={CAR_PATH} />
								</svg>
							{/each}
							{#if partialFractionNational > 0.05}
								<svg viewBox={ICON_VIEWBOX} class="w-6 h-6 shrink-0" style="overflow: hidden;">
									<defs>
										<clipPath id="partial-national-{uid}">
											<rect x="0" y="0" width={24 * partialFractionNational} height="24" />
										</clipPath>
									</defs>
									<path d={CAR_PATH} fill={carsColor} opacity="0.1" />
									<path
										d={CAR_PATH}
										fill={carsColor}
										opacity="0.4"
										clip-path="url(#partial-national-{uid})"
									/>
								</svg>
							{/if}
						</div>
						<span class="text-xs leading-tight whitespace-nowrap shrink-0 opacity-50">
							{carsPerTenNational.toFixed(1)}
							{t(page.data.translations, 'domain.transport.carsIn')}
							{data.country.name}
						</span>
					</div>
				</section>

				<!-- Privat vs. Firmen -->
				{#if latestData.privateShare != null && latestData.companyShare != null}
					<section class="flex flex-col gap-1">
						<div class="rounded overflow-hidden">
							<svg width="100%" height="20">
								<rect
									x="0"
									y="0"
									width="{privateShare}%"
									height="20"
									fill={privateColor}
									class="transition-all"
								/>
								<rect
									x="{privateShare}%"
									y="0"
									width="{companyShare}%"
									height="20"
									fill={companyColor}
									class="transition-all"
								/>
							</svg>
						</div>
						<div class="flex justify-between text-xs font-semibold">
							<span style="color: {privateColor}"
								>{t(page.data.translations, 'domain.transport.privateCars')}
								{Math.round(privateShare)}%</span
							>
							<span style="color: {companyColor}"
								>{t(page.data.translations, 'domain.transport.companyCars')}
								{Math.round(companyShare)}%</span
							>
						</div>
					</section>
				{/if}
			</div>

			<!-- Right column: Historical line chart -->
			{#if lineData.length > 1}
				<section class="flex flex-col gap-1">
					<div bind:clientWidth={chartWidth}>
						<svg width="100%" height={lineChartHeight}>
							<g transform="translate({margin.left},{margin.top})">
								<!-- Y-axis gridlines and labels -->
								{#each yScale.ticks(3) as tick}
									<line
										x1="0"
										y1={yScale(tick)}
										x2={innerWidth}
										y2={yScale(tick)}
										stroke="currentColor"
										stroke-opacity="0.1"
									/>
									<text
										x="-6"
										y={yScale(tick)}
										text-anchor="end"
										dominant-baseline="middle"
										fill="currentColor"
										font-size="10"
										opacity="0.5"
									>
										{formatNumber(tick)}
									</text>
								{/each}

								<!-- X-axis labels -->
								{#each xScale
									.ticks(Math.min(lineData.length, chartWidth > 300 ? 5 : 3))
									.filter((t) => Number.isInteger(t)) as tick}
									<text
										x={xScale(tick)}
										y={innerHeight + 16}
										text-anchor="middle"
										fill="currentColor"
										font-size="10"
										opacity="0.5"
									>
										{tick}
									</text>
								{/each}

								<!-- Line -->
								<path d={linePath} fill="none" stroke={carsColor} stroke-width="2" />

								<!-- Hover overlay -->
								<rect
									x="0"
									y="0"
									width={innerWidth}
									height={innerHeight}
									fill="transparent"
									on:mousemove={handleLineHover}
									on:mouseleave={handleLineLeave}
								/>

								<!-- Data points -->
								{#each lineData as point}
									<circle
										cx={xScale(point.year)}
										cy={yScale(point.value)}
										r="3"
										fill={carsColor}
										opacity="0.6"
									/>
								{/each}
							</g>
						</svg>
					</div>
				</section>
			{/if}
		</div>
	</div>
{/if}
