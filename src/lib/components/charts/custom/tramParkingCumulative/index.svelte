<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Chart, AxisY, Line, RuleX, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import { loadIncidents, buildSeries, buildChartData, type YearSeries } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let loading = true;
	let error: string | null = null;
	let series: YearSeries[] = [];
	let containerWidth = 0;

	const MONTHS = [
		'Jän',
		'Feb',
		'Mär',
		'Apr',
		'Mai',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Okt',
		'Nov',
		'Dez'
	];
	// first day of each month as day-of-year (non-leap year)
	const MONTH_STARTS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

	// 18 Feb -- start of the "Beschleunigungsoffensive" of the City of Vienna
	const ANNOTATION = { year: 2026, day: 49, label: 'Beschleunigungsoffensive der Stadt Wien' };

	// The current year and the two before get a red sequential scale (darkest =
	// newest) with decreasing line widths; the year label at each line end keeps
	// them distinguishable without colour. Older years are thin grey context lines.
	const HIGHLIGHT_STYLES = [
		{ color: '#A50F15', width: 3, dash: null },
		{ color: '#EF3B2C', width: 2.25, dash: null },
		{ color: '#FC9272', width: 1.75, dash: null }
	];
	const CURRENT_YEAR = Number(
		new Intl.DateTimeFormat('en', { timeZone: 'Europe/Vienna', year: 'numeric' }).format(new Date())
	);
	const CONTEXT_COLOR = '#d4d4d8';

	$: isMobile = containerWidth > 0 && containerWidth < 500;
	$: margin = { top: 20, right: isMobile ? 34 : 44, bottom: 30, left: isMobile ? 40 : 55 };

	$: years = series.map((s) => s.year);
	// follows the calendar, not the data: on 1 Jan the new year takes over the
	// darkest colour even before its first incident is recorded
	$: highlighted = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].filter((y) =>
		years.includes(y)
	);
	$: styleFor = (year: number) => {
		const i = highlighted.indexOf(year);
		return i >= 0 ? HIGHLIGHT_STYLES[i] : { color: CONTEXT_COLOR, width: 1, dash: null };
	};
	// draw context years first so highlighted lines sit on top
	$: drawOrder = [...series].sort(
		(a, b) => highlighted.indexOf(a.year) - highlighted.indexOf(b.year)
	);

	$: rows = Array.from({ length: 366 }, (_, i) => {
		const row: Record<string, number | null> = { day: i + 1 };
		for (const s of series) row[`y${s.year}`] = s.cases[i] ?? null;
		return row;
	});
	$: yKeys = years.map((y) => `y${y}`);

	$: olderYears = years.filter((y) => !highlighted.includes(y));
	$: legendItems = [
		...highlighted.map((y) => ({
			key: String(y),
			label: String(y),
			color: styleFor(y).color,
			dashed: !!styleFor(y).dash
		})),
		...(olderYears.length
			? [
					{
						key: 'older',
						label: `${olderYears[0]}–${olderYears[olderYears.length - 1]}`,
						color: CONTEXT_COLOR
					}
				]
			: [])
	];

	// Chart's slot props type the scales as a band/linear/null union; this chart
	// always uses linear scales.
	function px(scale: any, value: number): number {
		return scale(value);
	}

	function formatDay(day: number): string {
		const month = MONTH_STARTS.findLastIndex((start) => start <= day);
		return `${day - MONTH_STARTS[month] + 1}. ${MONTHS[month]}`;
	}

	function formatValue(v: number): string {
		return `${formatNumber(v, 0)} Vorfälle`;
	}

	$: annotationValue = series.find((s) => s.year === ANNOTATION.year)?.cases[ANNOTATION.day - 1];

	onMount(async () => {
		try {
			series = buildSeries(await loadIncidents(fetch));
			loading = false;
			onChartData?.(buildChartData(series));
		} catch (e) {
			console.error('tramParkingCumulative error:', e);
			error = e instanceof Error ? e.message : String(e);
			loading = false;
			onChartData?.(null);
		}
	});
</script>

