<!-- $lib/components/charts/custom/heatwavesKysely/index.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	// the station map (StationPicker) does not load the MapLibre styles itself
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import StationPicker from '$lib/components/charts/custom/stationPicker/index.svelte';
	import { Toggle, RadioGroup, Select } from '$lib/components/ui';
	import Loader from '$lib/components/Loader.svelte';
	import YearView from './YearView.svelte';
	import { formatDate, formatNumber } from '$lib/utils/formatters';
	import {
		fetchHeatwaveData,
		fetchRecentHeatwaveStations,
		buildChartData,
		SOURCE,
		DEFINITION_URL,
		HEAT_DEATHS_URL,
		isPlaceholderUrl,
		type HeatwaveResult,
		type RecentHeatwaveStations
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// region is not used: the chart works per weather station (StationPicker)
	$: void region;

	let selectedStation: any = null;
	let result: HeatwaveResult | null = null;
	let loading = false;
	let error: string | null = null;
	let colorByTemp = false;

	// ---------- station filter: current heatwaves ----------
	let stationFilter: 'all' | 'yesterday' | 'week' = 'all';
	let recent: RecentHeatwaveStations | null = null;
	let recentLoading = false;
	let recentError: string | null = null;

	$: if (stationFilter !== 'all' && !recent && !recentLoading && !recentError) loadRecent();

	async function loadRecent() {
		recentLoading = true;
		try {
			recent = await fetchRecentHeatwaveStations();
		} catch (e) {
			console.error('[heatwavesKysely] recent heatwaves', e);
			recentError = 'Aktuelle Hitzewellen konnten nicht geladen werden.';
		} finally {
			recentLoading = false;
		}
	}

	$: allowedStationIds =
		stationFilter === 'all' || !recent
			? null
			: stationFilter === 'yesterday'
				? recent.yesterday
				: recent.lastWeek;

	const count = (s: Set<string> | undefined) => (s ? ` (${s.size})` : '');
	$: filterOptions = [
		{ value: 'all', label: 'Alle Stationen' },
		{ value: 'yesterday', label: `Hitzewelle gestern${count(recent?.yesterday)}` },
		{ value: 'week', label: `Hitzewelle letzte 7 Tage${count(recent?.lastWeek)}` }
	];

	// ---------- data ----------
	let requestId = 0;
	$: if (selectedStation?.id) loadData(selectedStation.id);

	async function loadData(stationId: string) {
		const id = ++requestId;
		loading = true;
		error = null;
		try {
			const r = await fetchHeatwaveData(stationId);
			if (id !== requestId) return;
			result = r;
			onChartData?.(r ? buildChartData(r) : null);
		} catch (e) {
			if (id !== requestId) return;
			console.error('[heatwavesKysely]', e);
			result = null;
			error = 'Die Temperaturdaten konnten nicht geladen werden.';
			onChartData?.(null);
		} finally {
			if (id === requestId) loading = false;
		}
	}

	$: years = result?.years ?? [];
	$: hasWaves = years.some((y) => y.waves.length > 0);

	// ---------- selected year (detail view) ----------
	let selectedYear: string = '';
	// default: the latest year; also when the station changes and the year does not exist there
	$: if (years.length && !years.some((y) => String(y.year) === selectedYear)) {
		selectedYear = String(years[years.length - 1].year);
	}
	$: selectedYearNum = Number(selectedYear);
	$: yearOptions = [...years].reverse().map((y) => ({
		value: String(y.year),
		label: y.waves.length ? `${y.year} · ${y.kyselyDays} Kysely-Tage` : `${y.year}`
	}));
	const selectYear = (yr: number) => (selectedYear = String(yr));

	// ---------- colors ----------
	const SINGLE_COLOR = '#D7301F';
	const T_MIN = 30;
	const T_MAX = 45;
	// sequential red, light → dark (ColorBrewer Reds); the lightest stop is still clearly
	// visible on white, because most heatwave days are between 30 and 34 °C
	const STOPS = ['#FC9272', '#FB6A4A', '#EF3B2C', '#CB181D', '#A50F15', '#67000D'];
	const tempColor = scaleLinear<string>()
		.domain(STOPS.map((_, i) => T_MIN + (i * (T_MAX - T_MIN)) / (STOPS.length - 1)))
		.range(STOPS)
		.clamp(true);
	const gradientCss = `linear-gradient(to right, ${STOPS.join(', ')})`;
	const legendTicks = [30, 35, 40, 45];

	// ---------- stripes: Kysely days per year ----------
	// Fixed classes with an open top class, so the scale does not depend on the
	// current record and future years with many more days still fit.
	const DAY_BINS = [
		{ min: 0, max: 0, label: '0', color: null },
		{ min: 1, max: 9, label: '1–9', color: '#FEE0D2' },
		{ min: 10, max: 19, label: '10–19', color: '#FCBBA1' },
		{ min: 20, max: 29, label: '20–29', color: '#FC9272' },
		{ min: 30, max: 44, label: '30–44', color: '#FB6A4A' },
		{ min: 45, max: 59, label: '45–59', color: '#EF3B2C' },
		{ min: 60, max: 79, label: '60–79', color: '#CB181D' },
		{ min: 80, max: Infinity, label: '≥ 80', color: '#67000D' }
	];
	const binOf = (n: number) => DAY_BINS.find((b) => n >= b.min && n <= b.max) ?? DAY_BINS[0];
	const STRIPES_HEIGHT = 56;

	// the last year is still running if the data does not reach 31 December
	$: runningYear =
		result?.lastDate && lastYearValue && result.lastDate < `${lastYearValue}-12-31`
			? lastYearValue
			: null;
	$: stripeWidth = years.length ? innerWidth / years.length : 0;
	$: stripeLabelStep = years.length > 100 && width < 800 ? 20 : 10;

	let hoverStripe: number | null = null;
	function onStripeMove(e: MouseEvent) {
		const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
		const i = Math.floor((e.clientX - rect.left - margin.left) / stripeWidth);
		hoverStripe = i >= 0 && i < years.length ? i : null;
		clientX = e.clientX;
		clientY = e.clientY;
	}

	$: stripeTooltip = (() => {
		if (hoverStripe === null) return null;
		const y = years[hoverStripe];
		const running = y.year === runningYear;
		return {
			title: running ? `${y.year} (bisher)` : String(y.year),
			items: [
				{
					label: 'Kysely-Tage',
					value: String(y.kyselyDays),
					color: binOf(y.kyselyDays).color ?? undefined
				},
				{ label: 'Hitzewellen', value: String(y.waves.length) },
				...(y.waves.length
					? [{ label: 'Längste', value: `${Math.max(...y.waves.map((w) => w.length))} Tage` }]
					: []),
				...(running
					? [{ label: 'Hinweis', value: `Daten bis ${formatDate(result?.lastDate ?? '')}` }]
					: [])
			]
		};
	})();

	// ---------- layout ----------
	const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
	const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]; // non-leap year

	let containerEl: HTMLElement;
	let width = 0;
	let ro: ResizeObserver | null = null;
	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const e of entries) if (e.contentRect.width > 0) width = e.contentRect.width;
		});
		return () => ro?.disconnect();
	});
	// the container only exists once a station is selected
	$: if (containerEl && ro) {
		ro.observe(containerEl);
		width = containerEl.clientWidth;
	}

	$: margin = { top: 22, right: 4, bottom: 4, left: width < 500 ? 34 : 42 };
	$: innerWidth = Math.max(0, width - margin.left - margin.right);
	$: rowHeight = years.length > 100 ? 4 : years.length > 70 ? 5 : 6;
	$: innerHeight = years.length * rowHeight;
	$: height = margin.top + innerHeight + margin.bottom;
	$: xFrac = (doy: number, n: number) => (doy / n) * innerWidth;
	$: showMonth = (i: number) => width >= 500 || i % 2 === 0;
	$: lastYearValue = years.at(-1)?.year;
	$: yearLabel = (y: number) => y % 10 === 0 || y === lastYearValue;

	// ---------- hover ----------
	let hover: { yearIdx: number; doy: number } | null = null;
	let clientX = 0;
	let clientY = 0;

	function onMove(e: MouseEvent) {
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const x = e.clientX - rect.left - margin.left;
		const y = e.clientY - rect.top - margin.top;
		const yearIdx = Math.floor(y / rowHeight);
		if (x < 0 || x > innerWidth || yearIdx < 0 || yearIdx >= years.length) {
			hover = null;
			return;
		}
		const n = years[yearIdx].daysInYear;
		hover = { yearIdx, doy: Math.min(n - 1, Math.floor((x / innerWidth) * n)) };
		clientX = e.clientX;
		clientY = e.clientY;
	}

	const dateOf = (year: number, doy: number) =>
		new Date(Date.UTC(year, 0, 1 + doy)).toISOString().slice(0, 10);

	$: tooltip = (() => {
		if (!hover) return null;
		const y = years[hover.yearIdx];
		const t = y.tmax[hover.doy];
		const w = y.waveIndex[hover.doy] >= 0 ? y.waves[y.waveIndex[hover.doy]] : null;
		const items: { label: string; value: string; color?: string }[] = [
			{ label: 'Tmax', value: t === null ? 'keine Daten' : `${formatNumber(t, 1)} °C` }
		];
		if (w) {
			items.push({
				label: 'Hitzewelle',
				value: `${formatDate(w.start)} – ${formatDate(w.end)}`,
				color: colorByTemp && t !== null ? tempColor(t) : SINGLE_COLOR
			});
			items.push({ label: 'Dauer', value: `${w.length} Tage` });
			items.push({ label: 'Höchstwert', value: `${formatNumber(w.maxTmax, 1)} °C` });
		} else {
			items.push({ label: 'Hitzewelle', value: 'nein' });
		}
		items.push({ label: `Kysely-Tage ${y.year}`, value: String(y.kyselyDays) });
		return { title: formatDate(dateOf(y.year, hover.doy), 'long'), items };
	})();
