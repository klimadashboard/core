<!--
	Neuzulassungs-Explorer (AT): new passenger car registrations by fuel type.
	Data: Directus collection `new_car_registrations` (Statistik Austria, Kfz-Statistik, Tabelle 2).
	Views: monthly values or cumulative (January up to a selectable month, one bar per year),
	each as number of cars or as share in %.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import { Chart, AxisX, AxisY, BarStack, Line, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RadioGroup, Select } from '$lib/components/ui';
	import { formatNumber } from '$lib/utils/formatters';
	import type { ChartData } from '../../types';
	import type { Region } from '$lib/utils/getRegion';

	type Row = { year: number; month: number; fuel_type: string; period: string; value: number | null };

	export let chart: any = undefined;
	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	/** optional: rows passed in directly (local preview before the collection exists) */
	export let rows: Row[] | null = null;
	chart;
	region; // Austria only

	const REGION_ID = '3373d6d8-5fa2-4d5a-ac0b-790e69982f81'; // Österreich
	const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	const MONTHS_SHORT = ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

	// stack order bottom → top; plug-ins are a subset of the hybrids in the data,
	// so hybrids are shown without plug-ins to avoid double counting
	const GROUPS = [
		{ key: 'electric', label: 'Elektro', color: '#1a9850', of: (v: Record<string, number>) => v.electric },
		{ key: 'plugin', label: 'Plug-in-Hybrid', color: '#91cf60', of: (v) => v.petrol_plugin_hybrid + v.diesel_plugin_hybrid },
		{
			key: 'hybrid',
			label: 'Hybrid (ohne Plug-in)',
			color: '#4880A8',
			of: (v) => v.petrol_hybrid - v.petrol_plugin_hybrid + (v.diesel_hybrid - v.diesel_plugin_hybrid)
		},
		{ key: 'petrol', label: 'Benzin', color: '#9ca3af', of: (v) => v.petrol },
		{ key: 'diesel', label: 'Diesel', color: '#4b5563', of: (v) => v.diesel },
		{
			key: 'other',
			label: 'Sonstige (Gas, Wasserstoff)',
			color: '#d6c08a',
			of: (v) => v.natural_gas + v.petrol_natural_gas_bivalent + v.petrol_lpg_bivalent + v.hydrogen
		}
	] as { key: string; label: string; color: string; of: (v: Record<string, number>) => number }[];

	let loading = true;
	let error: string | null = null;
	let data: Row[] = [];

	// line view: dash patterns so the series do not differ by colour alone
	const DASH: Record<string, string | null> = {
		electric: null,
		plugin: '6 3',
		hybrid: '2 3',
		petrol: null,
		diesel: '6 3',
		other: '2 3'
	};

	let chartType: 'bar' | 'line' = 'bar';
	let period: 'month' | 'year_to_date' = 'month';
	let measure: 'count' | 'share' = 'count';
	let untilMonth = 12;
	let hidden: Set<string> = new Set();

	onMount(async () => {
		try {
			if (rows) {
				data = rows;
			} else {
				const directus = getDirectusInstance();
				data = (await directus.request(
					readItems('new_car_registrations', {
						filter: { region: { _eq: REGION_ID } },
						fields: ['year', 'month', 'fuel_type', 'period', 'value'],
						limit: -1
					})
				)) as Row[];
			}
			data = data.map((r) => ({ ...r, year: Number(r.year), month: Number(r.month), value: r.value == null ? null : Number(r.value) }));
			const last = latest(data);
			if (last) untilMonth = last.month;
		} catch (e) {
			error = (e as Error).message;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	});

	function latest(list: Row[]) {
		return list
			.filter((r) => r.fuel_type === 'total' && r.period === 'month' && r.value != null)
			.sort((a, b) => b.year - a.year || b.month - a.month)[0];
	}

	// (year, month, period) → fuel_type → value
	$: lookup = (() => {
		const m = new Map<string, Record<string, number>>();
		for (const r of data) {
			const k = `${r.year}|${r.month}|${r.period}`;
			if (!m.has(k)) m.set(k, {});
			m.get(k)![r.fuel_type] = r.value ?? 0;
		}
		return m;
	})();

	$: lastPoint = latest(data);
	$: lastYear = lastPoint?.year;
	$: lastMonth = lastPoint?.month ?? 12;
	$: years = [...new Set(data.map((r) => r.year))].sort((a, b) => a - b);

	// one bar per month, or per year (January up to untilMonth); the latest year only if it has reached untilMonth
	$: bars = (() => {
		const out: { x: string; label: string; values: Record<string, number> }[] = [];
		if (period === 'month') {
			for (const y of years) {
				for (let m = 1; m <= 12; m++) {
					const v = lookup.get(`${y}|${m}|month`);
					if (v) out.push({ x: `${y}-${String(m).padStart(2, '0')}`, label: `${MONTHS[m - 1]} ${y}`, values: v });
				}
			}
		} else {
			for (const y of years) {
				const v = lookup.get(`${y}|${untilMonth}|year_to_date`);
				if (v) out.push({ x: String(y), label: untilMonth === 12 ? String(y) : `Jänner–${MONTHS[untilMonth - 1]} ${y}`, values: v });
			}
		}
		return out;
	})();

	$: visibleGroups = GROUPS.filter((g) => !hidden.has(g.key));

	$: stacked = bars.map((b) => {
		const total = GROUPS.reduce((s, g) => s + g.of(b.values), 0);
		let acc = 0;
		const segments = visibleGroups.map((g) => {
			const count = g.of(b.values);
			const value = measure === 'share' ? (total ? (count / total) * 100 : 0) : count;
			const seg = { key: g.key, label: g.label, color: g.color, value, count, y0: acc, y1: acc + value };
			acc += value;
			return seg;
		});
		return { x: b.x, label: b.label, total, segments, _top: acc };
	});

	// one field per group for the line view
	$: lineRows = stacked.map((b) => ({ x: b.x, ...Object.fromEntries(b.segments.map((s) => [s.key, s.value])) }));

	$: fmtCount = (v: number) => formatNumber(v, 0);
	$: xFormat = (v: string) => {
		if (period !== 'month') return v;
		const [y, m] = v.split('-').map(Number);
		return m === 1 ? String(y) : `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
	};

	// headline numbers: latest month
	$: latestValues = lastPoint ? lookup.get(`${lastPoint.year}|${lastPoint.month}|month`) : null;
	$: latestTotal = latestValues ? GROUPS.reduce((s, g) => s + g.of(latestValues), 0) : 0;
	$: latestElectricShare = latestValues && latestTotal ? (latestValues.electric / latestTotal) * 100 : null;

	// table for the card
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
				filename: period === 'month' ? 'pkw_neuzulassungen_monat' : 'pkw_neuzulassungen_kumuliert'
			},
			placeholders: {
				latestMonth: lastPoint ? `${MONTHS[lastPoint.month - 1]} ${lastPoint.year}` : '',
				latestElectricShare: latestElectricShare != null ? formatNumber(latestElectricShare, 1) : ''
			},
			meta: { source: 'Statistik Austria, Kfz-Statistik' }
		});
	}
</script>

{#if loading}
	<div class="h-[460px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[460px] flex items-center justify-center text-red-500">{error}</div>
{:else if !bars.length}
	<div class="h-[460px] flex items-center justify-center text-gray-500 dark:text-gray-400">Keine Daten verfügbar</div>
{:else}
	<div class="flex flex-col gap-3">
		{#if latestElectricShare != null && lastPoint}
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{MONTHS[lastPoint.month - 1]}
				{lastPoint.year}: <strong class="text-gray-900 dark:text-white">{formatNumber(latestElectricShare, 1)} %</strong>
				der neu zugelassenen Pkw waren Elektroautos ({fmtCount(latestValues?.electric ?? 0)} von {fmtCount(latestTotal)}).
			</p>
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
					{ value: 'year_to_date', label: 'Kumuliert' }
				]}
			/>
			<RadioGroup
				label="Darstellung"
				hideLabel
				bind:value={measure}
				options={[
					{ value: 'count', label: 'Anzahl' },
					{ value: 'share', label: 'Anteil' }
				]}
			/>
			{#if period === 'year_to_date'}
				<div class="w-48">
					<Select
						label="Zeitraum im Jahr"
						hideLabel
						small
						value={String(untilMonth)}
						on:change={(e) => (untilMonth = Number(e.detail))}
						options={MONTHS.map((m, i) => ({ value: String(i + 1), label: i === 0 ? 'nur Jänner' : `Jänner bis ${m}` }))}
					/>
				</div>
			{/if}
		</div>

		{#if period === 'year_to_date' && lastYear && untilMonth > lastMonth}
			<p class="text-xs text-gray-500 dark:text-gray-400">
				{lastYear} ist erst bis {MONTHS[lastMonth - 1]} verfügbar und fehlt daher in diesem Vergleich.
			</p>
		{/if}

		<div>
			<Legend
				interactive
				bind:hidden
				items={GROUPS.map((g) => ({ key: g.key, label: g.label, color: g.color, dashed: chartType === 'line' && DASH[g.key] != null }))}
			/>
			<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Antriebsarten in der Legende an- und abwählen.</p>
		</div>

		<Chart
			data={chartType === 'bar' ? stacked : lineRows}
			x="x"
			y={chartType === 'bar' ? '_top' : visibleGroups.map((g) => g.key)}
			xType="band"
			height={380}
			yMin={0}
			yMax={measure === 'share' && chartType === 'bar' ? 100 : null}
			padding={period === 'month' ? 0.15 : 0.3}
			margin={{ top: 15, right: 10, bottom: 35, left: 55 }}
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
				{/if}
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={xFormat} tickCount={period === 'month' ? 8 : 10} />
				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					format={(v) => formatNumber(v, 0)}
					unit={measure === 'share' ? '%' : 'Pkw'}
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
	</div>
{/if}
