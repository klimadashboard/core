<!--
	Lkw-/Bus-Neuzulassungs-Explorer (AT): new registrations by fuel type.
	mode "truck" (default): one goods vehicle class at a time, picked with four icon tiles above the chart
	(N1 vans, N2 light trucks, N3 heavy trucks, semi-trailer tractors).
	mode "bus": buses (M2 + M3), no tiles. Set via prop `mode` or CMS option `{"vehicleGroup": "bus"}`.
	Data: Directus collection `vehicle_registrations` (see docs/data-sources-mobility.md)
	(Statistik Austria, Kfz-Neuzulassungen nach Bundesland und Kraftstoffart bzw. Energiequelle).
	Shows Austria; on a federal state page the data of that state.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import { Chart, AxisX, AxisY, BarStack, Line, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import StatePicker from '../emissionsFederalStatesExplorer/StatePicker.svelte';
	import { formatNumber } from '$lib/utils/formatters';
	import type { ChartData } from '../../types';
	import type { Region } from '$lib/utils/getRegion';
	import TruckIcon from './TruckIcon.svelte';

	type Row = {
		region?: string;
		year: number;
		month: number;
		vehicle_class: string;
		fuel_type: string;
		period: string;
		value: number | null;
	};
	type VehicleClass = 'truck_n1' | 'truck_n2' | 'truck_n3' | 'semi_trailer_tractor' | 'bus_m2_m3';

	export let chart: any = undefined;
	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	/** optional: rows passed in directly (local preview before the collection exists) */
	export let rows: Row[] | null = null;
	/** "truck" (four classes with icon tiles) or "bus" */
	export let mode: 'truck' | 'bus' = chart?.options?.vehicleGroup === 'bus' ? 'bus' : 'truck';

	const AUSTRIA_ID = '3373d6d8-5fa2-4d5a-ac0b-790e69982f81';
	const REGIONS = [
		{ id: AUSTRIA_ID, name: 'Österreich' },
		{ id: '2bc3faed-7cb4-492c-9097-145a0f8f1f01', name: 'Burgenland' },
		{ id: '9297c491-c419-4ca5-a10f-4d7b93998909', name: 'Kärnten' },
		{ id: '39b741d5-c7ca-4ff2-9c5c-c0709daea62c', name: 'Niederösterreich' },
		{ id: '9cde29fb-d189-4461-b766-5dfd3de56303', name: 'Oberösterreich' },
		{ id: 'b9b8feef-4d7d-4c23-ac21-60377d96ead0', name: 'Salzburg' },
		{ id: '63bf6c1a-cb90-40f9-913e-daba7431fd56', name: 'Steiermark' },
		{ id: 'a4bafe0a-f71b-40a0-8d1d-1baa8af05692', name: 'Tirol' },
		{ id: 'fc5cfc23-3b75-4b7a-9d50-6e4ec018bd1a', name: 'Vorarlberg' },
		{ id: '76888a3b-ce35-482c-88e6-79cff27be8c5', name: 'Wien' }
	];
	const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	const MONTHS_SHORT = ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

	type VehicleClassInfo = { key: VehicleClass; label: string; sub: string; short: string };
	const TRUCK_CLASSES: VehicleClassInfo[] = [
		{ key: 'truck_n1', label: 'Lieferwagen', sub: 'Klasse N1 · bis 3,5 t', short: 'Lieferwagen' },
		{ key: 'truck_n2', label: 'Leichte Lkw', sub: 'Klasse N2 · 3,5 bis 12 t', short: 'leichten Lkw' },
		{ key: 'truck_n3', label: 'Schwere Lkw', sub: 'Klasse N3 · über 12 t', short: 'schweren Lkw' },
		{ key: 'semi_trailer_tractor', label: 'Sattelzugmaschinen', sub: 'für Sattelauflieger', short: 'Sattelzugmaschinen' }
	];
	const BUS_CLASSES: VehicleClassInfo[] = [{ key: 'bus_m2_m3', label: 'Busse', sub: 'Klasse M2 und M3', short: 'Busse' }];
	$: CLASSES = mode === 'bus' ? BUS_CLASSES : TRUCK_CLASSES;

	// stack order bottom → top; colours as in the car stock chart (carsTypes/config.ts → categoryConfig)
	// (this source has no plug-in split, so hybrids include plug-in hybrids)
	const GROUPS = [
		{ key: 'electric', label: 'Elektro', color: '#10B981', of: (v: Record<string, number>) => v.electric ?? 0 },
		{ key: 'hybrid', label: 'Hybrid', color: '#38BDF8', of: (v) => (v.petrol_hybrid ?? 0) + (v.diesel_hybrid ?? 0) },
		{ key: 'petrol', label: 'Benzin', color: '#F59E0B', of: (v) => v.petrol ?? 0 },
		{ key: 'diesel', label: 'Diesel', color: '#DB2777', of: (v) => v.diesel ?? 0 },
		{
			key: 'other',
			label: 'Sonstige (Gas, Wasserstoff)',
			color: '#94A3B8',
			of: (v) =>
				(v.natural_gas ?? 0) +
				(v.lpg ?? 0) +
				(v.petrol_natural_gas_bivalent ?? 0) +
				(v.petrol_lpg_bivalent ?? 0) +
				(v.hydrogen ?? 0)
		}
	] as { key: string; label: string; color: string; of: (v: Record<string, number>) => number }[];

	// line view: dash patterns so the series do not differ by colour alone
	const DASH: Record<string, string | null> = { electric: null, hybrid: '2 3', petrol: '6 3', diesel: null, other: '2 3' };

	let loading = true;
	let error: string | null = null;
	let data: Row[] = [];

	let vehicleClass: VehicleClass = (chart?.options?.vehicleClass as VehicleClass) ?? 'truck_n1';
	$: if (!CLASSES.some((c) => c.key === vehicleClass)) vehicleClass = CLASSES[0].key;
	let chartType: 'bar' | 'line' = 'bar';
	let period: 'month' | 'year' = 'month';
	let measure: 'count' | 'share' = 'share';
	let hidden: Set<string> = new Set();
	let width = 0;

	// line view on wide screens: labels at the line ends instead of the legend; fuel types are picked in a dropdown
	const END_LABEL: Record<string, string> = { electric: 'Elektro', hybrid: 'Hybrid', petrol: 'Benzin', diesel: 'Diesel', other: 'Sonstige' };
	$: lineEndLabels = chartType === 'line' && width >= 500;
	function endLabelsFor(yScale: (v: number) => number, rowsForLabels: Record<string, any>[]) {
		const labels = GROUPS.filter((g) => !hidden.has(g.key))
			.map((g) => {
				const last = [...rowsForLabels].reverse().find((r) => r[g.key] != null);
				if (!last) return null;
				const v = last[g.key] as number;
				return { key: g.key, color: g.color, text: `${END_LABEL[g.key] ?? g.label} ${measure === 'share' ? `${formatNumber(v, 0)} %` : formatNumber(v, 0)}`, y: yScale(v) };
			})
			.filter((l): l is NonNullable<typeof l> => l !== null)
			.sort((a, b) => a.y - b.y);
		for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 13) labels[i].y = labels[i - 1].y + 13;
		return labels;
	}

	// federal state page → that state, otherwise Austria
	const regionId: string = REGIONS.some((r) => r.id === region?.id) ? (region!.id as string) : AUSTRIA_ID;
	$: regionName = REGIONS.find((r) => r.id === regionId)?.name ?? '';

	onMount(async () => {
		try {
			if (rows) {
				data = rows;
			} else {
				const directus = getDirectusInstance();
				data = (await directus.request(
					// collection documented in docs/data-sources-mobility.md
					readItems('vehicle_registrations', {
						filter: { vehicle_class: { _in: CLASSES.map((c) => c.key) as string[] } },
						fields: ['region', 'year', 'month', 'vehicle_class', 'fuel_type', 'period', 'value'],
						limit: -1
					})
				)) as Row[];
			}
			data = data.map((r) => ({
				...r,
				region: typeof r.region === 'object' && r.region ? (r.region as any).id : r.region,
				year: Number(r.year),
				month: Number(r.month),
				value: r.value == null ? null : Number(r.value)
			}));
		} catch (e) {
			error = (e as Error).message;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	});

	// region → (class|year|month|period) → fuel_type → value
	$: lookup = (() => {
		const m = new Map<string, Record<string, number>>();
		for (const r of data) {
			if ((r.region ?? AUSTRIA_ID) !== regionId) continue;
			const k = `${r.vehicle_class}|${r.year}|${r.month}|${r.period}`;
			if (!m.has(k)) m.set(k, {});
			m.get(k)![r.fuel_type] = r.value ?? 0;
		}
		return m;
	})();

	$: years = [...new Set(data.map((r) => r.year))].sort((a, b) => a - b);
	const total = (v: Record<string, number> | undefined) => (v ? GROUPS.reduce((s, g) => s + g.of(v), 0) : 0);

	// latest year_to_date entry per year (2024 only has the full year, the running year ends with the latest month)
	function yearEntries(vc: string, lk: Map<string, Record<string, number>>) {
		return years
			.map((y) => {
				for (let m = 12; m >= 1; m--) {
					const v = lk.get(`${vc}|${y}|${m}|year_to_date`);
					if (v) return { year: y, month: m, values: v };
				}
				return null;
			})
			.filter(Boolean) as { year: number; month: number; values: Record<string, number> }[];
	}

	// icon tiles: electric share in the latest (possibly partial) year
	$: tileStats = Object.fromEntries(
		CLASSES.map((c) => {
			const last = yearEntries(c.key, lookup).at(-1);
			const t = total(last?.values);
			return [c.key, last && t ? { year: last.year, month: last.month, share: ((last.values.electric ?? 0) / t) * 100 } : null];
		})
	);

	$: bars = (() => {
		const out: { x: string; label: string; values: Record<string, number> }[] = [];
		if (period === 'month') {
			for (const y of years) {
				for (let m = 1; m <= 12; m++) {
					const v = lookup.get(`${vehicleClass}|${y}|${m}|month`);
					if (v) out.push({ x: `${y}-${String(m).padStart(2, '0')}`, label: `${MONTHS[m - 1]} ${y}`, values: v });
				}
			}
		} else {
			for (const e of yearEntries(vehicleClass, lookup)) {
				out.push({
					x: e.month === 12 ? String(e.year) : `${e.year}*`,
					label: e.month === 12 ? String(e.year) : `${e.year} (Jänner–${MONTHS[e.month - 1]})`,
					values: e.values
				});
			}
		}
		return out;
	})();
	$: partialYear = period === 'year' ? bars.find((b) => b.x.endsWith('*')) : null;

	$: visibleGroups = GROUPS.filter((g) => !hidden.has(g.key));

	$: stacked = bars.map((b) => {
		const sum = total(b.values);
		let acc = 0;
		const segments = visibleGroups.map((g) => {
			const count = g.of(b.values);
			const value = measure === 'share' ? (sum ? (count / sum) * 100 : 0) : count;
			const seg = { key: g.key, label: g.label, color: g.color, value, count, y0: acc, y1: acc + value };
			acc += value;
			return seg;
		});
		return { x: b.x, label: b.label, total: sum, segments, _top: acc };
	});

	$: lineRows = stacked.map((b) => ({ x: b.x, ...Object.fromEntries(b.segments.map((s) => [s.key, s.value])) }));

	$: fmtCount = (v: number) => formatNumber(v, 0);
	$: current = CLASSES.find((c) => c.key === vehicleClass)!;

	// monthly x axis: every January with the year, always the latest month ("Okt 26")
	$: lastKey = stacked.at(-1)?.x;
	$: xTicks =
		period === 'month' && lastKey
			? [...stacked.map((b) => b.x).filter((x, i, all) => x.endsWith('-01') && all.length - 1 - i >= 3), lastKey]
			: [];
	$: xFormat = (v: string) => {
		if (period !== 'month') return v;
		const [y, m] = v.split('-').map(Number);
		if (v === lastKey) return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
		return xTicks.includes(v) ? String(y) : '';
	};

	// headline: latest month of the selected class
	$: latestMonthBar = (() => {
		for (let i = years.length - 1; i >= 0; i--)
			for (let m = 12; m >= 1; m--) {
				const v = lookup.get(`${vehicleClass}|${years[i]}|${m}|month`);
				if (v) return { year: years[i], month: m, values: v };
			}
		return null;
	})();
	$: latestTotal = total(latestMonthBar?.values);
	$: latestShare = latestMonthBar && latestTotal ? ((latestMonthBar.values.electric ?? 0) / latestTotal) * 100 : null;

	$: if (stacked.length && onChartData) {
		const fmt = (v: any) => (typeof v === 'number' ? v.toLocaleString('de-AT') : '–');
		const tableRows = stacked.map((b) => {
			const row: Record<string, any> = { period: b.label, total: b.total };
			for (const s of b.segments) row[s.key] = s.count;
			return row;
		});
		onChartData({
			raw: tableRows,
			table: {
				columns: [
					{ key: 'period', label: 'Zeitraum', align: 'left' },
					...visibleGroups.map((g) => ({ key: g.key, label: g.label, align: 'right' as const, format: fmt })),
					{ key: 'total', label: 'Gesamt', align: 'right', format: fmt }
				],
				rows: tableRows,
				filename: `neuzulassungen_${vehicleClass}_${period === 'month' ? 'monat' : 'jahr'}`
			},
			placeholders: {
				latestMonth: latestMonthBar ? `${MONTHS[latestMonthBar.month - 1]} ${latestMonthBar.year}` : '',
				latestElectricShare: latestShare != null ? formatNumber(latestShare, 1) : ''
			},
			meta: {
				// Card.svelte renders the source as HTML
				source:
					'Statistik Austria, Kfz-Statistik: <a href="https://www.statistik.at/statistiken/tourismus-und-verkehr/fahrzeuge/kfz-neuzulassungen" target="_blank" rel="noopener" class="underline hover:no-underline">Kfz-Neuzulassungen nach Bundesland und Kraftstoffart bzw. Energiequelle</a>',
				note: 'Hybrid enthält Plug-in-Hybride (in dieser Quelle nicht getrennt ausgewiesen).'
			}
		});
	}
</script>

{#if loading}
	<div class="h-[560px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[560px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data.length}
	<div class="h-[560px] flex items-center justify-center text-gray-500 dark:text-gray-400">Keine Daten verfügbar</div>
{:else}
	<div class="flex flex-col gap-4" bind:clientWidth={width}>
		<!-- vehicle class tiles (trucks only) -->
		{#if CLASSES.length > 1}
		<!-- same look as the Pkw / Lkw / Busse switch: one track, the selected class as a raised white segment -->
		<div role="radiogroup" aria-label="Fahrzeugklasse" class="grid grid-cols-2 md:grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
			{#each CLASSES as c (c.key)}
				{@const active = c.key === vehicleClass}
				{@const stat = tileStats[c.key]}
				<button
					type="button"
					role="radio"
					aria-checked={active}
					on:click={() => (vehicleClass = c.key)}
					title={stat ? `${formatNumber(stat.share, 1)} % elektrisch ${stat.month === 12 ? stat.year : `${stat.year} (Jänner bis ${MONTHS[stat.month - 1]})`}` : undefined}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
						{active
						? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5 dark:bg-gray-950 dark:text-white dark:ring-white/10'
						: 'text-gray-500 hover:bg-white/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900/60 dark:hover:text-white'}"
				>
					<!-- same box for every icon so the four vehicles look balanced -->
					<span class="flex h-7 w-11 shrink-0 items-center justify-center">
						<TruckIcon type={c.key as Exclude<VehicleClass, 'bus_m2_m3'>} size={22} />
					</span>
					<span class="flex min-w-0 flex-col">
						<span class="truncate text-sm font-semibold leading-tight">{c.label}</span>
						<span class="truncate text-xs leading-tight text-gray-500 dark:text-gray-400">{c.sub}</span>
						{#if stat}
							<span class="mt-1 inline-flex w-fit items-center rounded-full bg-green-200 px-1.5 py-px text-[11px] font-semibold leading-4 text-green-800 dark:bg-green-900 dark:text-green-300">
								{stat.month === 12 ? stat.year : `${stat.year} (Jän–${MONTHS_SHORT[stat.month - 1]})`}: {formatNumber(stat.share, 1)} % elektrisch
							</span>
						{/if}
					</span>
				</button>
			{/each}
		</div>
		{/if}


		<div class="flex flex-wrap items-end gap-4">
			<RadioGroup
				label="Diagrammart"
				hideLabel
				bind:value={chartType}
				options={[
					{ value: 'bar', label: 'Balken' },
					{ value: 'line', label: 'Linien' }
				]}
			/>
			<RadioGroup
				label="Zeitraum"
				hideLabel
				bind:value={period}
				options={[
					{ value: 'month', label: 'Monatswerte' },
					{ value: 'year', label: 'Jahreswerte' }
				]}
			/>
			<RadioGroup
				label="Darstellung"
				hideLabel
				bind:value={measure}
				options={[
					{ value: 'share', label: 'Anteil' },
					{ value: 'count', label: 'Anzahl' }
				]}
			/>
			{#if lineEndLabels}
				<StatePicker
					title="Antriebsarten"
					bind:hidden
					items={GROUPS.map((g) => ({ key: g.key, label: g.label, color: g.color, dash: DASH[g.key] }))}
				/>
			{/if}
		</div>

		<!-- legend only when the lines have no end labels (bar view, narrow screens) -->
		{#if !lineEndLabels}
			<div>
				<Legend
					interactive
					bind:hidden
					items={GROUPS.map((g) => ({ key: g.key, label: g.label, color: g.color, dashed: chartType === 'line' && DASH[g.key] != null }))}
				/>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Antriebsarten in der Legende an- und abwählen.</p>
			</div>
		{/if}

		<Chart
			data={chartType === 'bar' ? stacked : lineRows}
			x="x"
			y={chartType === 'bar' ? '_top' : visibleGroups.map((g) => g.key)}
			xType="band"
			height={360}
			yMin={0}
			yMax={measure === 'share' && chartType === 'bar' ? 100 : null}
			padding={period === 'month' ? 0.15 : 0.35}
			margin={{ top: 15, right: lineEndLabels ? 110 : 10, bottom: 35, left: 55 }}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				{#if chartType === 'bar'}
					<BarStack data={stacked} x="x" {xScale} {yScale} {hover} />
				{:else}
					{#each visibleGroups as g (g.key)}
						<Line
							data={lineRows}
							x="x"
							y={g.key}
							{xScale}
							{yScale}
							stroke={g.color}
							strokeWidth={g.key === 'electric' ? 3 : 2}
							strokeDasharray={DASH[g.key]}
							dots={period !== 'month'}
							{hover}
						/>
					{/each}
					{#if lineEndLabels}
						{#each endLabelsFor(yScale, lineRows) as l (l.key)}
							<text x={innerWidth + 6} y={l.y} dy="0.35em" class="text-xs font-semibold" fill={l.color}>{l.text}</text>
						{/each}
					{/if}
				{/if}
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={xFormat}
					tickCount={period === 'month' ? 2 : 10}
					forceTicks={xTicks}
				/>
				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					format={(v) => formatNumber(v, 0)}
					unit={measure === 'share' ? '%' : 'Fahrzeuge'}
				/>
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const b = stacked.find((d) => d.x === hover.x)}
					{#if b}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={b.label}
							items={[
								...[...b.segments].reverse().map((s) => ({
									label: s.label,
									value: `${fmtCount(s.count)} (${formatNumber(b.total ? (s.count / b.total) * 100 : 0, 1)} %)`,
									color: s.color
								})),
								{ label: 'Gesamt', value: fmtCount(b.total), color: 'transparent' }
							]}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>

		{#if partialYear}
			<p class="text-xs text-gray-500 dark:text-gray-400">
				* {partialYear.label}: Das laufende Jahr ist noch nicht vollständig – bei „Anzahl“ daher nicht mit den Vorjahren vergleichbar.
			</p>
		{/if}
	</div>
{/if}
