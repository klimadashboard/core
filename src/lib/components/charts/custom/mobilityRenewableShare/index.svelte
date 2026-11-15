<script lang="ts">
	import { Chart, AxisX, AxisY, Line, Area, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import { formatNumber } from '$lib/utils/formatters';
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { onMount } from 'svelte';
	import CountryPicker from './CountryPicker.svelte';
	import { pivotByYear, latestPoint, type MobilityRow, type Country, type YearRow } from './transformData';
	import { HOME_COLOR, FOSSIL_COLOR, COMPARE_STYLES, MAX_COMPARE, EU_TARGET } from './constants';
	import type { ChartData } from '../../types';

	export let chart: any = undefined;
	export let region: any = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	chart;
	region; // country comparison, not region-specific

	const homeId = /^[a-z]{2}$/i.test(PUBLIC_VERSION ?? '') ? PUBLIC_VERSION.toUpperCase() : 'DE';

	let loading = true;
	let error: Error | null = null;
	let rawRows: MobilityRow[] = [];
	let countryNames: Record<string, string> = {};
	let options: { id: string; name: string }[] = [];

	// UI state
	let view: 'share' | 'values' = 'share';
	let selected: string[] = []; // comparison countries (home country is always shown)
	let clientWidth = 0;

	onMount(async () => {
		try {
			const directus = getDirectusInstance();
			const [mobilityData, countriesData] = await Promise.all([
				directus.request(
					readItems('mobility', {
						filter: { category: { _eq: 'share_renewable' } },
						fields: ['period', 'region', 'value'],
						limit: -1
					})
				),
				directus.request(readItems('countries', { fields: ['id', 'name_de'], limit: -1 }))
			]);
			rawRows = mobilityData as MobilityRow[];
			const withData = new Set(rawRows.map((r) => r.region));
			for (const c of countriesData as Country[]) {
				if (withData.has(c.id)) countryNames[c.id] = c.name_de ?? c.id;
			}
			options = Object.entries(countryNames)
				.filter(([id]) => id !== homeId)
				.map(([id, name]) => ({ id, name }))
				.sort((a, b) => a.name.localeCompare(b.name, 'de'));
		} catch (e) {
			error = e as Error;
		} finally {
			loading = false;
		}
	});

	// Stable style per comparison country: keeps its colour/dash while others are added or removed
	let slots: Record<string, number> = {};
	$: {
		const next: Record<string, number> = {};
		const used = new Set<number>();
		for (const id of selected) {
			if (slots[id] != null) {
				next[id] = slots[id];
				used.add(slots[id]);
			}
		}
		for (const id of selected) {
			if (next[id] == null) {
				let i = 0;
				while (used.has(i)) i++;
				next[id] = i;
				used.add(i);
			}
		}
		slots = next;
	}
	$: styleFor = (id: string) => COMPARE_STYLES[(slots[id] ?? 0) % COMPARE_STYLES.length];

	$: series = [
		{ id: homeId, name: countryNames[homeId] ?? homeId, color: HOME_COLOR, dash: null as string | null, width: 3.5 },
		...selected.map((id) => ({ id, name: countryNames[id] ?? id, ...styleFor(id), width: 2 }))
	];
	$: seriesIds = series.map((s) => s.id);
	$: rows = pivotByYear(rawRows, seriesIds).map((r) => ({ ...r, _top: 100 })) as (YearRow & { _top: number })[];

	// Single country in 100 % view: renewable vs. fossil as stacked areas
	$: stacked = view === 'share' && selected.length === 0;

	$: maxValue = Math.max(0, ...rows.flatMap((r) => seriesIds.map((id) => r[id] ?? 0)));
	// values view: keep the EU target line visible
	$: yMax = view === 'share' ? 100 : Math.ceil((Math.max(maxValue, EU_TARGET.value) * 1.1) / 5) * 5;

	// Responsive: end-of-line labels need room on the right
	$: narrow = clientWidth > 0 && clientWidth < 500;
	$: showEndLabels = !narrow && !stacked;
	$: margin = {
		top: 15,
		right: showEndLabels ? 120 : narrow ? 10 : 20,
		bottom: 35,
		left: narrow ? 35 : 45
	};

	$: homeLatest = latestPoint(rows, homeId);

	function endLabels(yScale: (v: number) => number) {
		const labels = series
			.map((s) => {
				const p = latestPoint(rows, s.id);
				return p ? { ...s, year: p.year, value: p.value, y: yScale(p.value) } : null;
			})
			.filter((l): l is NonNullable<typeof l> => l !== null)
			.sort((a, b) => a.y - b.y);
		// push overlapping labels apart (min. 14 px)
		for (let i = 1; i < labels.length; i++) {
			if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
		}
		return labels;
	}

	const fmt = (v: number | null | undefined) => (v == null ? '–' : `${formatNumber(v, 1)} %`);

	// card: table of the shown countries, placeholders for the CMS text, legal basis of the target
	$: if (rows.length && onChartData) {
		const cell = (v: any) => (typeof v === 'number' ? formatNumber(v, 1) : '–');
		onChartData({
			raw: rows,
			table: {
				columns: [
					{ key: 'year', label: 'Jahr', align: 'left' },
					...series.map((s) => ({ key: s.id, label: `${s.name} (%)`, align: 'right' as const, format: cell }))
				],
				rows,
				filename: 'erneuerbare_im_verkehr'
			},
			placeholders: {
				latestYear: homeLatest ? String(homeLatest.year) : '',
				latestValue: homeLatest ? formatNumber(homeLatest.value, 1) : '',
				target: String(EU_TARGET.value)
			},
			meta: {
				source: 'Eurostat SHARES',
				note: `EU-Ziel: mindestens ${EU_TARGET.value} % erneuerbare Energie im Verkehr bis ${EU_TARGET.year} – ${EU_TARGET.legalBasis}.`
			}
		});
	}
</script>

<div class="w-full" bind:clientWidth>
	{#if loading}
		<div class="h-[400px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[400px] flex items-center justify-center text-red-500">
			Fehler beim Laden der Daten: {error.message}
		</div>
	{:else if !rows.length}
		<div class="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
			Keine Daten verfügbar
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#if homeLatest}
				<p class="text-sm text-gray-600 dark:text-gray-400">
					{countryNames[homeId] ?? homeId}
					{homeLatest.year}:
					<strong class="text-gray-900 dark:text-white">{fmt(homeLatest.value)}</strong>
					erneuerbarer Anteil am Energieverbrauch im Verkehr
				</p>
			{/if}

			<div class="flex flex-wrap items-start justify-between gap-3">
				<CountryPicker
					{options}
					bind:selected
					home={{ id: homeId, name: countryNames[homeId] ?? homeId, color: HOME_COLOR }}
					{styleFor}
					max={MAX_COMPARE}
				/>
				<RadioGroup
					label="Ansicht"
					hideLabel
					bind:value={view}
					options={[
						{ value: 'share', label: '100 %' },
						{ value: 'values', label: 'Werte' }
					]}
				/>
			</div>

			{#if stacked}
				<Legend
					items={[
						{ key: 'renewable', label: 'Erneuerbar', color: HOME_COLOR },
						{ key: 'fossil', label: 'Fossil / nicht erneuerbar', color: FOSSIL_COLOR }
					]}
				/>
			{/if}

			<Chart data={rows} x="year" y={seriesIds} height={360} yMin={0} {yMax} {margin}>
				<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
					<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
					<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={(v) => String(v)} tickCount={6} />

					{#if stacked}
						<Area data={rows} x="year" y0Field={homeId} y1Field="_top" color={FOSSIL_COLOR} opacity={0.35} curve="linear" {xScale} {yScale} />
						<Area data={rows} x="year" y={homeId} color={HOME_COLOR} opacity={0.45} curve="linear" {xScale} {yScale} />
					{/if}

					<!-- comparison countries first, home country on top -->
					{#each [...series].reverse() as s (s.id)}
						<Line
							data={rows}
							x="year"
							y={s.id}
							{xScale}
							{yScale}
							stroke={s.color}
							strokeWidth={s.width}
							strokeDasharray={s.dash}
							dots={s.id === homeId}
							dotRadius={2.5}
							{hover}
						/>
					{/each}

					<!-- EU target -->
					<line
						x1="0"
						x2={innerWidth}
						y1={yScale(EU_TARGET.value)}
						y2={yScale(EU_TARGET.value)}
						stroke="currentColor"
						stroke-width="1.5"
						stroke-dasharray="6 4"
						class="text-gray-700 dark:text-gray-300"
					/>
					<text
						x={8}
						y={yScale(EU_TARGET.value) - 6}
						class="text-xs font-semibold fill-gray-700 dark:fill-gray-300 stroke-white dark:stroke-gray-900"
						stroke-width="3"
						paint-order="stroke"
					>
						EU-Ziel {EU_TARGET.year}: {EU_TARGET.value} %
					</text>

					{#if showEndLabels}
						{#each endLabels(yScale) as l (l.id)}
							<text
								x={innerWidth + 8}
								y={l.y}
								dy="0.32em"
								class="text-xs {l.id === homeId ? 'font-bold' : ''}"
								fill={l.color}
							>
								{l.name} {formatNumber(l.value, 1)} %
							</text>
						{/each}
					{/if}

					<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} unit="%" />
				</svelte:fragment>

				<svelte:fragment slot="tooltip" let:hover>
					{#if hover.x !== null}
						{@const pt = rows.find((d) => d.year === hover.x)}
						{#if pt}
							<Tooltip
								visible
								x={hover.clientX}
								y={hover.clientY}
								title={String(pt.year)}
								items={stacked
									? [
											{ label: 'Erneuerbar', value: fmt(pt[homeId]), color: HOME_COLOR },
											{
												label: 'Fossil / nicht erneuerbar',
												value: pt[homeId] == null ? '–' : fmt(100 - (pt[homeId] ?? 0)),
												color: FOSSIL_COLOR
											}
										]
									: series
											.filter((s) => pt[s.id] != null)
											.sort((a, b) => (pt[b.id] ?? 0) - (pt[a.id] ?? 0))
											.map((s) => ({ label: s.name, value: fmt(pt[s.id]), color: s.color }))}
							/>
						{/if}
					{/if}
				</svelte:fragment>
			</Chart>
		</div>
	{/if}
</div>
