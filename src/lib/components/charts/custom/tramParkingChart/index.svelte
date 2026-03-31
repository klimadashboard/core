<script>
	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { Chart, AxisY, BarY, Legend, Tooltip } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import { detectHotspots } from '../tramParking/hotspots';
	import dayjs from 'dayjs';

	export let region = null;
	export let onChartData = undefined;

	let loading = true;
	let error = null;
	let incidents = [];
	let view = 'lines';

	const VIEW_OPTIONS = [
		{ value: 'lines', label: 'Linien' },
		{ value: 'hotspots', label: 'Hotspots' },
		{ value: 'districts', label: 'Bezirke' }
	];

	// Rose-600 faded to 70% to sit comfortably alongside the orange line
	const COUNT_COLOR = '#e11d48';
	const COUNT_OPACITY = 1;
	const WAIT_COLOR = '#f97316';

	function incidentWaitingHours(inc) {
		const end = inc.date_fix ?? inc.date_end;
		if (!end || !inc.date_start) return null;
		const diff = dayjs(end).diff(dayjs(inc.date_start), 'minute');
		return diff > 0 ? diff / 60 : null;
	}

	function tooltipTitle(label) {
		if (view === 'districts') return `${label}. Bezirk`;
		if (view === 'lines') return `Linie ${label}`;
		return label;
	}

	$: aggregated = (() => {
		if (!incidents.length) return [];

		// Hotspots: use the same clustering algorithm as the map
		if (view === 'hotspots') {
			const geocoded = incidents.filter((i) => i.lat != null && i.lon != null);
			const hotspots = detectHotspots(geocoded);
			return hotspots.slice(0, 15).map((hs) => ({
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
				// districts
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
			rows = rows.slice(0, 20);
		}

		return rows.map((r) => ({
			label: r.label,
			count: r.count,
			waitingHours: r.hasWaiting ? r.totalWaiting : 0
		}));
	})();

	$: bottomMargin = view === 'hotspots' ? 105 : 55;
	$: xRotate = view === 'hotspots' ? -40 : -35;
	$: xLabelFormat =
		view === 'districts'
			? (v) => v + '.'
			: view === 'hotspots'
				? (v) => (v.length > 18 ? v.slice(0, 18) + '…' : v)
				: (v) => v;

	onMount(async () => {
		try {
			const directus = getDirectusInstance(fetch);
			let all = [];
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
				all = all.concat(items);
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
			error = e.message;
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
		<Legend
			items={[
				{ key: 'count', label: 'Anzahl Vorfälle', color: COUNT_COLOR },
				{ key: 'waiting', label: 'Wartezeit gesamt (h)', color: WAIT_COLOR, dashed: true }
			]}
		/>
	</div>

	<Chart
		data={aggregated}
		x="label"
		y="count"
		xType="band"
		yMin={0}
		height={350}
		margin={{ top: 20, right: 65, bottom: bottomMargin, left: 55 }}
		let:xScale
		let:yScale
		let:innerWidth
		let:innerHeight
		let:bandwidth
		let:hover
	>
		{@const maxWaiting = Math.max(1, ...aggregated.map((d) => d.waitingHours))}
		{@const yScale2 = scaleLinear().domain([0, maxWaiting]).range([innerHeight, 0]).nice()}

		<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />

		<BarY
			data={aggregated}
			x="label"
			y="count"
			{xScale}
			{yScale}
			color={COUNT_COLOR}
			opacity={COUNT_OPACITY}
			{hover}
		/>

		<!-- Waiting time line + dots (secondary scale) -->
		<g>
			{#each aggregated as d, i}
				{@const cx = (xScale(d.label) ?? 0) + bandwidth / 2}
				{@const cy = yScale2(d.waitingHours)}
				{#if i > 0}
					{@const prev = aggregated[i - 1]}
					{@const px = (xScale(prev.label) ?? 0) + bandwidth / 2}
					{@const py = yScale2(prev.waitingHours)}
					<line x1={px} y1={py} x2={cx} y2={cy} stroke={WAIT_COLOR} stroke-width="2" />
				{/if}
				<circle {cx} {cy} r="3.5" fill={WAIT_COLOR} stroke="white" stroke-width="1.5" />
			{/each}
		</g>

		<!-- Left axis: count labels -->
		<AxisY
			mode="labels"
			{yScale}
			{innerWidth}
			{innerHeight}
			format={(v) => String(Math.round(v))}
		/>

		<!-- Right axis: waiting time -->
		<g>
			{#each yScale2.ticks(5) as tick}
				<g transform="translate({innerWidth},{yScale2(tick)})">
					<line x1="0" x2="4" y1="0" y2="0" stroke={WAIT_COLOR} stroke-opacity="0.5" />
					<text x="8" dy="0.32em" font-size="11" fill={WAIT_COLOR}
						>{tick % 1 === 0 ? tick : tick.toFixed(1)} h</text
					>
				</g>
			{/each}
		</g>

		<!-- Manual x-axis: show every bar label -->
		<g transform="translate(0,{innerHeight})">
			<line x1="0" x2={innerWidth} y1="0" y2="0" stroke="currentColor" class="text-gray-300" />
			{#each aggregated as d}
				{@const bx = (xScale(d.label) ?? 0) + bandwidth / 2}
				<g transform="translate({bx},0)">
					<line y1="0" y2="4" stroke="currentColor" class="text-gray-300" />
					<text
						y="8"
						text-anchor="end"
						transform="rotate({xRotate}, 0, 8)"
						font-size="11"
						class="fill-gray-500 dark:fill-gray-400">{xLabelFormat(d.label)}</text
					>
				</g>
			{/each}
		</g>

		<svelte:fragment slot="tooltip" let:hover let:data>
			{@const hovered = data.find((d) => d.label === hover.x)}
			<Tooltip
				visible={hover.x !== null && !!hovered}
				x={hover.clientX}
				y={hover.clientY}
				title={hovered ? tooltipTitle(hovered.label) : ''}
				items={hovered
					? [
							{ label: 'Vorfälle', value: String(hovered.count), color: COUNT_COLOR },
							{
								label: 'Wartezeit',
								value:
									hovered.waitingHours > 0
										? `${Math.round(hovered.waitingHours)} h`
										: 'keine Daten',
								color: WAIT_COLOR
							}
						]
					: []}
			/>
		</svelte:fragment>
	</Chart>
{/if}
