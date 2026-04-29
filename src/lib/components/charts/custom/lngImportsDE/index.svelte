<script>
	import { Chart, AxisX, AxisY, Area, Line, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import Papa from 'papaparse';

	const SERIES = [
		{ key: 'wilhelmshaven', label: 'Wilhelmshaven', color: '#347C86' },
		{ key: 'brunsbuettel', label: 'Brunsbüttel', color: '#575C75' },
		{ key: 'balticEnergyGate', label: 'Lubmin (Baltic Energy Gate)', color: '#CF6317' }
	];

	let rawData;

	Papa.parse('https://static.dwcdn.net/data/Qa2I3.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete(results) {
			if (results?.data) rawData = results.data;
		}
	});

	$: stackedData = rawData?.map((e, i) => {
		let y0 = 0;
		const entry = { x: i, label: e['periodFrom'] };
		for (const s of SERIES) {
			const raw = {
				wilhelmshaven: e['Wilhelmshaven, LNG-Zone'],
				brunsbuettel: e['BRUNSBUETTEL HAFEN (FSRU) (DE)'],
				balticEnergyGate: e['Baltic Energy Gate (Port) (DE)']
			}[s.key];
			const val = typeof raw === 'number' && !isNaN(raw) ? raw : 0;
			entry[s.key + '_y0'] = y0;
			entry[s.key + '_y1'] = y0 + val;
			entry[s.key] = val;
			y0 += val;
		}
		entry.total = y0;
		return entry;
	}) ?? [];

	$: yMax = stackedData.length > 0 ? Math.max(...stackedData.map((d) => d.total)) * 1.1 : 100;
</script>

{#if !stackedData.length}
	<div class="h-80 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else}
	<div class="flex flex-col gap-2">
		<Legend items={SERIES} />
		<Chart
			data={stackedData}
			x="x"
			y="total"
			height={320}
			yMin={0}
			{yMax}
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
					format={(v) => stackedData[Math.round(v)]?.label ?? ''}
					tickCount={5}
				/>

				{#each SERIES as s}
					<Area
						data={stackedData}
						x="x"
						y0Field={s.key + '_y0'}
						y1Field={s.key + '_y1'}
						color={s.color}
						{xScale}
						{yScale}
						opacity={0.8}
						curve="linear"
					/>
				{/each}

				{#each SERIES as s}
					<Line
						data={stackedData}
						x="x"
						y={s.key + '_y1'}
						{xScale}
						{yScale}
						stroke={s.color}
						strokeWidth={1.5}
						{hover}
					/>
				{/each}

				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} unit="GWh/Tag" />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const pt = stackedData.find((d) => d.x === hover.x)}
					{#if pt}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={pt.label}
							items={SERIES.filter((s) => pt[s.key] > 0).map((s) => ({
								label: s.label,
								value: formatNumber(pt[s.key], 1) + ' GWh/Tag',
								color: s.color
							}))}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>
	</div>
{/if}
