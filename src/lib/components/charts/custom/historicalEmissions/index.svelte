<script>
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { Chart, AxisX, AxisY, Tooltip, Legend, Area } from '$lib/components/charts/primitives';

	export let chart;
	export let v;
	export let onChartData = undefined;

	const SECTORS = [
		{ key: 'energy', csvKey: 'energy_ipc1_Mt_CO2e', label: 'Energie', color: '#BD3737' },
		{
			key: 'industry',
			csvKey: 'industrial_processes_and_product_use_ipc2_Mt_CO2e',
			label: 'Industrie',
			color: '#373949'
		},
		{
			key: 'agriculture',
			csvKey: 'agriculture_and_livestock_ipcmag_Mt_CO2e',
			label: 'Landwirtschaft',
			color: '#65987D'
		},
		{ key: 'waste', csvKey: 'waste_ipc4_Mt_CO2e', label: 'Abfall', color: '#B7693D' },
		{ key: 'other', csvKey: 'other_ipc5_Mt_CO2e', label: 'Andere', color: '#A4A4A4' }
	];

	let dataset = [];

	$: legendItems = SECTORS.map((s) => ({
		key: s.key,
		label: v?.[s.key] || s.label,
		color: s.color
	}));

	// Pre-compute stacked y0/y1 fields for Area primitive
	$: stackedData = dataset.map((d) => {
		const entry = { ...d };
		let y0 = 0;
		for (const s of SECTORS) {
			const val = d[s.key] ?? 0;
			entry[s.key + '_y0'] = y0;
			entry[s.key + '_y1'] = y0 + val;
			y0 += val;
		}
		entry.total = y0;
		return entry;
	});

	$: yMaxValue = stackedData.length > 0 ? Math.max(...stackedData.map((d) => d.total)) : 0;

	// Y-axis: values are already in Mt (Mio. t), so just show clean numbers
	$: formatY = (val) => {
		if (Number.isInteger(val)) return String(val);
		return val.toLocaleString('de-AT', { maximumFractionDigits: 1 });
	};

	// Dynamic left margin based on formatted tick label width
	$: leftMargin = (() => {
		const sample = formatY(Math.ceil(yMaxValue));
		return Math.max(sample.length * 7 + 16, 35);
	})();

	function buildTooltipItems(hoverX, data) {
		const point = data.find((d) => d.year === hoverX);
		if (!point) return [];
		const items = SECTORS.filter((s) => (point[s.key] ?? 0) > 0).map((s) => ({
			label: v?.[s.key] || s.label,
			value:
				(point[s.key] ?? 0).toLocaleString('de-AT', { maximumFractionDigits: 2 }) +
				' Mio. t',
			color: s.color
		}));
		// Add total
		const total = SECTORS.reduce((sum, s) => sum + (point[s.key] ?? 0), 0);
		if (total > 0) {
			items.push({
				label: 'Gesamt',
				value: total.toLocaleString('de-AT', { maximumFractionDigits: 2 }) + ' Mio. t',
				color: '#666'
			});
		}
		return items;
	}

	Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/emissions/${PUBLIC_VERSION.toUpperCase()}_Historical-Emissions_PIK-PRIMAP.csv`,
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (!results?.data?.length) return;

				dataset = results.data
					.map((row) => ({
						year: row.year,
						energy: Math.round((row.energy_ipc1_Mt_CO2e ?? 0) * 100) / 100,
						industry:
							Math.round(
								(row.industrial_processes_and_product_use_ipc2_Mt_CO2e ?? 0) * 100
							) / 100,
						agriculture:
							Math.round(
								(row.agriculture_and_livestock_ipcmag_Mt_CO2e ?? 0) * 100
							) / 100,
						waste: Math.round((row.waste_ipc4_Mt_CO2e ?? 0) * 100) / 100,
						other: Math.round((row.other_ipc5_Mt_CO2e ?? 0) * 100) / 100
					}))
					.sort((a, b) => a.year - b.year);

				if (onChartData) {
					const lastEntry = dataset[dataset.length - 1];
					const lastTotal = SECTORS.reduce(
						(sum, s) => sum + (lastEntry?.[s.key] ?? 0),
						0
					);

					const columns = [
						{ key: 'year', label: 'Jahr', align: 'left' },
						...SECTORS.map((s) => ({
							key: s.key,
							label: v?.[s.key] || s.label,
							align: 'right',
							format: (val) =>
								typeof val === 'number'
									? val.toLocaleString('de-AT', { maximumFractionDigits: 2 })
									: '–'
						}))
					];

					onChartData({
						raw: results.data,
						table: {
							columns,
							rows: dataset,
							filename: 'historische_emissionen'
						},
						placeholders: {
							lastYear: String(lastEntry?.year ?? ''),
							lastYearTotal: lastTotal.toLocaleString('de-DE', {
								minimumFractionDigits: 1,
								maximumFractionDigits: 1
							})
						},
						meta: { source: 'PIK PRIMAP' }
					});
				}
			}
		}
	);
</script>

<div class="flex flex-col gap-4">
	<Legend items={legendItems} />

	{#if stackedData.length > 0}
		<Chart
			data={stackedData}
			x="year"
			y="total"
			xType="linear"
			height={320}
			yMax={yMaxValue * 1.1}
			margin={{ top: 10, right: 20, bottom: 40, left: leftMargin }}
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
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={(v) => String(Math.round(v))} tickCount={7} />

				<!-- Stacked areas: render in reverse order so bottom layers paint on top -->
				{#each [...SECTORS].reverse() as sector}
					<Area
						{data}
						x="year"
						y0Field={sector.key + '_y0'}
						y1Field={sector.key + '_y1'}
						color={sector.color}
						{xScale}
						{yScale}
						opacity={0.85}
						curve="monotone"
						{hover}
					/>
				{/each}

				<!-- Hover vertical rule -->
				{#if hover.x !== null}
					{@const hx = xScale(hover.x)}
					{#if hx != null}
						<line
							x1={hx}
							x2={hx}
							y1={0}
							y2={innerHeight}
							stroke="currentColor"
							stroke-opacity="0.4"
							stroke-width="1"
						/>
					{/if}
				{/if}

				<!-- Y-axis labels on top of content with opaque backgrounds -->
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={formatY} unit="Mio. t" />
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
