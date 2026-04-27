<script>
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import { Chart, AxisX, AxisY, Line, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { Select } from '$lib/components/ui';

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

	let regions = [];
	let selectedRegion = '';
	let allData = null;
	let hiddenSeries = new Set();

	$: dataset = buildDataset(allData, selectedRegion);

	$: legendItems = CATEGORIES.map((c) => ({
		key: c.key,
		label: v?.[c.key] || c.key,
		color: c.color
	}));

	$: visibleKeys = CATEGORIES.filter((c) => !hiddenSeries.has(c.key)).map((c) => c.key);

	function buildDataset(data, region) {
		if (!data || !region) return [];
		const regionData = data.get(region);
		if (!regionData) return [];

		const years = [...regionData.keys()].sort((a, b) => a - b);
		return years.map((year) => {
			const yearData = regionData.get(year);
			const row = { year };
			for (const c of CATEGORIES) {
				row[c.key] = yearData?.get(c.dbCategory) ?? 0;
			}
			return row;
		});
	}

	function formatY(val) {
		if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
		if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
		return String(val);
	}

	function buildTooltipItems(hoverX, data) {
		const point = data.find((d) => d.year === hoverX);
		if (!point) return [];
		return CATEGORIES.filter((c) => !hiddenSeries.has(c.key)).map((c) => ({
			label: v?.[c.key] || c.key,
			value: (point[c.key] ?? 0).toLocaleString('de-AT'),
			color: c.color
		}));
	}

	async function fetchData() {
		try {
			const directus = getDirectusInstance(fetch);

			// Fetch AT regions (country + states) for dropdown
			const atRegions = await directus.request(
				readItems('regions', {
					filter: {
						country: { _eq: 'AT' },
						layer: { _in: ['country', 'state'] }
					},
					fields: ['id', 'name', 'layer'],
					limit: -1
				})
			);

			// Build dropdown: country first, then states sorted alphabetically
			const countryRegion = atRegions.find((r) => r.layer === 'country');
			const stateRegions = atRegions
				.filter((r) => r.layer === 'state')
				.sort((a, b) => a.name.localeCompare(b.name, 'de'));

			regions = [
				...(countryRegion ? [{ value: countryRegion.id, label: 'Österreich' }] : []),
				...stateRegions.map((r) => ({ value: r.id, label: r.name }))
			];

			// Default to country-level
			if (countryRegion) selectedRegion = countryRegion.id;

			// Fetch all mikrozensus data (all AT regions, absolute, non-total)
			const rows = await directus.request(
				readItems('energy_heating_systems', {
					filter: {
						source: { _eq: SOURCE },
						unit: { _eq: 'absolute' },
						category: { _neq: 'total' }
					},
					sort: ['period'],
					limit: -1
				})
			);

			if (!rows?.length) return;

			// Group by region UUID → year → category
			const grouped = new Map();
			for (const row of rows) {
				const year = new Date(row.period).getFullYear();
				if (!grouped.has(row.region)) grouped.set(row.region, new Map());
				const regionMap = grouped.get(row.region);
				if (!regionMap.has(year)) regionMap.set(year, new Map());
				regionMap.get(year).set(row.category, row.value);
			}

			allData = grouped;

			// Build chart data for SSR/table export using AT country data
			if (onChartData && countryRegion) {
				const atData = grouped.get(countryRegion.id);
				if (atData) {
					const years = [...atData.keys()].sort((a, b) => a - b);
					const columns = [
						{ key: 'year', label: 'Jahr', align: 'left' },
						...CATEGORIES.map((c) => ({
							key: c.key,
							label: v?.[c.key] || c.key,
							align: 'right',
							format: (val) =>
								typeof val === 'number' ? val.toLocaleString('de-AT') : '–'
						}))
					];
					const tableRows = years.map((year) => {
						const yearData = atData.get(year);
						const row = { year };
						for (const c of CATEGORIES) {
							row[c.key] = yearData?.get(c.dbCategory) ?? null;
						}
						return row;
					});
					onChartData({
						raw: tableRows,
						table: { columns, rows: tableRows, filename: 'heizungen_historisch' },
						meta: {
							source: 'Statistik Austria, Mikrozensus Energieeinsatz der Haushalte'
						}
					});
				}
			}
		} catch (err) {
			console.error('heatingHistorical: failed to fetch data', err);
		}
	}

	fetchData();
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col sm:flex-row justify-between gap-2">
		<Select
			label="Region auswählen"
			hideLabel
			options={regions}
			bind:value={selectedRegion}
		/>
	</div>

	<Legend items={legendItems} bind:hidden={hiddenSeries} interactive />

	{#if dataset.length > 0}
		<Chart
			data={dataset}
			x="year"
			y={visibleKeys}
			xType="band"
			height={320}
			margin={{ top: 15, right: 20, bottom: 35, left: 65 }}
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
				<AxisY {yScale} {innerWidth} {innerHeight} format={formatY} unit={v?.households || ''} />
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={String} />

				{#each CATEGORIES as cat}
					{#if !hiddenSeries.has(cat.key)}
						<Line
							{data}
							x="year"
							y={cat.key}
							{xScale}
							{yScale}
							stroke={cat.color}
							strokeWidth={2}
							curve="monotone"
							dots
							dotRadius={3}
							{hover}
						/>
					{/if}
				{/each}
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
