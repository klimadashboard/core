<script lang="ts">
	import { onMount } from 'svelte';
	import { scaleBand, scaleLinear } from 'd3-scale';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { Tooltip } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import { detectHotspots } from '../tramParking/hotspots';
	import type { Incident } from '../tramParking/hotspots';
	import dayjs from 'dayjs';

	export const region = null;
	export let onChartData: ((data: unknown) => void) | undefined = undefined;

	let loading = true;
	let error: string | null = null;
	let incidents: Incident[] = [];
	let view = 'lines';
	let containerWidth = 0;
	let containerEl: HTMLDivElement;
	let hoverLabel: string | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	const VIEW_OPTIONS = [
		{ value: 'lines', label: 'Linien' },
		{ value: 'hotspots', label: 'Hotspots' },
		{ value: 'districts', label: 'Bezirke' }
	];

	const VIEW_NOTES: Record<string, string> = {
		lines: 'Für jeden Vorfall wird die betroffene Linie dokumentiert. Diese Auswertung umfasst daher alle verfügbaren Daten – ohne Datenverlust durch fehlende Adressen.',
		districts:
			'Nur bei 56\u202f% der Vorfälle (2025) konnte ein Bezirk ermittelt werden – 2016 waren es noch 88\u202f%. Die übrigen Fälle fehlen in dieser Auswertung.',
		hotspots:
			'Nur bei 48\u202f% der Vorfälle (2025) wurde eine vollständige Adresse mit Hausnummer erfasst. Die Auswertung zeigt, welche Straßen besonders häufig betroffen sind. Längere Straßen haben naturgemäß mehr Haltestellen und können daher mehr Vorfälle aufweisen.'
	};

	const COUNT_COLOR = '#e11d48';
	const WAIT_COLOR = '#f97316';

	function incidentWaitingHours(inc: Incident) {
		const end = inc.date_fix ?? inc.date_end;
		if (!end || !inc.date_start) return null;
		const diff = dayjs(end).diff(dayjs(inc.date_start), 'minute');
		return diff > 0 ? diff / 60 : null;
	}

	function tooltipTitle(label: string) {
		if (view === 'districts') return `${label}. Bezirk`;
		if (view === 'lines') return `Linie ${label}`;
		return label;
	}

	$: aggregated = (() => {
		if (!incidents.length) return [];

		if (view === 'hotspots') {
			const geocoded = incidents.filter((i) => i.lat != null && i.lon != null);
			const hotspots = detectHotspots(geocoded);
			return hotspots.slice(0, 10).map((hs) => ({
				label: hs.label,
				count: hs.count,
				waitingHours: hs.incidents.reduce((sum, inc) => {
					const wh = incidentWaitingHours(inc);
					return wh != null ? sum + wh : sum;
				}, 0)
			}));
		}

		const groups = new Map();

		for (const inc of incidents) {
			let keys;
			if (view === 'lines') {
				keys = inc.lines
					? inc.lines
							.split(',')
							.map((l) => l.trim())
							.filter(Boolean)
					: ['Unbekannt'];
			} else {
				if (inc.district == null) continue;
				keys = [String(inc.district)];
			}

			const wh = incidentWaitingHours(inc);

			for (const key of keys) {
				if (!groups.has(key)) {
					groups.set(key, { label: key, count: 0, totalWaiting: 0, hasWaiting: false });
				}
				const g = groups.get(key);
				g.count++;
				if (wh !== null) {
					g.totalWaiting += wh;
					g.hasWaiting = true;
				}
			}
		}

		let rows = [...groups.values()];

		if (view === 'districts') {
			rows.sort((a, b) => Number(a.label) - Number(b.label));
		} else {
			rows.sort((a, b) => b.count - a.count);
			rows = rows.slice(0, 10);
		}

		return rows.map((r) => ({
			label: r.label,
			count: r.count,
			waitingHours: r.hasWaiting ? r.totalWaiting : 0
		}));
	})();

	// Reset hover when view changes
	$: if (view) hoverLabel = null;

	// Layout
	$: leftMargin = view === 'hotspots' ? 215 : 170;
	$: margin = { top: 28, right: 15, bottom: 28, left: leftMargin };
	$: innerWidth = Math.max(0, containerWidth - margin.left - margin.right);
	$: bandStep = view === 'districts' ? 52 : 62;
	$: innerHeight = aggregated.length > 0 ? aggregated.length * bandStep : 0;
	$: chartHeight = innerHeight + margin.top + margin.bottom;

	$: yScale =
		aggregated.length > 0 && innerHeight > 0
			? scaleBand()
					.domain(aggregated.map((d) => d.label))
					.range([0, innerHeight])
					.padding(0.22)
			: null;

	$: maxCount = Math.max(1, ...aggregated.map((d) => d.count));
	$: xScale =
		innerWidth > 0 ? scaleLinear().domain([0, maxCount]).range([0, innerWidth]).nice() : null;

	$: maxWaiting = Math.max(1, ...aggregated.map((d) => d.waitingHours));
	$: xScaleWait =
		innerWidth > 0 ? scaleLinear().domain([0, maxWaiting]).range([0, innerWidth]).nice() : null;

	$: yLabelFormat =
		view === 'districts'
			? (v: string) => `${v}.`
			: view === 'lines'
				? (v: string) => `Linie ${v}`
				: (v: string) => v;

	function fmtWait(h: number): string {
		if (h <= 0) return '–';
		if (h < 1) return `${Math.round(h * 60)} Minuten Wartezeit`;
		return `${Math.round(h)} Stunden Wartezeit`;
	}

	$: hoveredItem = hoverLabel ? (aggregated.find((d) => d.label === hoverLabel) ?? null) : null;

	// Dot + bar layout derived from bandwidth
	$: bw = yScale ? yScale.bandwidth() : 0;
	$: dotAreaH = Math.floor(bw * 0.65);
	$: barH = Math.max(4, Math.floor(bw * 0.25));
	$: dotBarGap = 4;
	$: rowH = dotAreaH / 3;
	$: dotR = Math.max(1.5, rowH * 0.4);
	$: dotStep = Math.max(5, rowH);

	// Pre-compute dot positions; remainder column may have 1 or 2 dots
	$: dotRows = (xScale && xScaleWait && yScale)
		? aggregated.map((d) => {
				const filledW = xScale!(d.count) ?? 0;
				const totalDots = Math.round((filledW / dotStep) * 3);
				const numFullCols = Math.floor(totalDots / 3);
				const remainder = totalDots % 3;
				const dots: { cx: number; cy: number }[] = [];
				for (let col = 0; col < numFullCols; col++) {
					for (let row = 0; row < 3; row++) {
						dots.push({ cx: col * dotStep + dotStep / 2, cy: row * rowH + rowH / 2 });
					}
				}
				if (remainder > 0) {
					for (let row = 0; row < remainder; row++) {
						dots.push({
							cx: numFullCols * dotStep + dotStep / 2,
							cy: row * rowH + rowH / 2
						});
					}
				}
				return {
					label: d.label,
					bandY: yScale!(d.label) ?? 0,
					dots,
					countLabel: `${d.count} Vorfälle`,
					barWidth: xScaleWait!(d.waitingHours) ?? 0,
					waitLabel: fmtWait(d.waitingHours)
				};
			})
		: [];

	function handleMouseMove(e: MouseEvent) {
		if (!containerEl || !yScale) return;
		const rect = containerEl.getBoundingClientRect();
		const mouseY = e.clientY - rect.top - margin.top;

		let found = null;
		for (const d of aggregated) {
			const y0 = yScale(d.label) ?? 0;
			const y1 = y0 + yScale.bandwidth();
			if (mouseY >= y0 - 3 && mouseY <= y1 + 3) {
				found = d.label;
				break;
			}
		}
		hoverLabel = found;
		hoverClientX = e.clientX;
		hoverClientY = e.clientY;
	}

	function handleMouseLeave() {
		hoverLabel = null;
	}

	onMount(async () => {
		try {
			const directus = getDirectusInstance(fetch);
			let all: Incident[] = [];
			let page = 1;
			while (true) {
				const items = await directus.request(
					readItems('mobility_tram_parking', {
						limit: 5000,
						page,
						fields: [
							'id',
							'date_start',
							'date_fix',
							'date_end',
							'lines',
							'address',
							'address_category',
							'lat',
							'lon',
							'district'
						],
						filter: {
							date_start: {
								_gte: '2025-01-01',
								_lt: '2026-01-01'
							}
						},
						sort: ['-date_start']
					})
				);
				all = all.concat(items as Incident[]);
				if (items.length < 5000) break;
				page++;
			}
			incidents = all;
			loading = false;

			if (onChartData) {
				onChartData({
					raw: all,
					placeholders: { total: all.length },
					meta: { source: 'Wiener Linien Störungsmeldungen | f59.at' },
					hasData: true
				});
			}
		} catch (e) {
			console.error('tramParkingChart error:', e);
			error = e instanceof Error ? e.message : String(e);
			loading = false;
			if (onChartData) onChartData(null);
		}
	});