{#if loading}
	<div class="h-[400px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[400px] flex items-center justify-center text-red-500">{error}</div>
{:else if !series.length}
	<div class="h-[400px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
{:else}
	<div class="mb-3">
		<Legend items={legendItems} />
	</div>

	<div bind:clientWidth={containerWidth}>
		<Chart data={rows} x="day" y={yKeys} height={400} {margin} yMin={0}>
			<svelte:fragment let:xScale let:yScale let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />

				<!-- month axis: ticks on the first of each month -->
				<g class="text-gray-500" transform="translate(0,{innerHeight})">
					{#each MONTH_STARTS as start, i}
						{#if !isMobile || i % 2 === 0}
							<line
								x1={px(xScale, start)}
								x2={px(xScale, start)}
								y1="0"
								y2="4"
								stroke="currentColor"
								class="text-gray-300 dark:text-gray-600"
							/>
							<text x={px(xScale, start)} y="18" class="text-xs fill-gray-500" text-anchor="start"
								>{MONTHS[i]}</text
							>
						{/if}
					{/each}
				</g>

				{#each drawOrder as s (s.year)}
					{@const st = styleFor(s.year)}
					<Line
						data={rows}
						x="day"
						y={`y${s.year}`}
						{xScale}
						{yScale}
						stroke={st.color}
						strokeWidth={st.width}
						strokeDasharray={st.dash}
					/>
				{/each}

				<!-- year labels at the end of the highlighted lines -->
				{#each highlighted as year}
					{@const s = series.find((x) => x.year === year)}
					{#if s}
						<text
							x={px(xScale, s.cases.length) + 4}
							y={px(yScale, s.cases.at(-1) ?? 0)}
							dy="0.32em"
							class="text-xs font-bold stroke-white dark:stroke-gray-900"
							stroke-width="3"
							paint-order="stroke"
							fill={styleFor(year).color}>{year}</text
						>
					{/if}
				{/each}

				<!-- annotation on the 2026 line -->
				{#if annotationValue != null}
					{@const ax = px(xScale, ANNOTATION.day)}
					{@const ay = px(yScale, annotationValue)}
					<!-- label sits in the empty upper-left area so it never crosses a line -->
					{@const labelY = Math.max(12, Math.min(ay - 40, innerHeight * 0.3))}
					<g class="pointer-events-none">
						<line
							x1={ax}
							x2={ax}
							y1={labelY + 6}
							y2={ay - 5}
							stroke="currentColor"
							class="text-gray-500 dark:text-gray-400"
						/>
						<circle
							cx={ax}
							cy={ay}
							r="4"
							fill={styleFor(ANNOTATION.year).color}
							class="stroke-white dark:stroke-gray-900"
							stroke-width="1.5"
						/>
						<!-- halo keeps the label readable where it crosses the year lines -->
						<text
							x={ax - 4}
							y={labelY}
							class="text-xs fill-gray-700 dark:fill-gray-300 stroke-white dark:stroke-gray-900"
							stroke-width="4"
							paint-order="stroke"
						>
							<tspan font-weight="bold">18. Feb {ANNOTATION.year}</tspan>
							<tspan x={ax - 4} dy="1.2em"
								>{isMobile ? 'Beschleunigungs­offensive' : ANNOTATION.label}</tspan
							>
						</text>
					</g>
				{/if}

				<RuleX {xScale} {innerHeight} {hover} />
				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					format={(v) => formatNumber(v, 0)}
					unit="Vorfälle"
				/>
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{@const day = hover.x}
				<Tooltip
					visible={day != null}
					x={hover.clientX}
					y={hover.clientY}
					title={day != null ? `bis ${formatDay(day)}` : ''}
					items={day != null
						? [...series]
								.reverse()
								.filter((s) => s.cases[day - 1] != null)
								.map((s) => ({
									label: String(s.year),
									value: formatValue(s.cases[day - 1]),
									color: styleFor(s.year).color
								}))
						: []}
				/>
			</svelte:fragment>
		</Chart>
	</div>
{/if}
