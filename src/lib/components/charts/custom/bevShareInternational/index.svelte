<!--
	"Aber China:" – battery-electric share of new passenger cars in Norway, Denmark, China and Austria.
	Top: BEV share per month (or 12-month average) as lines.
	Bottom: small multiples with the full mix (BEV / plug-in hybrid / fossil), grouped into
	"Wende geschafft" (Norway, Denmark) and "Auf dem Weg" (China, Austria).
	Data is loaded live from Robbie Andrew's carsales CSVs (see config.ts).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, AxisX, AxisY, Line, Area, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import { formatNumber } from '$lib/utils/formatters';
	import type { ChartData } from '../../types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		COUNTRIES,
		MIX,
		fetchCarSales,
		buildChartData,
		commonLatestMonth,
		monthLabel,
		share,
		type CarSalesData,
		type CountryKey
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	region; // not region-specific

	const MONTHS_SHORT = ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
	const GROUPS = [
		{ key: 'done', label: 'Wende geschafft' },
		{ key: 'onTheWay', label: 'Auf dem Weg' }
	];

	let loading = true;
	let error: string | null = null;
	let data: CarSalesData | null = null;
	let smoothing: 'month' | 'avg12' = 'month';
	let hidden: Set<string> = new Set();
	let width = 0;

	onMount(async () => {
		try {
			data = await fetchCarSales();
			onChartData?.(buildChartData(data));
		} catch (e) {
			error = (e as Error).message;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	});

	$: latest = data ? commonLatestMonth(data) : null;
	$: months = data
		? [...new Set(COUNTRIES.flatMap((c) => data![c.key].map((r) => r.month)))].sort().filter((m) => !latest || m <= latest)
		: [];
	$: byMonth = data
		? (Object.fromEntries(COUNTRIES.map((c) => [c.key, new Map(data![c.key].map((r) => [r.month, r]))])) as Record<
				CountryKey,
				Map<string, any>
			>)
		: null;

	// BEV share per month and country; 12-month average = sum of the last 12 months (weighted by registrations)
	function bevShareAt(k: CountryKey, i: number): number | null {
		if (!byMonth) return null;
		if (smoothing === 'month') return share(byMonth[k].get(months[i]));
		if (i < 11) return null;
		let bev = 0;
		let total = 0;
		for (let j = i - 11; j <= i; j++) {
			const r = byMonth[k].get(months[j]);
			if (!r) return null;
			bev += r.bev;
			total += r.total;
		}
		return total ? (bev / total) * 100 : null;
	}
	$: lineRows = months.map((m, i) => ({ x: m, ...Object.fromEntries(COUNTRIES.map((c) => [c.key, bevShareAt(c.key, i)])) }));
	$: visible = COUNTRIES.filter((c) => !hidden.has(c.key));

	// end labels, nudged apart so they do not overlap
	$: endValues = visible
		.map((c) => ({ ...c, value: lineRows.at(-1)?.[c.key] as number | null }))
		.filter((c) => c.value != null);

	function labelPositions(items: { key: string; value: number | null }[], yScale: any) {
		const sorted = [...items].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).map((d) => ({ ...d, y: yScale(d.value) }));
		for (let i = 1; i < sorted.length; i++) if (sorted[i].y - sorted[i - 1].y < 15) sorted[i].y = sorted[i - 1].y + 15;
		return Object.fromEntries(sorted.map((d) => [d.key, d.y]));
	}

	// x axis: every January with the year, plus the latest month ("Okt 26")
	$: lastKey = months.at(-1);
	$: xTicks = lastKey ? [...months.filter((m, i) => m.endsWith('-01') && months.length - 1 - i >= 4), lastKey] : [];
	const xFormatFor = (ticks: string[], last: string | undefined, short = false) => (v: string) => {
		const [y, m] = v.split('-').map(Number);
		if (v === last) return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
		if (!ticks.includes(v)) return '';
		return short ? `’${String(y).slice(2)}` : String(y);
	};
	$: xFormat = xFormatFor(xTicks, lastKey);

	// small multiples: 100 % stacked mix per country
	$: mixRows = Object.fromEntries(
		COUNTRIES.map((c) => [
			c.key,
			months.map((m) => {
				const r = byMonth?.[c.key].get(m);
				const bev = share(r, 'bev') ?? 0;
				const phev = share(r, 'phev') ?? 0;
				return { x: m, bev0: 0, bev1: bev, phev0: bev, phev1: bev + phev, fossil0: bev + phev, fossil1: r ? 100 : 0 };
			})
		])
	);
	$: smallTicks = months.filter((m) => m.endsWith('-01') && (m.slice(0, 4) === months[0]?.slice(0, 4) || Number(m.slice(0, 4)) % 2 === 0));

	$: latestShares = latest && byMonth ? Object.fromEntries(COUNTRIES.map((c) => [c.key, share(byMonth[c.key].get(latest))])) : {};
	$: wide = width >= 640;
