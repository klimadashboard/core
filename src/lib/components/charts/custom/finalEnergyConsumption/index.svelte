<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		Chart,
		AxisX,
		AxisY,
		BarStack,
		Line,
		Tooltip,
		Legend
	} from '$lib/components/charts/primitives';
	import { RadioGroup, Toggle, Checkbox } from '$lib/components/ui';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';
	import { theme } from '$lib/stores/theme';
	import {
		IconBolt,
		IconFlame,
		IconBuildingFactory,
		IconBarrel,
		IconPick,
		IconTemperatureSun,
		IconLeaf,
		IconGasStation,
		IconPlant,
		IconTrendingUp,
		IconTrendingDown,
		IconArrowRight
	} from '@tabler/icons-svelte-runes';
	import {
		fetchData,
		fetchMatrix,
		buildChartData,
		valueOf,
		type FinalEnergyData,
		type FinalEnergyMatrix
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let data: FinalEnergyData | null = null;
	let matrix: FinalEnergyMatrix | null = null;
	let loading = true;
	let error: string | null = null;
	let hidden = new Set<string>();
	let containerWidth = 0;
	let view: 'stacked' | 'multiples' | 'matrix' = 'matrix';
	/** Small multiples: each panel scales to its own carrier instead of the shared maximum */
	let freeScale = false;
	/** Matrix shows each carrier's share of its sector; the checkbox switches to absolute TWh */
	let showTWh = false;
	$: matrixUnit = (showTWh ? 'twh' : 'sector') as 'twh' | 'sector';

	/** Icon per carrier code (energy_final_consumption_category.code); unknown codes show no icon */
	const carrierIcons: Record<string, any> = {
		strom: IconBolt,
		erdgas: IconFlame,
		fernwaerme: IconBuildingFactory,
		heizoel: IconBarrel,
		kohle: IconPick,
		umweltwaerme: IconTemperatureSun,
		ee_waerme: IconLeaf,
		treibstoff_fossil: IconGasStation,
		treibstoff_biogen: IconPlant
	};

	// Matrix view only where the region has a carrier × sector split
	$: viewOptions = [
		...(matrix ? [{ value: 'matrix', label: 'Sektoren' }] : []),
		{ value: 'multiples', label: 'Energieträger' },
		{ value: 'stacked', label: 'Gestapelt' }
	];

	$: isMobile = containerWidth < 500;
	/** Directus colors too dark to read on the dark background */
	const darkModeColors: Record<string, string> = {
		heizoel: '#9A9DB8',
		kohle: '#C8C8C8'
	};
	$: isDark = $theme === 'dark';
	$: categories = (data?.categories ?? []).map((c) =>
		isDark && darkModeColors[c.key] ? { ...c, color: darkModeColors[c.key] } : c
	);
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

	// Small multiples: one row per year with every carrier in TWh, shared y scale across panels
	$: lineData = (data?.years ?? []).map((year) => ({
		year,
		...Object.fromEntries(categories.map((c) => [c.key, valueOf(data!, year, c.key) / 1e6]))
	}));
	$: categoryKeys = categories.map((c) => c.key);
	$: multiplesYMax = Math.max(
		1,
		...lineData.flatMap((d) => categoryKeys.map((k) => (d as any)[k]))
	);
	/** Calls a Chart slot scale (typed as linear | band | null) for a plain number */
	const scaled = (scale: any, v: number): number => scale?.(v) ?? 0;
	/** Axis labels keep the decimals small per-panel scales need (e.g. 0,2 TWh) */
	const formatTick = (v: number) =>
		formatNumber(v, Number.isInteger(v) ? 0 : Number.isInteger(Math.round(v * 1e6) / 1e5) ? 1 : 2);
	$: panelYMax = (key: string) => Math.max(0.1, ...lineData.map((d) => (d as any)[key])) * 1.1;
	$: columns = containerWidth < 420 ? 2 : containerWidth < 720 ? 3 : 4;
	$: firstYear = data?.years[0] ?? 0;
	$: lastYear = data?.years.at(-1) ?? 0;
	/** % change first → last year; null when the first year is zero */
	$: changeOf = (key: string) => {
		if (!data) return null;
		const first = valueOf(data, firstYear, key);
		return first ? (valueOf(data, lastYear, key) / first - 1) * 100 : null;
	};
	// Panels ordered by the latest year's value, largest first
	$: sortedCategories = data
		? [...categories].sort(
				(a, b) => valueOf(data!, lastYear, b.key) - valueOf(data!, lastYear, a.key)
			)
		: [];

	// Matrix: rows = carriers by total of the matrix year, bubble area ∝ displayed value (% or MWh)
	/** Shorter column heads where the Directus label is too long for a narrow column */
	const sectorShortLabels: Record<string, string> = { ghdi: 'Gewerbe & Industrie' };
	$: matrixValue = (sector: string, carrier: string) => matrix?.values.get(`${sector}|${carrier}`);
	/** Fixed editorial row order: electricity first, coal and both fuels last; unlisted codes follow by size */
	const matrixRowOrder = [
		'strom',
		'erdgas',
		'heizoel',
		'ee_waerme',
		'fernwaerme',
		'umweltwaerme',
		'kohle',
		'treibstoff_fossil',
		'treibstoff_biogen'
	];
	const rowRank = (key: string) => {
		const i = matrixRowOrder.indexOf(key);
		return i === -1 ? matrixRowOrder.length : i;
	};
	$: matrixRows = matrix
		? categories
				.map((c) => ({
					...c,
					total: matrix!.sectors.reduce((sum, s) => sum + (matrixValue(s.key, c.key) ?? 0), 0)
				}))
				.filter((c) => c.total > 0)
				.sort((a, b) => rowRank(a.key) - rowRank(b.key) || b.total - a.total)
		: [];
	$: sectorTotal = (sector: string) =>
		matrix
			? [...matrix.values].reduce((sum, [k, v]) => (k.startsWith(`${sector}|`) ? sum + v : sum), 0)
			: 0;
	/** What a cell shows and sizes by: MWh, or % of its sector */
	$: cellMeasure = (v: number, sector: string) =>
		matrixUnit === 'sector' ? (v / (sectorTotal(sector) || 1)) * 100 : v;
	$: matrixMax = matrix
		? Math.max(1e-9, ...[...matrix.values].map(([k, v]) => cellMeasure(v, k.split('|')[0])))
		: 1;
	/** Wide enough for „Wärmepumpen“ on one line (icon + text-sm) */
	$: matrixLabelWidth = isMobile ? 124 : 150;
	$: matrixColWidth = matrix
		? (containerWidth - matrixLabelWidth) / Math.max(1, matrix.sectors.length)
		: 0;
	$: bubbleMaxR = Math.max(10, Math.min(matrixColWidth / 2 - 6, 28));
	$: bubbleR = (v: number) => (v > 0 ? Math.max(2.5, Math.sqrt(v / matrixMax) * bubbleMaxR) : 0);
	/** Value inside the bubble only when it fits */
	const minLabelR = 13;
	/** Soft hyphens (U+00AD) at the compound joints of labels too long for the narrow label column */
	const softHyphenate = (label: string) =>
		label
			.replace('Erneuerbare', 'Erneuer­bare')
			.replace('Kraftstoffe', 'Kraft­stoffe')
			.replace('Fernwärme', 'Fern­wärme');
	const formatTWh = (mwh: number) =>
		mwh > 0 && mwh < 50_000 ? '<0,1' : formatNumber(mwh / 1e6, 1);
	const formatShare = (pct: number) => (pct > 0 && pct < 0.5 ? '<1\u202F%' : formatPercent(pct, 0));
	$: formatCell = (v: number, sector: string) =>
		matrixUnit === 'twh' ? formatTWh(v) : formatShare(cellMeasure(v, sector));
	/** Dark text on light fills (yellow, rose, light gray), white otherwise */
	function textOn(hex: string) {
		const n = parseInt(hex.replace('#', ''), 16);
		const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
			const c = v / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#111827' : '#ffffff';
	}

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

	function panelTooltipItems(year: number | null, key: string, label: string, color: string) {
		const row = lineData.find((d) => d.year === year) as any;
		return row ? [{ label, value: `${formatNumber(row[key], 1)} TWh`, color }] : [];
	}

	async function loadData(r: Region | null) {
		loading = true;
		error = null;
		hidden = new Set();
		try {
			[data, matrix] = await Promise.all([
				fetchData(r?.id ?? null, fetch),
				fetchMatrix(r?.id ?? null, fetch)
			]);
			// Default: Sektoren where the region has the split, else Energieträger
			view = matrix ? 'matrix' : 'multiples';
			onChartData?.(data ? buildChartData(data, r) : null);
		} catch (e) {
			console.error('[FinalEnergyConsumption] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			matrix = null;
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
		<div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
			<RadioGroup label="Ansicht" hideLabel bind:value={view} options={viewOptions} />
			{#if view === 'multiples'}
				<Toggle label="Eigene Skala je Feld" bind:checked={freeScale} />
			{:else if view === 'matrix'}
				<Checkbox label="Werte in TWh" bind:checked={showTWh} />
			{/if}
		</div>

		{#if view === 'stacked'}
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
				<svelte:fragment
					slot="default"
					let:xScale
					let:yScale
					let:xDomain
					let:innerWidth
					let:innerHeight
					let:hover
				>
					<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
					<BarStack data={stackedData} x="year" {xScale} {yScale} {hover} radius={2} />
					<AxisY
						mode="labels"
						{yScale}
						{innerWidth}
						{innerHeight}
						format={(v) => formatNumber(v)}
						unit="TWh"
					/>
					<AxisX
						{xScale}
						{xDomain}
						{innerWidth}
						{innerHeight}
						format={String}
						tickCount={isMobile ? 6 : 12}
					/>
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
		{:else if view === 'matrix' && matrix}
			<div
				role="table"
				aria-label="Endenergieverbrauch {matrix.year} nach Energieträger und Sektor, {matrixUnit ===
				'sector'
					? 'Anteil am Sektor in Prozent'
					: 'in TWh'}"
			>
				<div
					role="row"
					class="grid border-b border-gray-200 dark:border-gray-700"
					style="grid-template-columns: {matrixLabelWidth}px repeat({matrix.sectors
						.length}, minmax(0, 1fr));"
				>
					<!-- Keeps the label column in the grid; the text is for screen readers only -->
					<span role="columnheader"><span class="sr-only">Energieträger</span></span>
					{#each matrix.sectors as sector (sector.key)}
						<span
							role="columnheader"
							class="px-1 pb-2 text-center text-xs sm:text-sm font-bold leading-tight text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700"
							title={sector.label}
						>
							{sectorShortLabels[sector.key] ?? sector.label}
						</span>
					{/each}
				</div>
				{#each matrixRows as row (row.key)}
					<div
						role="row"
						class="grid border-b border-gray-100 dark:border-gray-800 last:border-b-0"
						style="grid-template-columns: {matrixLabelWidth}px repeat({matrix.sectors
							.length}, minmax(0, 1fr)); min-height: 36px;"
					>
						<span
							role="rowheader"
							class="flex min-w-0 items-center gap-1.5 pr-2 text-xs sm:text-sm font-medium leading-tight text-gray-800 dark:text-gray-200"
						>
							{#if carrierIcons[row.key]}
								<svelte:component
									this={carrierIcons[row.key]}
									size={16}
									stroke={2}
									color={row.color}
									aria-hidden="true"
									class="shrink-0"
								/>
							{/if}
							<!-- Long compounds break at a soft hyphen instead of running into the first data column -->
							<span lang="de" class="min-w-0 hyphens-manual">{softHyphenate(row.label)}</span>
						</span>
						{#each matrix.sectors as sector (sector.key)}
							{@const v = matrixValue(sector.key, row.key)}
							{@const r = bubbleR(v === undefined ? 0 : cellMeasure(v, sector.key))}
							<span
								role="cell"
								class="flex flex-col items-center justify-center gap-0.5 py-1 border-l border-gray-200 dark:border-gray-700"
							>
								{#if v === undefined}
									<span class="text-xs text-gray-400 dark:text-gray-500" aria-hidden="true">–</span>
									<span class="sr-only">kein Verbrauch</span>
								{:else if r >= minLabelR}
									<span
										class="flex items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
										style="width: {r * 2}px; height: {r *
											2}px; background: {row.color}; color: {textOn(row.color)};"
									>
										{formatCell(v, sector.key)}
									</span>
								{:else}
									<span class="text-[11px] font-bold tabular-nums text-gray-700 dark:text-gray-300"
										>{formatCell(v, sector.key)}</span
									>
									{#if r > 0}
										<span
											class="rounded-full"
											style="width: {r * 2}px; height: {r * 2}px; background: {row.color};"
											aria-hidden="true"
										></span>
									{/if}
								{/if}
							</span>
						{/each}
					</div>
				{/each}
			</div>
			<p class="mt-3 text-xs text-gray-600 dark:text-gray-400">
				Endenergieverbrauch {matrix.year} nach Energieträger und Sektor,
				{#if matrixUnit === 'sector'}
					als Anteil am Verbrauch des jeweiligen Sektors (jede Spalte ergibt 100&nbsp;%).
				{:else}
					in TWh.
				{/if}
				Die Kreisfläche entspricht dem angezeigten Wert; „–“: kein Verbrauch in diesem Sektor.
			</p>
		{:else}
			<div
				class="grid gap-x-4 gap-y-5"
				style="grid-template-columns: repeat({columns}, minmax(0, 1fr));"
			>
				{#each sortedCategories as cat (cat.key)}
					{@const change = changeOf(cat.key)}
					<figure>
						<figcaption class="mb-2">
							<span
								class="flex items-center gap-1.5 text-sm font-medium leading-tight text-gray-700 dark:text-gray-300"
							>
								{#if carrierIcons[cat.key]}
									<svelte:component
										this={carrierIcons[cat.key]}
										size={16}
										stroke={2}
										color={cat.color}
										aria-hidden="true"
										class="shrink-0"
									/>
								{/if}
								{cat.label}
							</span>
							<!-- Value and change on one line; years are named in the note below the grid -->
							<span
								class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-900 dark:text-white"
							>
								<span class="flex items-baseline gap-1">
									<span class="text-2xl font-condensed leading-none"
										>{formatNumber(valueOf(data, lastYear, cat.key) / 1e6, 1)}</span
									>
									<span class="text-sm font-medium">TWh</span>
									<span class="sr-only">im Jahr {lastYear}</span>
								</span>
								{#if change !== null}
									<span
										class="flex items-center gap-1 text-xs font-medium tabular-nums px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-500/40 text-gray-800 dark:text-gray-100"
										title="Veränderung {firstYear}–{lastYear}"
									>
										{#if change > 0.5}
											<IconTrendingUp size={13} stroke={2} aria-hidden="true" />
										{:else if change < -0.5}
											<IconTrendingDown size={13} stroke={2} aria-hidden="true" />
										{:else}
											<IconArrowRight size={13} stroke={2} aria-hidden="true" />
										{/if}
										{change > 0 ? '+' : ''}{formatPercent(change, 0)}
										<span class="sr-only">seit {firstYear}</span>
									</span>
								{/if}
							</span>
						</figcaption>
						<Chart
							data={lineData}
							x="year"
							y={freeScale ? cat.key : categoryKeys}
							height={140}
							yMin={0}
							yMax={freeScale ? panelYMax(cat.key) : multiplesYMax}
							margin={{ top: 8, right: 8, bottom: 24, left: 30 }}
						>
							<svelte:fragment
								slot="default"
								let:xScale
								let:yScale
								let:xDomain
								let:innerWidth
								let:innerHeight
								let:hover
							>
								<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} tickCount={3} />
								<!-- Comparison lines only on the shared scale; on a per-panel scale they would overflow and mislead -->
								{#if !freeScale}
									<g class="opacity-40 dark:opacity-30">
										{#each categories.filter((c) => c.key !== cat.key) as other (other.key)}
											<Line
												data={lineData}
												x="year"
												y={other.key}
												{xScale}
												{yScale}
												stroke="#9ca3af"
												strokeWidth={1}
											/>
										{/each}
									</g>
								{/if}
								<Line
									data={lineData}
									x="year"
									y={cat.key}
									{xScale}
									{yScale}
									{hover}
									stroke={cat.color}
									strokeWidth={2.5}
									dotRadius={2}
								/>
								<!-- Endpoints of the highlighted change -->
								{#each [firstYear, lastYear] as yr}
									<circle
										cx={scaled(xScale, yr)}
										cy={scaled(yScale, valueOf(data, yr, cat.key) / 1e6)}
										r={3.5}
										fill={cat.color}
									/>
								{/each}
								<AxisY
									mode="labels"
									{yScale}
									{innerWidth}
									{innerHeight}
									tickCount={3}
									format={formatTick}
								/>
								<AxisX
									{xScale}
									{xDomain}
									{innerWidth}
									{innerHeight}
									format={String}
									tickCount={2}
									forceTicks={[firstYear, lastYear]}
								/>
							</svelte:fragment>

							<svelte:fragment slot="tooltip" let:hover>
								<Tooltip
									visible={hover.x !== null}
									x={hover.clientX}
									y={hover.clientY}
									title={String(hover.x ?? '')}
									items={panelTooltipItems(hover.x, cat.key, cat.label, cat.color)}
								/>
							</svelte:fragment>
						</Chart>
					</figure>
				{/each}
			</div>
			<p class="mt-3 text-xs text-gray-600 dark:text-gray-400">
				Werte {lastYear}, Veränderung seit {firstYear}.
				{#if freeScale}
					Endenergieverbrauch in TWh. Jedes Feld hat eine eigene Skala – Höhen sind nicht zwischen
					Feldern vergleichbar.
				{:else}
					Endenergieverbrauch in TWh, gleiche Skala in allen Feldern. Graue Linien: übrige
					Energieträger zum Vergleich.
				{/if}
			</p>
		{/if}
	{/if}
</div>
