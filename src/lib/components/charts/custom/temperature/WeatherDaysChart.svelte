<!--
	Bar chart: number of climate index days (summer days, heat days, …) per year
	for one weather station. Uses the daily data already loaded by the temperature chart.
-->
<script lang="ts">
	import { Chart, AxisX, AxisY, BarY, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import { formatNumber } from '$lib/utils/formatters';

	type DailyRow = Record<string, any>;
	type YearRow = {
		year: number;
		value: number | null;
		missing: number;
		incomplete: boolean;
		current: boolean;
	};

	export let data: DailyRow[] = [];
	export let type: { key: string; label: string; color: string };
	export let isDay: (key: string, d: DailyRow) => boolean;
	export let stationName: string = '';

	// Field a day needs to be counted for each index
	const FIELD_BY_TYPE: Record<string, string> = {
		summerDay: 'tlmax',
		heatDay: 'tlmax',
		extremeHeatDay: 'tlmax',
		iceDay: 'tlmax',
		tropicalNight: 'tlmin',
		frostDay: 'tlmin',
		snowCoverDay: 'sh'
	};
	// First period the station fully covers is used for the reference line
	const REFERENCE_PERIODS = [
		[1961, 1990],
		[1991, 2020]
	];
	// A year with more missing days than this is shown as incomplete
	const MAX_MISSING_DAYS = 5;
	// Reference average needs at least this many complete years
	const MIN_REFERENCE_YEARS = 20;
	const REFERENCE_COLOR = '#6B7280'; // gray-500, readable in light and dark mode

	let mode: 'full' | 'ytd' = 'full';
	let width = 0;
	const hatchId = `weather-days-hatch-${Math.random().toString(36).slice(2, 8)}`;

	const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

	// Number of days from 1 January up to and including MM-DD
	function dayOfYear(year: number, md: string): number {
		const safeMd = md === '02-29' && !isLeap(year) ? '02-28' : md;
		const [m, d] = safeMd.split('-').map(Number);
		return Math.round((Date.UTC(year, m - 1, d) - Date.UTC(year, 0, 1)) / 86400000) + 1;
	}

	function aggregate(
		rows: DailyRow[],
		key: string,
		field: string,
		mode: 'full' | 'ytd',
		cutoff: string,
		lastYear: number
	): YearRow[] {
		const byYear = new Map<number, { count: number; valid: number }>();
		for (const d of rows) {
			const date = String(d.date);
			if (mode === 'ytd' && date.slice(5, 10) > cutoff) continue;
			const year = Number(date.slice(0, 4));
			let entry = byYear.get(year);
			if (!entry) {
				entry = { count: 0, valid: 0 };
				byYear.set(year, entry);
			}
			if (d[field] == null) continue;
			entry.valid++;
			if (isDay(key, d)) entry.count++;
		}
		if (!byYear.size) return [];

		const result: YearRow[] = [];
		for (let year = Math.min(...byYear.keys()); year <= lastYear; year++) {
			const entry = byYear.get(year) ?? { count: 0, valid: 0 };
			const current = year === lastYear;
			const expected =
				current || mode === 'ytd' ? dayOfYear(year, cutoff) : isLeap(year) ? 366 : 365;
			const missing = Math.max(0, expected - entry.valid);
			result.push({
				year,
				value: entry.valid ? entry.count : null,
				missing,
				incomplete: missing > MAX_MISSING_DAYS,
				current
			});
		}
		return result;
	}

	function computeReference(rows: YearRow[], firstDate: string) {
		for (const [start, end] of REFERENCE_PERIODS) {
			if (firstDate > `${start}-01-01`) continue;
			const complete = rows.filter(
				(r) => r.year >= start && r.year <= end && !r.incomplete && r.value != null
			);
			if (complete.length < MIN_REFERENCE_YEARS) continue;
			const value = complete.reduce((sum, r) => sum + (r.value ?? 0), 0) / complete.length;
			return { start, end, value };
		}
		return null;
	}

	$: firstDate = data.length ? String(data[0].date).slice(0, 10) : '';
	$: lastDate = data.length ? String(data[data.length - 1].date).slice(0, 10) : '';
	$: lastYear = Number(lastDate.slice(0, 4));
	$: cutoff = lastDate.slice(5, 10);
	$: cutoffLabel = lastDate ? `${Number(lastDate.slice(8, 10))}.${Number(lastDate.slice(5, 7))}.` : '';

	$: field = FIELD_BY_TYPE[type.key] ?? 'tlmax';
	$: years = aggregate(data, type.key, field, mode, cutoff, lastYear);
	$: reference = computeReference(years, firstDate);

	$: bars = years.filter((r) => r.value != null);
	$: completeBars = bars.filter((r) => !r.current && !r.incomplete);
	$: incompleteBars = bars.filter((r) => !r.current && r.incomplete);
	$: currentBar = bars.find((r) => r.current);
	$: hasAnyDay = bars.some((r) => (r.value ?? 0) > 0);
	$: yMax = Math.max(5, reference?.value ?? 0, ...bars.map((r) => r.value ?? 0));

	$: narrow = width < 500;
	// Extra top margin: the current-year label sits above the plot area, never on top of bars
	$: margin = { top: 34, right: narrow ? 8 : 20, bottom: 30, left: narrow ? 32 : 45 };
	$: decadeStep = narrow ? 20 : 10;
	// Skip a decade tick that would overlap the label of the current year
	$: minTickGap = Math.max(5, Math.ceil(years.length / (narrow ? 8 : 15)));
	$: yearTicks = [
		...years.map((r) => r.year).filter((y) => y % decadeStep === 0 && lastYear - y >= minTickGap),
		lastYear
	];

	$: modeOptions = [
		{ value: 'full', label: 'Ganzes Jahr' },
		{ value: 'ytd', label: `Jeweils bis ${cutoffLabel}` }
	];

	// Slot scales are typed as a union (linear | band); here x is always a band scale
	const barRight = (xScale: any, year: number): number =>
		(xScale(year) ?? 0) + xScale.bandwidth();
	const yPos = (yScale: any, value: number): number => yScale(value);

	function periodLabel(row: YearRow): string {
		if (row.current) return `bis ${cutoffLabel}${row.year}`;
		return mode === 'ytd' ? `bis ${cutoffLabel}` : 'im ganzen Jahr';
	}

	function tooltipItems(row: YearRow) {
		const items: Array<{ label: string; value: string; color?: string }> = [
			{
				label: `${type.label} ${periodLabel(row)}`,
				value: row.value == null ? 'keine Daten' : formatNumber(row.value),
				color: type.color
			}
		];
		if (row.missing > 0) {
			items.push({ label: 'Fehlende Messtage', value: formatNumber(row.missing) });
		}
		if (reference) {
			items.push({
				label: `Ø ${reference.start}–${reference.end}`,
				value: formatNumber(reference.value, 1),
				color: REFERENCE_COLOR
			});
		}
		return items;
	}
</script>

<div class="mt-6" bind:clientWidth={width}>
	<div class="flex flex-wrap items-end justify-between gap-2 mb-2">
		<h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
			{type.label} pro Jahr{stationName ? ` für ${stationName}` : ''}
		</h4>
		<RadioGroup label="Zählweise" bind:value={mode} options={modeOptions} hideLabel />
	</div>

	{#if !bars.length}
		<div class="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
			Keine Daten verfügbar
		</div>
	{:else if !hasAnyDay}
		<div class="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
			An dieser Station wurden bisher keine {type.label} gemessen.
		</div>
	{:else}
		<Chart data={bars} x="year" y="value" xType="band" padding={0.15} height={300} yMin={0} {yMax} {margin}>
			<svelte:fragment let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<defs>
					<pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
						<line x1="0" y1="0" x2="0" y2="5" stroke={type.color} stroke-width="3" />
					</pattern>
				</defs>

				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />

				<BarY data={completeBars} x="year" y="value" {xScale} {yScale} {hover} color={type.color} />
				<g class="text-gray-300 dark:text-gray-600">
					<BarY data={incompleteBars} x="year" y="value" {xScale} {yScale} {hover} color="currentColor" />
				</g>
				{#if currentBar}
					<BarY
						data={[currentBar]}
						x="year"
						y="value"
						{xScale}
						{yScale}
						{hover}
						color={mode === 'full' ? `url(#${hatchId})` : type.color}
					/>
					<text
						x={barRight(xScale, currentBar.year)}
						y="-12"
						text-anchor="end"
						paint-order="stroke"
						stroke-width="4"
						stroke-linejoin="round"
						class="text-xs font-semibold fill-gray-900 stroke-white dark:fill-white dark:stroke-gray-900"
					>
						{currentBar.year}: {formatNumber(currentBar.value ?? 0)}{mode === 'full' ? ' (bisher)' : ''}
					</text>
				{/if}

				{#if reference}
					<line
						x1="0"
						x2={innerWidth}
						y1={yPos(yScale, reference.value)}
						y2={yPos(yScale, reference.value)}
						stroke={REFERENCE_COLOR}
						stroke-width="2"
						stroke-dasharray="6 4"
					/>
					<text
						x="4"
						y={yPos(yScale, reference.value) - 6}
						paint-order="stroke"
						stroke-width="3"
						class="text-xs font-semibold fill-gray-700 stroke-white dark:fill-gray-200 dark:stroke-gray-900"
					>
						Ø {reference.start}–{reference.end}: {formatNumber(reference.value, 1)}
					</text>
				{/if}

				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} tickCount={1} forceTicks={yearTicks} />
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={(v) => formatNumber(v)} unit="Tage" />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const row = years.find((r) => r.year === hover.x)}
					{#if row}
						<Tooltip visible x={hover.clientX} y={hover.clientY} title={String(row.year)} items={tooltipItems(row)} />
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>

		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
			<div class="text-gray-300 dark:text-gray-600">
				<Legend
					items={[
						{ key: 'complete', label: 'Vollständige Jahre', color: type.color },
						{ key: 'incomplete', label: 'Jahr mit Datenlücke', color: 'currentColor' },
						...(reference
							? [{ key: 'reference', label: `Ø ${reference.start}–${reference.end}`, color: REFERENCE_COLOR, dashed: true }]
							: [])
					]}
				/>
			</div>
			{#if currentBar && mode === 'full'}
				<div class="inline-flex items-center gap-1.5 text-sm">
					<svg width="12" height="12" aria-hidden="true">
						<rect width="12" height="12" fill={`url(#${hatchId})`} />
					</svg>
					<span class="text-gray-700 dark:text-gray-300">{currentBar.year} (läuft noch)</span>
				</div>
			{/if}
		</div>
		{#if !reference}
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
				Für diese Station gibt es keinen vollständigen Referenzzeitraum (1961–1990 oder 1991–2020).
			</p>
		{/if}
	{/if}
</div>
