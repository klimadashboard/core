<script lang="ts">
	import { page } from '$app/state';
	import { Chart, AxisX, AxisY, BarStack, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { Select, RadioGroup } from '$lib/components/ui';
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
		scopeTotals,
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
	let accounting: AccountingType = 'location_based';
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
	$: yearRows = rows.filter(
		(r) => r.year === selectedYear && r.category !== 'total' && matchesAccounting(r, accounting)
	);

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

	// Category breakdown for the selected year
	$: breakdown = CATEGORIES.map((c) => {
		const items = yearRows
			.filter((r) => r.category === c.key)
			.sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
		return {
			...c,
			total: items.reduce((s, r) => s + (r.value ?? 0), 0),
			items
		};
	}).filter((c) => c.items.length > 0);
	$: breakdownSum = breakdown.reduce((s, c) => s + c.total, 0);
	$: maxItemValue = Math.max(1, ...yearRows.map((r) => r.value ?? 0));
	$: scopes = selectedYear !== null ? scopeTotals(rows, selectedYear, accounting) : null;
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
	$: yMax = Math.max(0, ...stacked.map((s) => s.total)) * 1.08;
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
		<!-- Selection: one university at a time, all controls in a single row -->
		<div class="flex flex-wrap items-end gap-x-5 gap-y-2">
			<div class="w-full sm:w-64">
				<Select
					label="Hochschule"
					bind:value={selectedSlug}
					small
					options={universities.map((u) => ({ value: u.slug, label: u.name }))}
				/>
			</div>
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
					options={(Object.keys(ACCOUNTING_LABELS) as AccountingType[]).map((k) => ({
						value: k,
						label: ACCOUNTING_LABELS[k]
					}))}
				/>
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
				<Legend items={legendItems} />
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
					>
						<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
						<BarStack data={stacked} x="label" {xScale} {yScale} {hover} radius={2} />
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

			<!-- Breakdown for the selected year -->
			<section class="flex flex-col gap-4" aria-labelledby="ue-breakdown">
				<h4 id="ue-breakdown" class="font-semibold">Woher die Emissionen {selectedYear} kommen</h4>

				{#each breakdown as cat (cat.key)}
					<div>
						<div class="flex items-baseline justify-between gap-4 text-sm font-semibold">
							<span class="flex items-center gap-2">
								<span
									class="inline-block h-3 w-3 rounded-sm"
									style="background-color: {cat.color}"
									aria-hidden="true"
								></span>
								{cat.label}
							</span>
							<span>{formatT(cat.total)} · {share(cat.total)}</span>
						</div>
						<div
							class="mt-1 h-2.5 w-full rounded bg-gray-100 dark:bg-gray-800 overflow-hidden"
							aria-hidden="true"
						>
							<div
								class="h-full rounded"
								style="width: {breakdownSum ? (cat.total / breakdownSum) * 100 : 0}%; background-color: {cat.color}"
							></div>
						</div>
						<ul class="mt-2 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
							{#each cat.items as item (item.id)}
								<!-- Bars share one scale (largest source of the year) so they compare across categories -->
								<li
									class="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_5.5rem] items-center gap-x-4 gap-y-1 py-1.5"
								>
									<span>
										{SUBCATEGORY_LABELS[item.subcategory] ?? item.subcategory}
										{#if item.scope}
											<span
												class="ml-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
												>{SCOPE_LABELS[item.scope]}</span
											>
										{/if}
									</span>
									<span
										class="order-last sm:order-none col-span-2 sm:col-span-1 h-1.5 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden {item.value ===
										null
											? 'invisible'
											: ''}"
										aria-hidden="true"
									>
										{#if item.value !== null && item.value > 0}
											<span
												class="block h-full rounded"
												style="width: max(2px, {(item.value / maxItemValue) * 100}%); background-color: {cat.color}"
											></span>
										{/if}
									</span>
									<span class="tabular-nums text-right">
										{#if item.value !== null}
											{formatT(item.value)}
										{:else}
											<span class="text-gray-500 dark:text-gray-400">nicht berichtet</span>
										{/if}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}

				{#if scopes}
					<div class="rounded-xl bg-gray-100 dark:bg-gray-800 p-4 text-sm">
						<p class="font-semibold mb-1">Nach Scope</p>
						<ul class="flex flex-wrap gap-x-6 gap-y-1">
							{#each [1, 2, 3] as s}
								<li>{SCOPE_LABELS[s]}: <b>{formatT(scopes.totals[s])}</b></li>
							{/each}
							{#if scopes.unassigned > 0}
								<li>Zuordnung offen: <b>{formatT(scopes.unassigned)}</b></li>
							{/if}
						</ul>
					</div>
				{/if}

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
