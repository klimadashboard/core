<script>
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Papa from 'papaparse';
	import { Chart, AxisX, AxisY, Tooltip, Legend } from '$lib/components/charts/primitives';

	export let chart;
	export let v;
	export let onChartData = undefined;

	const isAT = PUBLIC_VERSION === 'at';

	const SOURCES = ['OLI 2025 (1990-2024)', 'manual_consumption'];

	const SERIES = [
		{ key: 'consumption_based', label: 'Konsumbasiert', color: '#E59E1A' },
		{ key: 'production_based', label: 'Produktionsbasiert', color: '#4DB263' }
	];

	let dataset = [];
	let unit = 'THG';

	$: legendItems = SERIES.map((s) => ({
		key: s.key,
		label: v?.[s.key] || s.label,
		color: s.color
	}));

	// Magnitude-aware Y-axis formatting
	$: yDivisor = yMaxValue >= 1_000_000 ? 1_000_000 : yMaxValue >= 1_000 ? 1_000 : 1;
	$: yUnit = yMaxValue >= 1_000_000 ? 'Mio. t' : yMaxValue >= 1_000 ? 'Tsd. t' : 't';

	$: formatY = (val) => {
		const divided = val / yDivisor;
		if (Number.isInteger(divided)) return String(divided);
		return divided.toLocaleString('de-AT', { maximumFractionDigits: 1 });
	};

	// Dynamic left margin based on formatted tick label width
	$: leftMargin = (() => {
		const sample = formatY(Math.ceil(yMaxValue));
		return Math.max(sample.length * 7 + 16, 35);
	})();

	function buildTooltipItems(hoverX, data) {
		const point = data.find((d) => d.year === hoverX);
		if (!point) return [];
		return SERIES.filter((s) => point[s.key] != null)
			.map((s) => ({
				label: v?.[s.key] || s.label,
				value: Math.round(point[s.key]).toLocaleString('de-AT') + ' t',
				color: s.color
			}));
	}

	function emitChartData(rows) {
		if (!onChartData) return;

		const columns = [
			{ key: 'year', label: 'Jahr', align: 'left' },
			...SERIES.map((s) => ({
				key: s.key,
				label: v?.[s.key] || s.label,
				align: 'right',
				format: (val) => (typeof val === 'number' ? Math.round(val).toLocaleString('de-AT') : '–')
			}))
		];

		onChartData({
			raw: rows,
			table: { columns, rows: dataset, filename: 'emissionen_konsum_produktion' },
			placeholders: {},
			meta: { source: 'UBA, Global Carbon Project' }
		});
	}

	// ── AT: Fetch from Directus ──────────────────────────────────────────
	async function fetchDataAT() {
		const directus = getDirectusInstance(fetch);
		let data = await directus.request(
			readItems('emissions_data', {
				filter: {
					_and: [
						{
							country: { _eq: PUBLIC_VERSION.toUpperCase() },
							source: { _in: SOURCES },
							gas: { _eq: 'THG' }
						}
					]
				},
				sort: ['year'],
				fields: ['category', 'gas.name', 'gas.unit', 'id', 'source', 'type', 'value', 'year'],
				limit: -1
			})
		);

		data = data.filter((d) => d.type == null || d.type === 'Gesamt');

		// Group by year and pivot
		const byYear = new Map();
		for (const row of data) {
			const category = row.category === 'ksg' ? 'production_based' : row.category;
			if (!byYear.has(row.year)) {
				byYear.set(row.year, { year: row.year });
			}
			byYear.get(row.year)[category] = row.value;
		}

		unit = data[0]?.gas?.name ?? 'THG';
		dataset = [...byYear.values()].sort((a, b) => a.year - b.year);
		emitChartData(data);
	}

	// ── DE: Fetch from CSV ───────────────────────────────────────────────
	function fetchDataDE() {
		return new Promise((resolve, reject) => {
			Papa.parse(
				`https://data.klimadashboard.org/${PUBLIC_VERSION}/emissions/emissions_consumption_based.csv`,
				{
					download: true,
					dynamicTyping: true,
					header: true,
					skipEmptyLines: true,
					complete: function (results) {
						if (!results?.data?.length) {
							reject(new Error('No CSV data'));
							return;
						}

						const csvRows = results.data;
						unit = csvRows[0]?.unit ?? 'THG';

						// CSV already has consumption_based and production_based columns
						dataset = csvRows
							.map((row) => ({
								year: row.year,
								consumption_based: row.consumption_based ?? null,
								production_based: row.production_based ?? null
							}))
							.sort((a, b) => a.year - b.year);

						emitChartData(csvRows);
						resolve();
					},
					error: reject
				}
			);
		});
	}

	async function fetchData() {
		try {
			if (isAT) {
				await fetchDataAT();
			} else {
				await fetchDataDE();
			}
		} catch (err) {
			console.error('consumptionBasedEmissions: failed to fetch data', err);
		}
	}

	fetchData();

	$: yMaxValue =
		dataset.length > 0
			? Math.max(
					...dataset.flatMap((d) =>
						SERIES.map((s) => d[s.key] ?? 0)
					)
				)
			: 0;
</script>

<div class="flex flex-col gap-4">
	<Legend items={legendItems} />

	{#if dataset.length > 0}
		<Chart
			data={dataset}
			x="year"
			y={SERIES.map((s) => s.key)}
			xType="band"
			height={320}
			yMax={yMaxValue * 1.1}
			margin={{ top: 10, right: 20, bottom: 40, left: leftMargin }}
			padding={0.3}
		>
			<svelte:fragment
				slot="default"
				let:data
				let:xScale
				let:yScale
				let:xDomain
				let:innerWidth
				let:innerHeight
				let:hover
			>
				<!-- Grid lines behind content -->
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={String} tickCount={7} />

				<!-- Grouped bars: split each band into sub-bars -->
				{#if xScale && yScale}
					<g class="mark-bar-grouped">
						{#each data as d}
							{@const barX = xScale(d.year) ?? 0}
							{@const bw = xScale.bandwidth?.() ?? 20}
							{@const subWidth = bw / SERIES.length - 1}
							{@const isHovered = hover.x === d.year}
							{@const dimmed = hover.x !== null && !isHovered}

							{#each SERIES as series, si}
								{@const value = d[series.key]}
								{#if value != null}
									{@const barHeight = Math.max(0, (yScale(0) ?? 0) - (yScale(value) ?? 0))}
									<rect
										x={barX + si * (subWidth + 1)}
										y={yScale(value) ?? 0}
										width={subWidth}
										height={barHeight}
										fill={series.color}
										opacity={dimmed ? 0.4 : 1}
										rx="1"
										ry="1"
										class="transition-opacity duration-100"
									>
										<title>{series.label}: {Math.round(value).toLocaleString('de-AT')} t</title>
									</rect>
								{/if}
							{/each}
						{/each}
					</g>
				{/if}

				<!-- Y-axis labels on top of content with opaque backgrounds -->
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={formatY} unit={yUnit} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover let:data>
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={String(hover.x ?? '')}
					items={buildTooltipItems(hover.x, data)}
				/>
			</svelte:fragment>
		</Chart>
	{/if}
</div>
