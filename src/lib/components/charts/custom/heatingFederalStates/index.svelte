<script>
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import { Chart, AxisX, AxisY, BarStack, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RangeSlider, Toggle } from '$lib/components/ui';

	export let chart;
	export let v;
	export let onChartData = undefined;

	const SOURCE = 'mikrozensus-statistik-austria';

	const CATEGORIES = [
		{ key: 'gas', dbCategory: 'gas', color: '#7CBAB3' },
		{ key: 'oil', dbCategory: 'heating oil', color: '#575C75' },
		{ key: 'coal', dbCategory: 'coal', color: '#71665B' },
		{ key: 'wood', dbCategory: 'wood, wood pellets', color: '#B28834' },
		{ key: 'electric', dbCategory: 'electricity (without heat pump)', color: '#8CAED9' },
		{ key: 'heatPump', dbCategory: 'solar/geothermal energy, heat pumps', color: '#E0A906' },
		{ key: 'remote', dbCategory: 'district heating (various energy sources)', color: '#CF6317' }
	];

	// Map of state UUID → name (populated on fetch)
	let stateLabels = new Map();

	let allData = null;
	let maxYear = null;
	let minYear = 2004;
	let selectedYear = null;
	let showPerHousehold = false;

	$: legendItems = CATEGORIES.map((c) => ({
		key: c.key,
		label: v?.[c.key] || c.key,
		color: c.color
	}));

	// Build stacked chart data: each item has { label, total, segments: [{ key, value, y0, y1, color }] }
	$: stackedData = buildStackedData(allData, selectedYear, showPerHousehold);
	$: yMaxValue = stackedData.length > 0 ? Math.max(...stackedData.map((d) => d.total)) : 0;

	function buildStackedData(data, year, perHousehold) {
		if (!data || !year || stateLabels.size === 0) return [];

		return [...stateLabels.entries()]
			.map(([id, label]) => {
				const stateData = data.get(id);
				if (!stateData) return null;
				const yearData = stateData.get(year);
				const perHHData = perHousehold ? stateData.get(`${year}_per1000`) : null;
				const households = yearData?.get('total') ?? 0;

				let y0 = 0;
				const segments = CATEGORIES.map((c) => {
					const value = perHousehold
						? (perHHData?.get(c.dbCategory) ?? 0) / 10
						: (yearData?.get(c.dbCategory) ?? 0);
					const y1 = y0 + value;
					const seg = {
						key: c.key,
						label: v?.[c.key] || c.key,
						value,
						y0,
						y1,
						color: c.color
					};
					y0 = y1;
					return seg;
				});

				return { label, households, total: y0, segments };
			})
			.filter(Boolean)
			.sort((a, b) => a.households - b.households);
	}

	function formatY(val) {
		if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
		if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
		return String(Math.round(val * 10) / 10);
	}

	function buildTooltipItems(hoverX, data) {
		const bar = data.find((d) => d.label === hoverX);
		if (!bar) return [];
		return bar.segments
			.filter((s) => s.value > 0)
			.sort((a, b) => b.value - a.value)
			.map((s) => ({
				label: s.label,
				value: showPerHousehold
					? s.value.toLocaleString('de-AT', { maximumFractionDigits: 1 })
					: s.value.toLocaleString('de-AT'),
				color: s.color
			}));
	}

	async function fetchData() {
		try {
			const directus = getDirectusInstance(fetch);

			// Look up AT state regions dynamically
			const stateRegions = await directus.request(
				readItems('regions', {
					filter: { country: { _eq: 'AT' }, layer: { _eq: 'state' } },
					fields: ['id', 'name'],
					limit: -1
				})
			);

			const stateIds = stateRegions.map((r) => r.id);
			stateLabels = new Map(stateRegions.map((r) => [r.id, r.name]));

			const rows = await directus.request(
				readItems('energy_heating_systems', {
					filter: {
						source: { _eq: SOURCE },
						region: { _in: stateIds }
					},
					sort: ['period'],
					limit: -1
				})
			);

			if (!rows?.length) return;

			const grouped = new Map();
			for (const row of rows) {
				const year = new Date(row.period).getFullYear();
				const region = row.region;
				if (!grouped.has(region)) grouped.set(region, new Map());
				const regionMap = grouped.get(region);

				const mapKey = row.unit === 'per_1000_households' ? `${year}_per1000` : year;
				if (!regionMap.has(mapKey)) regionMap.set(mapKey, new Map());
				regionMap.get(mapKey).set(row.category, row.value);
			}

			allData = grouped;

			const years = [
				...new Set(
					rows
						.filter((r) => r.unit === 'absolute')
						.map((r) => new Date(r.period).getFullYear())
				)
			].sort((a, b) => a - b);
			minYear = years[0];
			maxYear = years[years.length - 1];
			selectedYear = maxYear;

			if (onChartData) {
				const columns = [
					{ key: 'region', label: 'Bundesland', align: 'left' },
					...CATEGORIES.map((c) => ({
						key: c.key,
						label: v?.[c.key] || c.key,
						align: 'right',
						format: (val) =>
							typeof val === 'number' ? val.toLocaleString('de-AT') : '–'
					}))
				];

				const tableRows = stateRegions
					.sort((a, b) => a.name.localeCompare(b.name, 'de'))
					.map((state) => {
						const stateData = grouped.get(state.id);
						const yearData = stateData?.get(maxYear);
						const row = { region: state.name };
						for (const c of CATEGORIES) {
							row[c.key] = yearData?.get(c.dbCategory) ?? null;
						}
						return row;
					});

				onChartData({
					raw: rows,
					table: { columns, rows: tableRows, filename: 'heizungen_bundeslaender' },
					placeholders: {
						dataYear: String(maxYear),
						firstYear: String(minYear)
					},
					meta: {
						source: 'Statistik Austria, Mikrozensus Energieeinsatz der Haushalte'
					}
				});
			}
		} catch (err) {
			console.error('heatingFederalStates: failed to fetch data', err);
		}
	}

	fetchData();
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col sm:flex-row justify-between gap-4 items-start">
		{#if maxYear}
			<div class="w-full sm:w-64">
				<RangeSlider
					label="Jahr auswählen"
					bind:value={selectedYear}
					min={minYear}
					max={maxYear}
					step={2}
				/>
			</div>
		{/if}
		<Toggle label={v?.per100households || 'Pro 100 Haushalte'} bind:checked={showPerHousehold} />
	</div>

	<Legend items={legendItems} />

	{#if stackedData.length > 0}
		<Chart
			data={stackedData}
			x="label"
			y="total"
			xType="band"
			height={340}
			yMax={yMaxValue * 1.05}
			margin={{ top: 15, right: 20, bottom: 75, left: 65 }}
			padding={0.25}
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
				<AxisY
					{yScale}
					{innerWidth}
					{innerHeight}
					format={formatY}
					unit={showPerHousehold ? 'pro 100' : (v?.households || '')}
				/>
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={String}
					tickCount={9}
					rotate={-35}
				/>

				<BarStack
					{data}
					x="label"
					{xScale}
					{yScale}
					{hover}
					radius={2}
				/>
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
