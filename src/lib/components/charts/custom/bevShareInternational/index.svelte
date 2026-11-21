<!--
	"Aber China:" – battery-electric share of new passenger cars, Austria compared with other countries.
	Countries can be picked from all countries in Robbie Andrew's carsales data (search dropdown, max. 6);
	Norway, Denmark and China are preselected, Austria is always shown.
	Top: BEV share per month (or 12-month average) as lines.
	Bottom: small multiples with the full mix (BEV / plug-in hybrid / fossil), grouped into
	"Wende geschafft" (latest share ≥ 75 %) and "Auf dem Weg".
	Data is loaded live from the carsales CSV (see config.ts).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, AxisX, AxisY, Line, Area, Tooltip } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import { formatNumber } from '$lib/utils/formatters';
	import type { ChartData } from '../../types';
	import type { Region } from '$lib/utils/getRegion';
	import CountryPicker from '../mobilityRenewableShare/CountryPicker.svelte';
	import {
		HOME,
		HOME_STYLE,
		DEFAULT_COMPARE,
		MAX_COMPARE,
		COMPARE_STYLES,
		MIX,
		fetchCarSales,
		buildChartData,
		monthLabel,
		nameOf,
		share,
		type CarSalesData
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	region; // not region-specific

	const MONTHS_SHORT = ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

	let loading = true;
	let error: string | null = null;
	let data: CarSalesData | null = null;
	let smoothing: 'month' | 'avg12' = 'month';
	let width = 0;

	let selected: string[] = [...DEFAULT_COMPARE];
	// stable style slot per country: a country keeps its colour while others are added or removed
	let slots: Record<string, number> = Object.fromEntries(DEFAULT_COMPARE.map((c, i) => [c, i]));
	$: {
		const next: Record<string, number> = {};
		for (const c of selected) if (slots[c] != null) next[c] = slots[c];
		for (const c of selected) {
			if (next[c] != null) continue;
			const used = new Set(Object.values(next));
			next[c] = COMPARE_STYLES.findIndex((_, i) => !used.has(i));
		}
		slots = next;
	}
	const styleFor = (c: string) => (c === HOME ? HOME_STYLE : (COMPARE_STYLES[slots[c]] ?? COMPARE_STYLES[0]));

	onMount(async () => {
		try {
			data = await fetchCarSales();
		} catch (e) {
			error = (e as Error).message;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	});

	$: options = data
		? Object.keys(data)
				.filter((c) => c !== HOME)
				.map((c) => ({ id: c, name: nameOf(c) }))
				.sort((a, b) => a.name.localeCompare(b.name, 'de'))
		: [];
	$: series = data ? [HOME, ...selected].filter((c) => data![c]?.length) : [];
	$: if (data && series.length && onChartData) onChartData(buildChartData(data, series));

	$: latestBySeries = Object.fromEntries(series.map((c) => [c, data![c].at(-1)!.month]));
	$: months = data
		? [...new Set(series.flatMap((c) => data![c].map((r) => r.month)))].sort()
		: [];
	$: byMonth = data ? Object.fromEntries(series.map((c) => [c, new Map(data![c].map((r) => [r.month, r]))])) : {};

	// BEV share per month and country; 12-month average = sum of the last 12 months (weighted by registrations)
	function bevShareAt(c: string, i: number, mode: string, bm: Record<string, Map<string, any>>, ms: string[]): number | null {
		if (mode === 'month') return share(bm[c]?.get(ms[i]));
		if (i < 11) return null;
		let bev = 0;
		let total = 0;
		for (let j = i - 11; j <= i; j++) {
			const r = bm[c]?.get(ms[j]);
			if (!r) return null;
			bev += r.bev;
			total += r.total;
		}
		return total ? (bev / total) * 100 : null;
	}
	$: lineRows = months.map((m, i) => ({ x: m, ...Object.fromEntries(series.map((c) => [c, bevShareAt(c, i, smoothing, byMonth, months)])) }));

	// end labels at the last available value of each line, nudged apart so they do not overlap
	$: endValues = series
		.map((c) => {
			const last = [...lineRows].reverse().find((r) => r[c] != null);
			return { key: c, label: nameOf(c), color: styleFor(c).color, value: (last?.[c] as number) ?? null };
		})
		.filter((d) => d.value != null);
	function labelPositions(items: { key: string; value: number | null }[], yScale: any) {
		const sorted = [...items].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).map((d) => ({ ...d, y: yScale(d.value) }));
		for (let i = 1; i < sorted.length; i++) if (sorted[i].y - sorted[i - 1].y < 15) sorted[i].y = sorted[i - 1].y + 15;
		return Object.fromEntries(sorted.map((d) => [d.key, d.y]));
	}

	// x axis: a tick at every January plus the latest month ("Okt 26");
	// a January too close to the latest month (less than ~44 px at the current width) keeps its tick but loses its label
	$: lastKey = months.at(-1);
	$: plotWidth = Math.max(100, width - 45 - (wide ? 130 : 100));
	$: minGap = Math.ceil(44 / (plotWidth / Math.max(months.length, 1)));
	$: januaries = months.filter((m) => m.endsWith('-01') && m !== lastKey);
	$: xTicks = lastKey ? [...januaries, lastKey] : [];
	$: xLabelled = januaries.filter((m) => months.length - 1 - months.indexOf(m) >= minGap);
	const xFormatFor = (labelled: string[], last: string | undefined, short = false) => (v: string) => {
		const [y, m] = v.split('-').map(Number);
		if (v === last) return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
		if (!labelled.includes(v)) return '';
		return short ? `’${String(y).slice(2)}` : String(y);
	};
	$: xFormat = xFormatFor(xLabelled, lastKey);

	// small multiples: 100 % stacked mix per country; "Wende geschafft" from DONE_THRESHOLD
	$: latestShares = Object.fromEntries(series.map((c) => [c, share(data![c].at(-1))]));
	$: mixRows = Object.fromEntries(
		series.map((c) => [
			c,
			months.map((m) => {
				const r = byMonth[c]?.get(m);
				const bev = share(r, 'bev') ?? 0;
				const phev = share(r, 'phev') ?? 0;
				return { x: m, bev0: 0, bev1: bev, phev0: bev, phev1: bev + phev, fossil0: bev + phev, fossil1: r ? 100 : 0 };
			})
		])
	);
	// tick every 2nd year, or every 4th when the small multiples are narrow (3+ per row)
	$: smallStep = mixCols >= 3 ? 4 : 2;
	$: firstYear = Number(months[0]?.slice(0, 4));
	// a tick at every January, but only every smallStep-th year is labelled
	$: smallTicks = months.filter((m) => m.endsWith('-01'));
	$: smallLabelled = smallTicks.filter((m) => (Number(m.slice(0, 4)) - firstYear) % smallStep === 0);

	$: wide = width >= 640;
	// small multiples in one grid: 6 per row on wide screens (1×6), 3 on medium (2×3), 2 on narrow (3×2)
	// fewer countries are spread evenly (e.g. 4 → 2×2 instead of 3+1)
	$: maxCols = width >= 840 ? 6 : width >= 420 ? 3 : 2;
	$: mixCols = Math.ceil(series.length / Math.ceil(series.length / maxCols)) || 1;
	// sorted by latest BEV share, highest first
	$: mixOrder = [...series].sort((a, b) => (latestShares[b] ?? 0) - (latestShares[a] ?? 0));
	const shortMonth = (m: string) => `${MONTHS_SHORT[Number(m.slice(5)) - 1]} ${m.slice(2, 4)}`;
</script>

{#if loading}
	<div class="h-[640px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[640px] flex items-center justify-center text-red-500">{error}</div>
{:else if !months.length}
	<div class="h-[640px] flex items-center justify-center text-gray-500 dark:text-gray-400">Keine Daten verfügbar</div>
{:else}
	<div class="flex flex-col gap-4" bind:clientWidth={width}>
		<CountryPicker
			{options}
			bind:selected
			home={{ id: HOME, name: nameOf(HOME), color: HOME_STYLE.color }}
			{styleFor}
			max={MAX_COMPARE}
		/>

		<RadioGroup
			label="Glättung"
			hideLabel
			bind:value={smoothing}
			options={[
				{ value: 'month', label: 'Monatswerte' },
				{ value: 'avg12', label: '12-Monats-Mittel' }
			]}
		/>

		<Chart
			data={lineRows}
			x="x"
			y={series}
			xType="band"
			padding={0}
			height={340}
			yMin={0}
			yMax={100}
			margin={{ top: 15, right: wide ? 130 : 100, bottom: 35, left: 45 }}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				{#each series as c (c)}
					{@const s = styleFor(c)}
					<Line
						data={lineRows}
						x="x"
						y={c}
						{xScale}
						{yScale}
						stroke={s.color}
						strokeWidth={c === HOME ? 3 : 2}
						strokeDasharray={s.dash}
						{hover}
					/>
				{/each}
				{@const pos = labelPositions(endValues, yScale)}
				{#each endValues as c (c.key)}
					<text x={innerWidth + 6} y={pos[c.key]} dy="0.35em" class="text-xs font-semibold" fill={c.color}>
						{c.label}
						{formatNumber(c.value ?? 0, 0)} %
					</text>
				{/each}
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={xFormat} tickCount={2} forceTicks={xTicks} />
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={(v) => formatNumber(v, 0)} unit="%" />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const row = lineRows.find((d) => d.x === hover.x)}
					{#if row}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={(smoothing === 'avg12' ? '12 Monate bis ' : '') + monthLabel(row.x)}
							items={series
								.map((c) => ({ c, v: row[c] }))
								.sort((a, b) => (b.v ?? -1) - (a.v ?? -1))
								.map(({ c, v }) => ({
									label: nameOf(c),
									value: v == null ? '–' : `${formatNumber(v, 1)} % elektrisch`,
									color: styleFor(c).color
								}))}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>

		{#if series.some((c) => latestBySeries[c] !== lastKey)}
			<p class="-mt-2 text-xs text-gray-500 dark:text-gray-400">
				Nicht alle Länder sind gleich aktuell:
				{series
					.filter((c) => latestBySeries[c] !== lastKey)
					.map((c) => `${nameOf(c)} bis ${shortMonth(latestBySeries[c])}`)
					.join(', ')}.
			</p>
		{/if}

		<!-- small multiples: full mix -->
		<div class="mt-2 flex flex-col gap-2">
			<p class="text-sm font-semibold text-gray-800 dark:text-gray-200">Antriebsmix der Neuzulassungen</p>
			<div class="grid gap-x-3 gap-y-4" style="grid-template-columns: repeat({mixCols}, minmax(0, 1fr));">
						{#each mixOrder as c (c)}
							<div class="flex flex-col">
								<p class="truncate text-xs text-gray-700 dark:text-gray-300" title="{nameOf(c)} {formatNumber(latestShares[c] ?? 0, 1)} %">
									<span class="font-semibold">{nameOf(c)}</span>
									<span class="font-semibold text-green-700 dark:text-green-400">
										{formatNumber(latestShares[c] ?? 0, 1)} %
									</span>
								</p>
								<Chart
									data={mixRows[c]}
									x="x"
									y={['fossil1']}
									xType="band"
									padding={0}
									height={80}
									yMin={0}
									yMax={100}
									margin={{ top: 6, right: 6, bottom: 22, left: 6 }}
								>
									<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight>
										{#each MIX as m (m.key)}
											<Area
												data={mixRows[c]}
												x="x"
												y0Field={`${m.key}0`}
												y1Field={`${m.key}1`}
												color={m.color}
												opacity={1}
												curve="linear"
												{xScale}
												{yScale}
											/>
										{/each}
										<AxisX
											{xScale}
											{xDomain}
											{innerWidth}
											{innerHeight}
											format={xFormatFor(smallLabelled, undefined, true)}
											tickCount={2}
											forceTicks={smallTicks}
										/>
									</svelte:fragment>
								</Chart>
							</div>
						{/each}
			</div>
			<div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
				{#each MIX as m}
					<span class="flex items-center gap-1.5">
						<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background:{m.color}"></span>{m.label}
					</span>
				{/each}
			</div>
		</div>
	</div>
{/if}
