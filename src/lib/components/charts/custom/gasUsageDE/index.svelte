<script>
	import { Chart, AxisX, AxisY, Line, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import dayjs from 'dayjs';
	import dayOfYear from 'dayjs/plugin/dayOfYear';

	dayjs.extend(dayOfYear);

	// Current year = dark teal, one year ago = medium teal, older = muted gray
	function yearColor(i, total) {
		if (i === total - 1) return '#347C86';
		if (i === total - 2) return '#7CBAB3';
		return '#D1D5DB';
	}

	let loading = true;
	let error = null;
	let chartData = [];
	let years = [];
	let lastYear = null;
	let pulsePoint = null;

	async function loadData() {
		const directus = getDirectusInstance(fetch);
		const rawData = await directus.request(
			readItems('energy', {
				filter: {
					_and: [{ region: { _eq: PUBLIC_VERSION } }, { category: { _eq: 'gas|usage' } }]
				},
				limit: -1,
				sort: ['period']
			})
		);

		years = Array.from(new Set(rawData.map((d) => dayjs(d.period).year()))).sort();
		const grouped = {};

		for (const d of rawData) {
			const date = dayjs(d.period);
			const year = date.year();
			const day = date.dayOfYear();
			const label = date.format('D. MMM');

			if (!grouped[day]) {
				grouped[day] = { x: day, label };
				for (const y of years) grouped[day][String(y)] = null;
			}
			grouped[day][String(year)] = d.value;
		}

		const sorted = Object.values(grouped)
			.filter((d) => years.some((y) => d[String(y)] != null))
			.sort((a, b) => a.x - b.x)
			.map((d, i) => ({ ...d, x: i }));

		chartData = sorted;
		lastYear = years[years.length - 1] ?? null;

		if (lastYear != null) {
			const lastYearPts = sorted.filter((d) => d[String(lastYear)] != null);
			pulsePoint = lastYearPts[lastYearPts.length - 1] ?? null;
		}
		loading = false;
	}

	loadData().catch((e) => {
		error = e?.message ?? 'Fehler beim Laden';
		loading = false;
	});

	$: legendItems = years.map((y, i) => ({
		key: String(y),
		label: String(y),
		color: yearColor(i, years.length)
	}));

	$: yFields = years.map(String);
</script>

{#if loading}
	<div class="h-80 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-80 flex items-center justify-center text-red-500">{error}</div>
{:else}
	<div class="flex flex-col gap-2">
		<Legend items={legendItems} />
		<Chart
			data={chartData}
			x="x"
			y={yFields}
			height={320}
			yMin={0}
			margin={{ top: 10, right: 20, bottom: 35, left: 60 }}
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
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={(v) => chartData[Math.round(v)]?.label ?? ''}
					tickCount={6}
				/>

				<!-- Render past years first (behind current year) -->
				{#each years as year, i}
					{#if year !== lastYear}
						<Line
							data={chartData}
							x="x"
							y={String(year)}
							{xScale}
							{yScale}
							stroke={yearColor(i, years.length)}
							strokeWidth={1}
							{hover}
						/>
					{/if}
				{/each}

				<!-- Current year on top, thicker, with dots -->
				{#if lastYear != null}
					{@const currentIdx = years.indexOf(lastYear)}
					<Line
						data={chartData}
						x="x"
						y={String(lastYear)}
						{xScale}
						{yScale}
						stroke={yearColor(currentIdx, years.length)}
						strokeWidth={2.5}
						dots={true}
						dotRadius={2}
						{hover}
					/>
				{/if}

				<!-- Animated pulse at last data point of current year -->
				{#if pulsePoint && lastYear != null && xScale && yScale}
					{@const cx = xScale(pulsePoint.x)}
					{@const cy = yScale(pulsePoint[String(lastYear)])}
					{@const currentColor = yearColor(years.length - 1, years.length)}
					<g transform="translate({cx},{cy})">
						<circle r="5" fill={currentColor} />
						<circle r="5" fill={currentColor}>
							<animate attributeName="r" from="5" to="12" dur="1.5s" repeatCount="indefinite" />
							<animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
						</circle>
					</g>
				{/if}

				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} unit="GWh/Tag" />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const pt = chartData.find((d) => d.x === hover.x)}
					{#if pt}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={pt.label}
							items={[...years].reverse()
								.filter((y) => pt[String(y)] != null)
								.map((y, i, arr) => ({
									label: String(y),
									value: formatNumber(pt[String(y)], 1) + ' GWh/Tag',
									color: yearColor(years.indexOf(y), years.length)
								}))}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>
	</div>
{/if}
