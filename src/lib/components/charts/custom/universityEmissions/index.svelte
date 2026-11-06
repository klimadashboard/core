<script lang="ts">
	import { page } from '$app/state';
	import { Chart, AxisX, AxisY, BarStack, Tooltip } from '$lib/components/charts/primitives';
	import { Select, RadioGroup, Toggle } from '$lib/components/ui';
	import Switch from '$lib/components/Switch.svelte';
	import {
		IconBolt,
		IconCar,
		IconBuildingSkyscraper,
		IconPackage,
		IconToolsKitchen2,
		IconArrowUp,
		IconArrowDown,
		IconArrowRight,
		IconAdjustmentsHorizontal
	} from '@tabler/icons-svelte-runes';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		fetchUniversityData,
		buildChartData,
		availableYears,
		hasBothAccountings,
		matchesAccounting,
		yearTotal,
		categoryTotal,
		notReported,
		CATEGORIES,
		SUBCATEGORY_LABELS,
		ACCOUNTING_LABELS,
		SCOPE_LABELS,
		type AccountingType,
		type University,
		type EmissionRow
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let universities: University[] = [];
	let emissions: EmissionRow[] = [];
	let loading = true;
	let error: string | null = null;

	let selectedSlug = '';
	let selectedYear: number | null = null;
	let accounting: AccountingType = 'market_based';
	let containerWidth = 0;

	$: isMobile = containerWidth < 500;

	// ── Derived state: always exactly one university ──
	$: university = universities.find((u) => u.slug === selectedSlug) ?? null;
	$: rows = university ? emissions.filter((r) => r.university === university.id) : [];
	$: years = availableYears(rows);
	$: showAccountingSwitch = hasBothAccountings(rows);
	$: if (years.length && (selectedYear === null || !years.includes(selectedYear))) {
		selectedYear = years.at(-1) ?? null;
	}


	// Headline numbers for the selected year
	$: total = selectedYear !== null ? yearTotal(rows, selectedYear, accounting) : null;
	$: firstYear = years[0] ?? null;
	$: firstTotal = firstYear !== null ? yearTotal(rows, firstYear, accounting) : null;
	$: change =
		total !== null && firstTotal && selectedYear !== firstYear
			? (total - firstTotal) / firstTotal
			: null;
	$: headcount =
		university?.students != null && university?.staff != null
			? university.students + university.staff
			: null;
	$: perPerson = total !== null && headcount ? total / headcount : null;

	// Sub-sector breakdown: one bar per sub-category, optionally one per year
	// Position of a 20px icon centred in a stacked-bar segment
	const iconGeom = (xs: any, ys: any, label: string, seg: { y0: number; y1: number }, bw: number) => {
		const h = ys(seg.y0) - ys(seg.y1);
		return { h, x: (xs(label) ?? 0) + bw / 2 - 10, y: ys(seg.y1) + h / 2 - 10 };
	};
	let settingsOpen = false;
	function clickOutside(node: HTMLElement, cb: () => void) {
		const onClick = (e: MouseEvent) => !node.contains(e.target as Node) && cb();
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cb();
		document.addEventListener('click', onClick, true);
		document.addEventListener('keydown', onKey);
		return {
			destroy() {
				document.removeEventListener('click', onClick, true);
				document.removeEventListener('keydown', onKey);
			}
		};
	}
	let compareYears = false;
	let groupBy: 'category' | 'scope' = 'category';
	type Dir = 'up' | 'down' | 'flat';
	const ICONS: Record<string, any> = {
		energy: IconBolt,
		mobility: IconCar,
		construction: IconBuildingSkyscraper,
		materials: IconPackage,
		canteen: IconToolsKitchen2
	};
	const ARROW_ICONS = { up: IconArrowUp, down: IconArrowDown, flat: IconArrowRight };
	const SCOPE_HINTS: Record<number, string> = {
		1: 'Direkte Emissionen',
		2: 'Eingekaufte Energie',
		3: 'Indirekte Emissionen'
	};
	// Arrow shape carries the meaning; colour is only a secondary cue (increase = worse)
	const trendClass = (d: Dir) =>
		d === 'up'
			? 'text-red-700 dark:text-red-300'
			: d === 'down'
				? 'text-blue-700 dark:text-blue-300'
				: 'text-gray-600 dark:text-gray-300';

	/** Change between the first and the last year with data (independent of the selected year). */
	function trendOf(byYear: Array<[number, number | null]>) {
		const valid = byYear.filter(([, v]) => v !== null) as Array<[number, number]>;
		if (valid.length < 2) return null;
		const [fy, fv] = valid[0];
		const [ly, lv] = valid[valid.length - 1];
		if (!fv) return null;
		const pct = ((lv - fv) / fv) * 100;
		const dir: Dir = Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down';
		const text = `${pct > 0.5 ? '+' : pct < -0.5 ? '−' : ''}${formatNumber(Math.abs(pct), 0)} %`;
		const word = dir === 'up' ? 'gestiegen' : dir === 'down' ? 'gesunken' : 'unverändert';
		return { dir, label: `${word} (${text}) von ${fy} auf ${ly}` };
	}

	$: shownYears = compareYears ? years : selectedYear !== null ? [selectedYear] : [];

	// Flat list of sub-sectors (with values for every year), then grouped by category or scope
	$: subSectors = (() => {
		const detail = rows.filter((r) => r.category !== 'total' && matchesAccounting(r, accounting));
		const keys = [...new Set(detail.map((r) => `${r.category}|${r.subcategory}`))];
		return keys.map((k) => {
			const [category, key] = k.split('|');
			const own = detail.filter((r) => r.category === category && r.subcategory === key);
			const valueIn = (y: number) => {
				const r = own.find((r) => r.year === y);
				return r === undefined ? undefined : r.value;
			};
			return {
				category,
				key,
				scope: own.find((r) => r.scope)?.scope ?? null,
				type: own.find((r) => r.type)?.type ?? null,
				byYear: years.map((y) => [y, valueIn(y) ?? null] as [number, number | null]),
				bars: shownYears
					.filter((y) => valueIn(y) !== undefined)
					.map((y) => ({ year: y, value: valueIn(y) as number | null, selected: y === selectedYear })),
				sortValue: valueIn(selectedYear as number) ?? -1,
				trend: trendOf(years.map((y) => [y, valueIn(y) ?? null] as [number, number | null]))
			};
		}).filter((i) => i.bars.length > 0);
	})();

	$: breakdown = (() => {
		const defs =
			groupBy === 'category'
				? CATEGORIES.map((c) => ({
						key: c.key,
						label: c.label,
						color: c.color,
						icon: ICONS[c.key],
						hint: '',
						match: (i: (typeof subSectors)[number]) => i.category === c.key
					}))
				: [1, 2, 3, 0].map((sc) => ({
						key: `scope${sc}`,
						label: sc ? SCOPE_LABELS[sc] : 'Zuordnung offen',
						color: '#6b7280',
						icon: null,
						hint: sc ? SCOPE_HINTS[sc] : '',
						match: (i: (typeof subSectors)[number]) => (i.scope ?? 0) === sc
					}));
		return defs
			.map((d) => {
				const items = subSectors.filter(d.match).sort((a, b) => b.sortValue - a.sortValue);
				const sumAt = (y: number) =>
					items.reduce((sum, i) => sum + (i.byYear.find(([yy]) => yy === y)?.[1] ?? 0), 0);
				const hasAt = (y: number) => items.some((i) => i.byYear.find(([yy]) => yy === y)?.[1] != null);
				return {
					...d,
					items,
					total: sumAt(selectedYear as number),
					trend: trendOf(years.map((y) => [y, hasAt(y) ? sumAt(y) : null] as [number, number | null]))
				};
			})
			.filter((g) => g.items.length > 0);
	})();
	$: breakdownSum = breakdown.reduce((s, c) => s + c.total, 0);

	// Fixed scale: largest value of any year and any accounting method, so switching never rescales
	$: maxItemValue = Math.max(
		1,
		...rows.filter((r) => r.category !== 'total').map((r) => r.value ?? 0)
	);
	$: missing = selectedYear !== null ? notReported(rows, selectedYear) : [];

	// Hints: row notes + estimate warning for the selected year
	$: hints = [
		...new Set(
			rows
				.filter((r) => r.year === selectedYear && matchesAccounting(r, accounting) && r.note)
				.map((r) => r.note as string)
		)
	];
	$: hasEstimate = rows.some((r) => r.year === selectedYear && r.is_estimate);
	$: sourceLinks = [
		...new Map(
			rows
				.filter((r) => r.year === selectedYear && r.source_link)
				.map((r) => [r.source_link, r.source ?? new URL(r.source_link as string).hostname])
		)
	] as Array<[string, string]>;

	// Stacked bars over time
	$: stacked = years.map((y) => {
		let acc = 0;
		const segments = CATEGORIES.map((c) => {
			const value = categoryTotal(rows, y, c.key, accounting);
			const seg = { key: c.key, label: c.label, color: c.color, value, y0: acc, y1: acc + value };
			acc += value;
			return seg;
		}).filter((s) => s.value > 0);
		return { label: String(y), year: y, total: acc, segments };
	});
	$: yMax =
		Math.max(
			0,
			...(['location_based', 'market_based'] as AccountingType[]).flatMap((acc) =>
				years.map((y) => CATEGORIES.reduce((sum, c) => sum + categoryTotal(rows, y, c.key, acc), 0))
			)
		) * 1.08;
	$: legendItems = CATEGORIES.filter((c) =>
		stacked.some((s) => s.segments.some((seg) => seg.key === c.key))
	).map((c) => ({ key: c.key, label: c.label, color: c.color }));

	// Keep the Card's table download and the {{placeholders}} in its heading/text in sync with the selection
	$: if (university)
		onChartData?.(buildChartData(university, emissions, accounting, selectedYear));

	const formatT = (v: number) => `${formatNumber(v, 0)} t`;
	const share = (v: number) => (breakdownSum ? formatPercent((v / breakdownSum) * 100, 0) : '–');

	async function load() {
		try {
			const data = await fetchUniversityData(fetch);
			universities = data.universities;
			emissions = data.emissions;
			const wanted = page.url.searchParams.get('university');
			selectedSlug =
				universities.find((u) => u.slug === wanted)?.slug ?? universities[0]?.slug ?? '';
			if (!universities.length) onChartData?.(null);
		} catch (e) {
			console.error('[UniversityEmissions] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}
	load();
</script>

<div bind:clientWidth={containerWidth} class="flex flex-col gap-6">
	{#if loading}
		<div class="h-[400px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !university}
		<div class="h-[300px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{:else}
		<!-- Selection: one university at a time; year and accounting live in a settings dropdown -->
		<div class="flex items-end gap-3">
			<div class="min-w-0 flex-1 sm:max-w-sm">
				<Select
					label="Hochschule"
					bind:value={selectedSlug}
					small
					options={universities.map((u) => ({ value: u.slug, label: u.name }))}
				/>
			</div>
			{#if years.length > 1 || showAccountingSwitch}
				<div class="relative" use:clickOutside={() => (settingsOpen = false)}>
					<button
						type="button"
						class="flex h-9 items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
						aria-expanded={settingsOpen}
						aria-controls="ue-settings"
						on:click={() => (settingsOpen = !settingsOpen)}
					>
						<IconAdjustmentsHorizontal size={18} aria-hidden="true" />
						<span class="max-sm:sr-only">Einstellungen</span>
					</button>
					{#if settingsOpen}
						<div
							id="ue-settings"
							class="absolute right-0 top-full z-30 mt-2 flex w-72 max-w-[85vw] flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-lg"
						>
							{#if years.length > 1}
								<RadioGroup
									label="Bilanzjahr"
									bind:value={selectedYear}
									options={years.map((y) => ({ value: y, label: String(y) }))}
								/>
							{/if}
							{#if showAccountingSwitch}
								<RadioGroup
									label="Strombilanzierung"
									bind:value={accounting}
									options={(['market_based', 'location_based'] as AccountingType[]).map((k) => ({
										value: k,
										label: ACCOUNTING_LABELS[k]
									}))}
								/>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if years.length === 0}
			<div class="h-[200px] flex items-center justify-center text-gray-500">
				Für diese Hochschule liegen noch keine Emissionsdaten vor.
			</div>
		{:else}
			<!-- Key figures -->
			<dl class="grid grid-cols-3 gap-2 sm:gap-3">
				<div class="rounded-xl bg-gray-100 dark:bg-gray-800 p-2.5 sm:p-4">
					<dt class="text-xs sm:text-sm leading-tight text-gray-600 dark:text-gray-300">Emissionen {selectedYear}</dt>
					<dd class="text-lg sm:text-2xl font-semibold leading-tight mt-1">
						{total !== null ? formatNumber(total, 0) : '–'}
						<span class="text-xs sm:text-base font-normal">t CO₂e</span>
					</dd>
				</div>
				<div class="rounded-xl bg-gray-100 dark:bg-gray-800 p-2.5 sm:p-4">
					<dt class="text-xs sm:text-sm leading-tight text-gray-600 dark:text-gray-300">
						{change !== null ? `Veränderung seit ${firstYear}` : 'Veränderung'}
					</dt>
					<dd class="text-lg sm:text-2xl font-semibold leading-tight mt-1">
						{#if change !== null}
							{change > 0 ? '+' : change < 0 ? '−' : ''}{formatPercent(Math.abs(change) * 100, 0)}
						{:else}
							–
						{/if}
					</dd>
				</div>
				<div class="rounded-xl bg-gray-100 dark:bg-gray-800 p-2.5 sm:p-4">
					<dt class="text-xs sm:text-sm leading-tight text-gray-600 dark:text-gray-300">Pro Person</dt>
					<dd class="text-lg sm:text-2xl font-semibold leading-tight mt-1">
						{perPerson !== null ? formatNumber(perPerson, 2) : '–'}
						<span class="text-xs sm:text-base font-normal">t CO₂e</span>
					</dd>
				</div>
			</dl>

			{#if university.students != null || university.staff != null || university.description}
				<div class="text-sm flex flex-col gap-1">
					{#if university.students != null || university.staff != null}
						<p class="text-gray-600 dark:text-gray-300">
							{[
								university.students != null
									? `${formatNumber(university.students, 0)} prüfungsaktive Studierende`
									: null,
								university.staff != null ? `${formatNumber(university.staff, 0)} Mitarbeitende` : null
							]
								.filter(Boolean)
								.join(' · ')}{university.headcount_year ? ` (${university.headcount_year})` : ''}
						</p>
					{/if}
					{#if university.description}
						<p class="max-w-prose">{university.description}</p>
					{/if}
				</div>
			{/if}

			{#if hasEstimate}
				<p
					class="rounded-xl border border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 p-3 text-sm"
					role="note"
				>
					Die Werte für {selectedYear} sind Platzhalter und noch nicht aus einer Quelle belegt.
				</p>
			{/if}

			<!-- Development over time -->
			<section class="flex flex-col gap-2" aria-labelledby="ue-trend">
				<h4 id="ue-trend" class="font-semibold">Entwicklung der Emissionen (t CO₂e)</h4>
				<ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
					{#each legendItems as item (item.key)}
						<li class="flex items-center gap-1.5">
							<span
								class="flex h-5 w-5 items-center justify-center rounded-full"
								style="background-color: {item.color}"
								aria-hidden="true"
							>
								<svelte:component this={ICONS[item.key]} size={12} color="white" />
							</span>
							{item.label}
						</li>
					{/each}
				</ul>
				<Chart
					data={stacked}
					x="label"
					y="total"
					xType="band"
					height={300}
					yMin={0}
					{yMax}
					padding={0.35}
					margin={{ top: 15, right: isMobile ? 10 : 20, bottom: 35, left: isMobile ? 50 : 65 }}
				>
					<svelte:fragment
						slot="default"
						let:xScale
						let:yScale
						let:xDomain
						let:innerWidth
						let:innerHeight
						let:hover
						let:bandwidth
					>
						<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
						<BarStack data={stacked} x="label" {xScale} {yScale} {hover} radius={2} />
							{#each stacked as bar (bar.label)}
								{#each bar.segments as seg (seg.key)}
									{@const g = iconGeom(xScale, yScale, bar.label, seg, bandwidth)}
									{#if g.h >= 24 && bandwidth >= 24}
										<svelte:component
											this={ICONS[seg.key]}
											x={g.x}
											y={g.y}
											size={20}
											color="white"
											style="pointer-events: none"
											aria-hidden="true"
										/>
									{/if}
								{/each}
							{/each}
						<AxisY
							mode="labels"
							{yScale}
							{innerWidth}
							{innerHeight}
							format={(v) => formatNumber(v, 0)}
							unit=""
						/>
						<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={String} />
					</svelte:fragment>

					<svelte:fragment slot="tooltip" let:hover>
						{#if hover.x !== null}
							{@const bar = stacked.find((s) => s.label === hover.x)}
							{#if bar}
								{@const reported = yearTotal(rows, bar.year, accounting)}
								<Tooltip
									visible
									x={hover.clientX}
									y={hover.clientY}
									title={bar.label}
									items={[
										...bar.segments.map((s) => ({
											label: s.label,
											value: formatT(s.value),
											color: s.color
										})),
										{
											label: 'Summe laut Hochschule',
											value: reported !== null ? formatT(reported) : '–'
										}
									]}
								/>
							{/if}
						{/if}
					</svelte:fragment>
				</Chart>
			</section>

			<!-- Breakdown by sub-sector -->
			<section class="flex flex-col gap-4" aria-labelledby="ue-breakdown">
				<h4 id="ue-breakdown" class="font-semibold">Woher die Emissionen {selectedYear} kommen (t CO₂e)</h4>
				<div class="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
					<Switch
						label="Gruppierung"
						views={[
							{ key: 'category', label: 'Sektor' },
							{ key: 'scope', label: 'Scope' }
						]}
						activeView={groupBy}
						on:itemClick={(e) => (groupBy = e.detail)}
					/>
					{#if years.length > 1}
						<Toggle label="Andere Jahre vergleichen" bind:checked={compareYears} />
					{/if}
				</div>

				{#each breakdown as cat (cat.key)}
					<div>
						<div
							class="flex items-center justify-between gap-4 text-sm font-semibold border-b border-gray-300 dark:border-gray-600 pb-1.5"
						>
							<span class="flex items-center gap-2">
								{#if cat.icon}
									<span
										class="flex h-7 w-7 items-center justify-center rounded-full"
										style="background-color: {cat.color}"
										aria-hidden="true"
									>
										<svelte:component this={cat.icon} size={18} color="white" />
									</span>
								{/if}
								{cat.label}
								{#if cat.hint}
									<span class="font-normal text-gray-600 dark:text-gray-300">· {cat.hint}</span>
								{/if}
							</span>
							<span class="flex items-center gap-1 tabular-nums">
								{formatT(cat.total)} · {share(cat.total)}
								{#if cat.trend}
									<span class={trendClass(cat.trend.dir)} title={cat.trend.label}>
										<svelte:component this={ARROW_ICONS[cat.trend.dir]} size={16} stroke={2.5} aria-hidden="true" />
										<span class="sr-only">{cat.trend.label}</span>
									</span>
								{/if}
							</span>
						</div>
						<ul class="mt-3 flex flex-col gap-3 text-sm">
							{#each cat.items as item (item.category + item.key)}
								{@const color = CATEGORIES.find((c) => c.key === item.category)?.color ?? '#6b7280'}
								<li class="flex flex-col gap-0.5">
									{#each item.bars as bar, i (bar.year)}
										<div
											class="grid grid-cols-[minmax(0,1fr)_6rem] sm:grid-cols-[11rem_minmax(0,1fr)_7rem] items-center gap-x-3 gap-y-0.5 {bar.selected
												? ''
												: 'opacity-45'}"
										>
											<span class="col-span-2 sm:col-span-1 leading-tight {i === 0 ? '' : 'sm:invisible max-sm:hidden'}">
												{#if i === 0}
													{#if groupBy === 'scope'}
														<svelte:component this={ICONS[item.category]} size={14} color={color} class="inline -mt-0.5 mr-0.5" aria-hidden="true" />
													{/if}
													{SUBCATEGORY_LABELS[item.key] ?? item.key}
													{#if item.type}
														<span class="text-xs text-gray-600 dark:text-gray-300">({ACCOUNTING_LABELS[item.type].toLowerCase()})</span>
													{/if}
												{/if}
											</span>
											<span
												class="{bar.selected ? 'h-6' : 'h-4'} rounded bg-gray-100 dark:bg-gray-800 overflow-hidden"
												aria-hidden="true"
											>
												{#if bar.value !== null && bar.value > 0}
													<span
														class="block h-full rounded"
														style="width: max(2px, {(bar.value / maxItemValue) * 100}%); background-color: {color}"
													></span>
												{/if}
											</span>
											<span class="flex items-center justify-end gap-1 tabular-nums {bar.selected ? 'font-semibold' : 'text-xs'}">
												{#if compareYears}
													<span class="font-normal text-xs text-gray-600 dark:text-gray-300">{bar.year}</span>
												{/if}
												{#if bar.value !== null}
													{formatNumber(bar.value, 0)}
												{:else}
													<span class="text-gray-500 dark:text-gray-400 text-xs font-normal">nicht berichtet</span>
												{/if}
												{#if bar.selected && item.trend}
													<span class={trendClass(item.trend.dir)} title={item.trend.label}>
														<svelte:component this={ARROW_ICONS[item.trend.dir]} size={16} stroke={2.5} aria-hidden="true" />
														<span class="sr-only">{item.trend.label}</span>
													</span>
												{:else}
													<span class="w-4" aria-hidden="true"></span>
												{/if}
											</span>
									</div>
									{/each}
								</li>
							{/each}
						</ul>
					</div>
				{/each}

				{#if missing.length}
					<p class="text-sm text-gray-600 dark:text-gray-300">
						Nicht berichtet: {missing
							.map((r) => SUBCATEGORY_LABELS[r.subcategory] ?? r.subcategory)
							.join(', ')}. Diese Bereiche sind in der Summe nicht enthalten.
					</p>
				{/if}
			</section>

			<!-- Hints -->
			{#if hints.length}
				<section aria-labelledby="ue-hints" class="text-sm">
					<h4 id="ue-hints" class="font-semibold mb-1">Hinweise</h4>
					<ul class="list-disc pl-5 space-y-1">
						{#each hints as hint}<li>{hint}</li>{/each}
					</ul>
				</section>
			{/if}
		{/if}

		<!-- University specific context -->
		{#if university.challenges?.length}
			<section aria-labelledby="ue-challenges">
				<h4 id="ue-challenges" class="font-semibold mb-2">Besondere Herausforderungen</h4>
				<ul class="list-disc pl-5 space-y-1">
					{#each university.challenges as challenge}<li>{challenge}</li>{/each}
				</ul>
			</section>
		{/if}

		{#if university.faq?.length}
			<section aria-labelledby="ue-faq" class="flex flex-col gap-2">
				<h4 id="ue-faq" class="font-semibold">Häufige Fragen</h4>
				{#each university.faq as item}
					<details class="rounded-xl bg-gray-100 dark:bg-gray-800 p-3">
						<summary class="cursor-pointer font-semibold">{item.question}</summary>
						<p class="mt-2 text-sm">{item.answer ?? 'Antwort folgt.'}</p>
					</details>
				{/each}
			</section>
		{/if}

		<!-- Links -->
		<div class="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
			{#if university.website || university.sustainability_url}
				<p class="flex flex-wrap gap-x-4">
					{#if university.website}
						<a class="underline" href={university.website} target="_blank" rel="noopener noreferrer"
							>Website der Hochschule</a
						>
					{/if}
					{#if university.sustainability_url}
						<a
							class="underline"
							href={university.sustainability_url}
							target="_blank"
							rel="noopener noreferrer">Treibhausgasbilanz der Hochschule</a
						>
					{/if}
				</p>
			{/if}
			{#if sourceLinks.length}
				<p>
					Quelle:
					{#each sourceLinks as [href, label], i}
						{i ? ', ' : ''}<a class="underline" {href} target="_blank" rel="noopener noreferrer"
							>{label}</a
						>
					{/each}
				</p>
			{/if}
		</div>
	{/if}
</div>