</script>

{#if loading}
	<div class="h-[350px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[350px] flex items-center justify-center text-red-500">{error}</div>
{:else if !incidents.length}
	<div class="h-[350px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
{:else}
	<div class="flex flex-wrap justify-between items-center gap-2 mb-3">
		<RadioGroup label="Ansicht" bind:value={view} options={VIEW_OPTIONS} inline hideLabel />
		<div class="flex gap-4 text-xs">
			<span style="color:{COUNT_COLOR}">● Vorfälle</span>
			<span style="color:{WAIT_COLOR}">— Wartezeit</span>
		</div>
	</div>

	<div bind:clientWidth={containerWidth} bind:this={containerEl}>
		{#if containerWidth > 0 && yScale && xScale && xScaleWait}
			<svg width={containerWidth} height={chartHeight} class="overflow-visible">
				<g transform="translate({margin.left},{margin.top})">
					<!-- Dots for count (3 rows, remainder column may have 1–2 dots) -->
					{#each dotRows as dp}
						{#each dp.dots as dot}
							<circle
								cx={dot.cx}
								cy={dp.bandY + dot.cy}
								r={dotR}
								fill={COUNT_COLOR}
								opacity={hoverLabel === dp.label ? 1 : 0.8}
							/>
						{/each}
					{/each}

					<!-- Average wait bar (pill-shaped: rounded right end) -->
					{#each dotRows as dp}
						{@const by = dp.bandY + dotAreaH + dotBarGap}
						{@const bw2 = dp.barWidth}
						{@const r2 = barH / 2}
						{#if bw2 > 0}
							<path
								d="M 0,{by} H {Math.max(0, bw2 - r2)} A {r2},{r2} 0 0 1 {bw2},{by + r2} V {by + barH - r2} A {r2},{r2} 0 0 1 {Math.max(0, bw2 - r2)},{by + barH} H 0 Z"
								fill={WAIT_COLOR}
								opacity={hoverLabel === dp.label ? 0.9 : 0.65}
							/>
						{/if}
					{/each}

					<!-- Left labels: name (bold) + count + wait, tightly grouped, right-aligned -->
					{#each dotRows as dp}
						{@const mid = dp.bandY + Math.round(bw / 2)}
						<text
							x={-8}
							y={mid - 12}
							text-anchor="end"
							font-size="13"
							font-weight="bold"
							class="fill-gray-800 dark:fill-gray-100"
						>{yLabelFormat(dp.label)}</text>
						<text
							x={-8}
							y={mid + 1}
							text-anchor="end"
							font-size="11"
							fill={COUNT_COLOR}
						>{dp.countLabel}</text>
						<text
							x={-8}
							y={mid + 13}
							text-anchor="end"
							font-size="11"
							fill={WAIT_COLOR}
						>{dp.waitLabel}</text>
					{/each}

					<!-- Baseline -->
					<line
						x1="0"
						x2={innerWidth}
						y1={innerHeight}
						y2={innerHeight}
						stroke="currentColor"
						class="text-gray-200 dark:text-gray-700"
					/>

					<!-- Hover overlay -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<rect
						width={innerWidth}
						height={innerHeight}
						fill="transparent"
						on:mousemove={handleMouseMove}
						on:mouseleave={handleMouseLeave}
						style="cursor: crosshair;"
					/>
				</g>
			</svg>
		{/if}
	</div>

	{#if VIEW_NOTES[view]}
		<p class="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
			{VIEW_NOTES[view]}
		</p>
	{/if}

	<Tooltip
		visible={hoverLabel !== null && !!hoveredItem}
		x={hoverClientX}
		y={hoverClientY}
		title={hoveredItem ? tooltipTitle(hoveredItem.label) : ''}
		items={hoveredItem
			? [
					{ label: 'Vorfälle', value: String(hoveredItem.count), color: COUNT_COLOR },
					{
						label: 'Wartezeit',
						value: fmtWait(hoveredItem.waitingHours),
						color: WAIT_COLOR
					}
				]
			: []}
	/>
{/if}