</script>

{#if loading}
	<div class="h-[640px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[640px] flex items-center justify-center text-red-500">{error}</div>
{:else if !months.length}
	<div class="h-[640px] flex items-center justify-center text-gray-500 dark:text-gray-400">Keine Daten verfügbar</div>
{:else}
	<div class="flex flex-col gap-4" bind:clientWidth={width}>
		{#if latest}
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{monthLabel(latest)}: In China waren
				<strong class="text-gray-900 dark:text-white">{formatNumber(latestShares.china ?? 0, 1)} %</strong>
				der neuen Autos rein elektrisch – in Österreich
				<strong class="text-gray-900 dark:text-white">{formatNumber(latestShares.austria ?? 0, 1)} %</strong>.
			</p>
		{/if}

		<div class="flex flex-wrap items-end justify-between gap-3">
			<Legend
				interactive
				bind:hidden
				items={COUNTRIES.map((c) => ({ key: c.key, label: c.label, color: c.color, dashed: c.dash != null }))}
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
		</div>

		<Chart
			data={lineRows}
			x="x"
			y={visible.map((c) => c.key)}
			xType="band"
			padding={0}
			height={340}
			yMin={0}
			yMax={100}
			margin={{ top: 15, right: wide ? 100 : 80, bottom: 35, left: 45 }}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				{#each visible as c (c.key)}
					<Line
						data={lineRows}
						x="x"
						y={c.key}
						{xScale}
						{yScale}
						stroke={c.color}
						strokeWidth={c.key === 'austria' || c.key === 'china' ? 3 : 2}
						strokeDasharray={c.dash}
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
							items={visible
								.map((c) => ({ c, v: row[c.key] }))
								.sort((a, b) => (b.v ?? -1) - (a.v ?? -1))
								.map(({ c, v }) => ({
									label: c.label,
									value: v == null ? '–' : `${formatNumber(v, 1)} % elektrisch`,
									color: c.color
								}))}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>

		<!-- small multiples: full mix -->
		<div class="mt-2 flex flex-col gap-2">
			<p class="text-sm font-semibold text-gray-800 dark:text-gray-200">Antriebsmix der Neuzulassungen</p>
			<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
				{#each MIX as m}
					<span class="flex items-center gap-1.5">
						<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background:{m.color}"></span>{m.label}
					</span>
				{/each}
			</div>
			<div class="grid gap-4 {wide ? 'grid-cols-2' : 'grid-cols-1'}">
				{#each GROUPS as g (g.key)}
					<div class="flex flex-col gap-2">
						<p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{g.label}</p>
						<div class="grid grid-cols-2 gap-3">
							{#each COUNTRIES.filter((c) => c.group === g.key) as c (c.key)}
								<div class="flex flex-col">
									<p class="text-sm text-gray-700 dark:text-gray-300">
										<span class="font-semibold">{c.label}</span>
										<span class="text-[#1a9850] dark:text-[#5cc283] font-semibold">
											{formatNumber(latestShares[c.key] ?? 0, 1)} %
										</span>
									</p>
									<Chart
										data={mixRows[c.key]}
										x="x"
										y={['fossil1']}
										xType="band"
										padding={0}
										height={110}
										yMin={0}
										yMax={100}
										margin={{ top: 6, right: 6, bottom: 22, left: 6 }}
									>
										<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight>
											{#each MIX as m (m.key)}
												<Area
													data={mixRows[c.key]}
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
												format={xFormatFor(smallTicks, undefined, true)}
												tickCount={2}
												forceTicks={smallTicks}
											/>
										</svelte:fragment>
									</Chart>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
