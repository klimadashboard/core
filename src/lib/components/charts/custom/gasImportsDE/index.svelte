<script>
	import { Chart, AxisX, AxisY, Line, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';

	const SERIES = [
		{ key: 'Tschechien', color: '#4e79a7' },
		{ key: 'Niederlande', color: '#f28e2c' },
		{ key: 'Belgien', color: '#e15759' },
		{ key: 'Polen', color: '#76b7b2' },
		{ key: 'Norwegen', color: '#59a14f' },
		{ key: 'Dänemark', color: '#edc949' },
		{ key: 'Frankreich', color: '#af7aa1' },
		{ key: 'Österreich', color: '#ff9da7' },
		{ key: 'Schweiz', color: '#9c755f' },
		{ key: 'Russland', color: '#bab0ab' },
		{ key: 'LNG', color: '#8CAED9' },
		{ key: 'Deutschland Import', color: '#A56BC8' }
	];

	let loading = true;
	let error = null;
	let chartData = [];
	let activeSeries = [];

	async function loadData() {
		const d = new Date();
		d.setDate(d.getDate() - 365);

		const directus = getDirectusInstance(fetch);
		let gas_imports = await directus.request(
			readItems('gas_imports', {
				filter: {
					_and: [{ Country: { _eq: PUBLIC_VERSION.toUpperCase() }, date: { _gte: d } }]
				},
				limit: -1,
				fields: ['import_country.name_de', 'import_source', 'date', 'value'],
				sort: ['date']
			})
		);

		gas_imports = gas_imports.map((row) => ({
			...row,
			category:
				row.import_source === null ? row.import_country?.name_de : row.import_source,
			label: new Date(row.date).toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			})
		}));

		// Pivot: one row per date label, one column per category
		const map = {};
		for (const item of gas_imports) {
			if (!map[item.label]) map[item.label] = { label: item.label };
			map[item.label][item.category] = item.value;
		}

		chartData = Object.values(map).map((row, i) => ({ ...row, x: i }));

		// Only show series that have at least one non-zero value
		activeSeries = SERIES.filter((s) => chartData.some((d) => d[s.key] > 0));
		loading = false;
	}

	loadData().catch((e) => {
		error = e?.message ?? 'Fehler beim Laden';
		loading = false;
	});

	$: legendItems = activeSeries.map((s) => ({ key: s.key, label: s.key, color: s.color }));
	$: yFields = activeSeries.map((s) => s.key);
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
					tickCount={5}
				/>

				{#each activeSeries as s}
					<Line
						data={chartData}
						x="x"
						y={s.key}
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
					{@const pt = chartData.find((d) => d.x === hover.x)}
					{#if pt}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={pt.label}
							items={activeSeries
								.filter((s) => pt[s.key] > 0)
								.map((s) => ({
									label: s.key,
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