</script>

<div class="text-gray-900 dark:text-gray-100">
	<div class="mb-3">
		<RadioGroup label="Wetterstationen anzeigen" bind:value={stationFilter} options={filterOptions} inline />
		{#if stationFilter !== 'all'}
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
				{#if recentLoading}
					<span class="inline-flex items-center gap-2" role="status" aria-live="polite">
						<span class="inline-block w-2.5 h-2.5 rounded-full bg-green-400 animate-ping"></span>
						Suche Stationen mit aktueller Hitzewelle …
					</span>
				{:else if recentError}
					<span class="text-red-600 dark:text-red-400">{recentError}</span>
				{:else if allowedStationIds && allowedStationIds.size === 0}
					{stationFilter === 'yesterday'
						? 'Gestern gab es an keiner Station eine Hitzewelle.'
						: 'In den letzten 7 Tagen gab es an keiner Station eine Hitzewelle.'}
					{#if recent?.lastDate}Datenstand: {formatDate(recent.lastDate)}.{/if}
				{:else if allowedStationIds}
					{allowedStationIds.size}
					{allowedStationIds.size === 1 ? 'Station' : 'Stationen'} mit Hitzewelle{#if recent?.lastDate}
						· Datenstand: {formatDate(recent.lastDate)}{/if}
				{/if}
			</p>
		{/if}
	</div>

	<StationPicker bind:selectedStation {allowedStationIds} />

	{#if !selectedStation}
		<p class="max-w-2xl mx-auto mt-4 text-center text-gray-600 dark:text-gray-400">
			Wähle eine Wetterstation auf der Karte oder in der Liste, um zu sehen, wann es dort Hitzewellen
			gab.
		</p>
	{:else}
		<div class="flex flex-wrap items-center justify-between gap-3 mt-4 mb-2">
			<p class="font-semibold">
				{selectedStation.name}{#if selectedStation.height}<span
						class="font-normal text-gray-600 dark:text-gray-400"> ({selectedStation.height} m)</span
					>{/if}
			</p>
			<Toggle label="Nach Temperatur einfärben" bind:checked={colorByTemp} />
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap items-center gap-x-5 gap-y-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
			<span class="flex items-center gap-1.5">
				<span class="w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600"></span>
				keine Hitzewelle
			</span>
			{#if colorByTemp}
				<span class="flex items-center gap-2">
					<span>Hitzewellen-Tag nach Tmax</span>
					<span class="inline-flex flex-col">
						<span class="block w-40 h-3 rounded-sm" style="background: {gradientCss}"></span>
						<span class="flex justify-between w-40 text-xs text-gray-600 dark:text-gray-400">
							{#each legendTicks as tick, i}
								<span>{tick}{i === legendTicks.length - 1 ? ' °C' : ''}</span>
							{/each}
						</span>
					</span>
				</span>
			{:else}
				<span class="flex items-center gap-1.5">
					<span class="w-3 h-3 rounded-sm" style="background: {SINGLE_COLOR}"></span>
					Hitzewelle (Kysely-Tag)
				</span>
			{/if}
		</div>

		<!-- Chart -->
		<div bind:this={containerEl} class="relative w-full select-none">
			{#if loading}
				<div class="h-[400px] flex items-center justify-center" role="status" aria-live="polite">
					<Loader showText={true} />
				</div>
			{:else if error}
				<div class="h-[300px] flex items-center justify-center text-red-600 dark:text-red-400">
					{error}
				</div>
			{:else if !years.length}
				<div class="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
					Keine Daten verfügbar
				</div>
			{:else if width > 0}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<svg
					{width}
					{height}
					role="img"
					aria-label="Hitzewellen nach Kyselý an der Station {selectedStation.name}, eine Zeile pro Jahr von {years[0]
						.year} bis {lastYearValue}, Januar bis Dezember"
					class="block bg-white dark:bg-gray-900 cursor-pointer"
					on:mousemove={onMove}
					on:mouseleave={() => (hover = null)}
					on:click={() => hover && selectYear(years[hover.yearIdx].year)}
				>
					<!-- months -->
					{#each MONTH_START as start, i}
						{@const x = margin.left + xFrac(start, 365)}
						{#if i > 0}
							<line
								x1={x}
								x2={x}
								y1={margin.top - 4}
								y2={margin.top + innerHeight}
								class="stroke-gray-200 dark:stroke-gray-700"
								stroke-width="1"
							/>
						{/if}
						{#if showMonth(i)}
							<text
								x={x + 3}
								y={12}
								class="fill-gray-500 dark:fill-gray-400 text-[11px]">{MONTHS[i]}</text
							>
						{/if}
					{/each}

					<!-- rows -->
					<g transform="translate({margin.left},{margin.top})">
						{#if hover}
							<rect
								x={0}
								y={hover.yearIdx * rowHeight}
								width={innerWidth}
								height={rowHeight}
								class="fill-gray-100 dark:fill-gray-800"
							/>
						{/if}
						{#each years as y, r}
							{@const top = r * rowHeight}
							{#if y.year === selectedYearNum}
								<rect
									x={-0.5}
									y={top - 0.5}
									width={innerWidth + 1}
									height={rowHeight + 1}
									fill="none"
									stroke-width="1"
									class="stroke-gray-900 dark:stroke-gray-100"
								/>
							{/if}
							{#if yearLabel(y.year)}
								<text
									x={-6}
									y={top + rowHeight - 0.5}
									text-anchor="end"
									class="text-[11px] {y.year === lastYearValue
										? 'fill-gray-900 dark:fill-gray-100 font-semibold'
										: 'fill-gray-500 dark:fill-gray-400'}">{y.year}</text
								>
							{/if}
							{#each y.waveIndex as wi, d}
								{#if wi >= 0}
									<rect
										x={xFrac(d, y.daysInYear)}
										y={top + 0.5}
										width={Math.max(innerWidth / y.daysInYear, 1)}
										height={rowHeight - 1}
										fill={colorByTemp && y.tmax[d] !== null ? tempColor(y.tmax[d]) : SINGLE_COLOR}
									/>
								{/if}
							{/each}
						{/each}
					</g>
				</svg>

				{#if tooltip}
					<Tooltip visible={true} x={clientX} y={clientY} title={tooltip.title} items={tooltip.items} />
				{/if}
			{:else}
				<div class="h-[400px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
			{/if}
		</div>

		<!-- Stripes: Kysely days per year -->
		{#if !loading && !error && years.length && width > 0}
			<div class="mt-6">
				<p class="font-semibold mb-1">Kysely-Tage pro Jahr</p>
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs text-gray-700 dark:text-gray-300">
					{#each DAY_BINS as bin}
						<span class="flex items-center gap-1">
							<span
								class="w-3 h-3 rounded-sm {bin.color
									? ''
									: 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'}"
								style={bin.color ? `background: ${bin.color}` : ''}
							></span>
							{bin.label}
						</span>
					{/each}
					<span class="text-gray-600 dark:text-gray-400">Tage</span>
					{#if runningYear}
						<span class="flex items-center gap-1 ml-2">
							<svg width="12" height="12" aria-hidden="true">
								<rect width="12" height="12" class="fill-gray-300 dark:fill-gray-600" />
								<rect width="12" height="12" fill="url(#kysely-running-hatch)" />
							</svg>
							{runningYear} läuft noch – Wert kann steigen
						</span>
					{/if}
				</div>

				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<svg
					{width}
					height={STRIPES_HEIGHT + 20}
					role="img"
					aria-label="Kysely-Tage pro Jahr an der Station {selectedStation.name} als Farbstreifen, {years[0]
						.year} bis {lastYearValue}"
					class="block bg-white dark:bg-gray-900 cursor-pointer"
					on:mousemove={onStripeMove}
					on:mouseleave={() => (hoverStripe = null)}
					on:click={() => hoverStripe !== null && selectYear(years[hoverStripe].year)}
				>
					<defs>
						<pattern
							id="kysely-running-hatch"
							width="4"
							height="4"
							patternUnits="userSpaceOnUse"
							patternTransform="rotate(45)"
						>
							<rect width="2" height="4" fill="white" fill-opacity="0.7" />
						</pattern>
					</defs>
					<g transform="translate({margin.left},0)">
						{#each years as y, i}
							{@const bin = binOf(y.kyselyDays)}
							<rect
								x={i * stripeWidth}
								y={0}
								width={stripeWidth + 0.5}
								height={STRIPES_HEIGHT}
								fill={bin.color ?? undefined}
								class={bin.color ? '' : 'fill-gray-100 dark:fill-gray-800'}
								opacity={hoverStripe !== null && hoverStripe !== i ? 0.55 : 1}
							/>
							{#if y.year === runningYear}
								<rect
									x={i * stripeWidth}
									y={0}
									width={stripeWidth + 0.5}
									height={STRIPES_HEIGHT}
									fill="url(#kysely-running-hatch)"
								/>
							{/if}
							{#if y.year === selectedYearNum}
								<rect
									x={i * stripeWidth - 1}
									y={-0}
									width={stripeWidth + 2}
									height={STRIPES_HEIGHT}
									fill="none"
									stroke-width="1.5"
									class="stroke-gray-900 dark:stroke-gray-100"
								/>
							{/if}
							{#if y.year % stripeLabelStep === 0}
								<text
									x={(i + 0.5) * stripeWidth}
									y={STRIPES_HEIGHT + 14}
									text-anchor="middle"
									class="fill-gray-500 dark:fill-gray-400 text-[11px]">{y.year}</text
								>
							{/if}
						{/each}
					</g>
				</svg>

				{#if stripeTooltip}
					<Tooltip
						visible={true}
						x={clientX}
						y={clientY}
						title={stripeTooltip.title}
						items={stripeTooltip.items}
					/>
				{/if}
			</div>
		{/if}

		<!-- One year in detail -->
		{#if !loading && !error && years.length}
			<div class="mt-8">
				<div class="flex flex-wrap items-end justify-between gap-3 mb-3">
					<p class="font-semibold">Ein Jahr im Detail</p>
					<div class="w-64 max-w-full">
						<Select label="Jahr" bind:value={selectedYear} options={yearOptions} small />
					</div>
				</div>
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
					Tipp: Klicke im Streifen oder in den Farbstreifen auf ein Jahr.
				</p>
				<YearView {years} year={selectedYearNum} lastDate={result?.lastDate ?? null} stops={STOPS} />
			</div>
		{/if}

		{#if !loading && !error && years.length && !hasWaves}
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				An dieser Station gab es im gesamten Messzeitraum keine Hitzewelle nach Kyselý.
			</p>
		{/if}

		<!-- Text follows later -->

		{#if HEAT_DEATHS_URL}
			<p class="mt-6 text-gray-800 dark:text-gray-200">
				Hitzewellen sind gefährlich, vor allem für ältere und vorerkrankte Menschen.
				<a href={HEAT_DEATHS_URL} class="underline underline-offset-2 font-semibold"
					>Wie viele Menschen an Hitze sterben →</a
				>
				{#if isPlaceholderUrl(HEAT_DEATHS_URL)}
					<span
						class="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100"
						>Platzhalter: Link zur Hitzetote-Seite fehlt noch</span
					>
				{/if}
			</p>
		{/if}

		<!-- Source -->
		<div class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-1">
			<p>
				Hitzewelle nach Kyselý: mindestens 3 Tage in Folge mit Tmax ≥ 30 °C; sie dauert, solange
				das Mittel der Tageshöchstwerte über 30 °C bleibt und kein Tag unter 25 °C fällt.
				Definition:
				<a href={DEFINITION_URL} class="underline underline-offset-2" target="_blank" rel="noopener"
					>GeoSphere Austria</a
				>
			</p>
			<p>
				Temperaturdaten:
				<a href={SOURCE.url} class="underline underline-offset-2" target="_blank" rel="noopener"
					>{SOURCE.name}</a
				>{#if result?.lastDate}{' · '}Datenstand: {formatDate(result.lastDate)}{/if}{#if result?.firstDate}{' · '}Messreihe ab {formatDate(result.firstDate)}{/if}
			</p>
		</div>
	{/if}
</div>
