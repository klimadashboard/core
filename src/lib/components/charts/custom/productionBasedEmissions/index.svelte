<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { getYearlyPopulationByRegionID } from '$lib/utils/directus.helper';
	import Papa from 'papaparse';
	import Switch from '$lib/components/Switch.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { Chart, AxisX, AxisY, Tooltip } from '$lib/components/charts/primitives';
	import {
		IconBolt,
		IconBuildingFactory2,
		IconHome2,
		IconCar,
		IconTractor,
		IconRecycle,
		IconWind
	} from '@tabler/icons-svelte-runes';

	export const chart = undefined;
	export let v;
	export let onChartData = undefined;

	const isAT = PUBLIC_VERSION === 'at';

	const SOURCES = ['BLI 2025 (1990-2023)', 'OLI 2025 (1990-2024)', 'Abschätzung UBA'];

	const classifications = [
		{ label: 'Gesamt', key: 'Gesamt' },
		{ label: 'Emissionshandel (ETS)', key: 'EH' },
		{ label: 'Nicht-Emissionshandel (Non-ETS)', key: 'KSG' }
	];

	// Column name mapping for DE CSV → unified keys
	const DE_COL_MAP = {
		energy_co2e_t: 'Energie',
		industry_co2e_t: 'Industrie',
		buildings_co2e_t: 'Gebäude',
		traffic_co2e_t: 'Verkehr',
		agriculture_co2e_t: 'Landwirtschaft',
		waste_and_other_co2e_t: 'Müll',
		total_co2e_t: 'Gesamt'
	};

	const sectors = [
		{
			key: 'Energie',
			label: 'Energie',
			color: '#BD3737',
			iconComponent: IconBolt
		},
		{
			key: 'Industrie',
			label: 'Industrie',
			color: '#373949',
			iconComponent: IconBuildingFactory2
		},
		{
			key: 'Gebäude',
			label: 'Gebäude',
			color: '#4880A8',
			iconComponent: IconHome2
		},
		{
			key: 'Verkehr',
			label: 'Verkehr',
			color: '#F5AF4A',
			iconComponent: IconCar
		},
		{
			key: 'Landwirtschaft',
			label: 'Landwirtschaft',
			color: '#65987D',
			iconComponent: IconTractor
		},
		{
			key: 'Müll',
			label: 'Abfallwirtschaft',
			color: '#B7693D',
			iconComponent: IconRecycle
		},
		{
			key: 'F-Gase',
			label: 'Fluorierte Gase',
			color: '#7CAFBA',
			iconComponent: IconWind
		}
	];

	let rawData = null;
	let rawKeys = [];
	let defaultRegion = null;
	let populations = null;
	let intl_flights = null;
	let hasPerCapitaCols = false; // DE CSV has pre-computed per-capita columns

	$: selectedClassification = classifications[0].key;
	$: selectedRegion = defaultRegion;
	$: activeView = 'KSG';
	$: showPerCapita = false;
	$: showFlightEmissions = false;
	$: freezeYAxis = false;

	// Restrict sectors based on classification
	$: availableSectors =
		selectedClassification === 'EH'
			? sectors.filter((d) => ['Energie', 'Industrie'].includes(d.key))
			: sectors.filter((d) => rawKeys.indexOf(d.key) > -1);

	const aggregatedViews = [
		{ key: 'KSG', label: 'Gesamt', icon: null, color: '#4DB263' },
		{ key: 'sector_overview', label: 'Sektoren', icon: null, color: '#4DB263' }
	];

	$: views = aggregatedViews.concat(availableSectors);

	$: selectedSectors =
		activeView === 'sector_overview'
			? availableSectors
			: views.filter((e) => e.key === activeView);

	// Force Gesamt view when EH classification is selected
	$: if (selectedClassification === 'EH') {
		activeView = 'KSG';
	}

	// Flight emissions: only for national total, Gesamt classification, not per-capita
	$: allowFlightEmissions =
		(activeView === 'sector_overview' || activeView === 'KSG') &&
		!showPerCapita &&
		selectedClassification === 'Gesamt' &&
		selectedRegion === 'Österreich' &&
		intl_flights != null;

	// Region list and select options
	$: regions = rawData ? [...new Set(rawData.map((d) => d.region))].filter(Boolean) : [];
	$: regionOptions = regions.map((r) => ({ value: r, label: r }));
	$: classificationOptions = classifications.map((c) => ({ value: c.key, label: c.label }));

	// Build stacked chart data for BarStack primitive
	$: stackedData = buildStackedData(
		rawData, selectedRegion, selectedSectors, selectedClassification,
		showPerCapita, populations, showFlightEmissions, allowFlightEmissions, intl_flights
	);
	$: yMaxValue = stackedData.length > 0 ? Math.max(...stackedData.map((d) => d.total)) : 0;
	$: frozenYMax = null;

	$: if (freezeYAxis && frozenYMax === null && yMaxValue > 0) {
		frozenYMax = yMaxValue;
	}
	$: if (!freezeYAxis) {
		frozenYMax = null;
	}

	$: effectiveYMax = frozenYMax ?? yMaxValue;

	// Magnitude-aware Y-axis formatting
	$: yDivisor = showPerCapita ? 1 : effectiveYMax >= 1_000_000 ? 1_000_000 : effectiveYMax >= 1_000 ? 1_000 : 1;
	$: yUnit = showPerCapita ? 't/Kopf' : effectiveYMax >= 1_000_000 ? 'Mio. t' : effectiveYMax >= 1_000 ? 'Tsd. t' : 't';

	// Dynamic left margin based on formatted tick label width
	$: leftMargin = (() => {
		const sample = formatY(Math.ceil(effectiveYMax));
		return Math.max(sample.length * 7 + 16, 35);
	})();

	/**
	 * Build stacked data from wide-format pivot rows.
	 * After pivot_multikey (AT) or CSV mapping (DE), each row has sector values as direct properties:
	 *   { year, region, classification, Energie: 1234, Industrie: 5678, ... }
	 */
	function buildStackedData(data, region, selectedSecs, classification, perCapita, pops, flights, allowFlights, flightData) {
		if (!data || !region) return [];

		const filtered = data.filter(
			(d) => d.region === region && d.classification === classification
		);

		// Group by year — take first row per year (sources don't overlap for a given region)
		const byYear = new Map();
		for (const row of filtered) {
			if (!byYear.has(row.year)) {
				byYear.set(row.year, row);
			}
		}

		const years = [...byYear.keys()].sort((a, b) => a - b);

		return years.map((year) => {
			const entry = byYear.get(year);
			let y0 = 0;

			const segments = selectedSecs.map((sec) => {
				let value;
				if (classification === 'EH' && activeView === 'KSG') {
					// Sum energy and industry for EH total
					value = (entry['Energie'] ?? 0) + (entry['Industrie'] ?? 0);
				} else if (sec.key === 'KSG') {
					// Gesamt aggregate: use 'Gesamt' column (DE) or sum sectors (AT)
					value = entry['Gesamt'] ?? sectors.reduce((sum, s) => sum + (entry[s.key] ?? 0), 0);
				} else {
					value = entry[sec.key] ?? 0;
				}

				// Per-capita
				if (perCapita) {
					if (hasPerCapitaCols) {
						// DE: use pre-computed per-capita columns from CSV
						if (sec.key === 'KSG') {
							value = entry['Gesamt_percapita'] ?? 0;
						} else {
							value = entry[sec.key + '_percapita'] ?? 0;
						}
					} else if (pops) {
						// AT: divide by population
						const regionId = entry.region_id;
						const regionPops = pops[regionId];
					const pop =
						regionPops?.find(
							(p) => year === parseInt(String(p.period).slice(0, 4), 10)
						) ?? regionPops?.at(-1);
						if (pop?.value) value /= pop.value;
					}
				}

				const y1 = y0 + (value || 0);
				const seg = {
					key: sec.key,
					label: v?.[sec.key] || sec.label,
					value: value || 0,
					y0,
					y1,
					color: sec.color,
					estimate: entry.isEstimate ?? false
				};
				y0 = y1;
				return seg;
			});

			// Add flight emissions if enabled
			if (flights && allowFlights && flightData) {
				const flight = flightData.find((e) => e.year === year);
				if (flight?.value) {
					let flightValue = Math.round(flight.value);
					if (perCapita) {
						if (hasPerCapitaCols) {
							// DE doesn't have per-capita flights, skip
							flightValue = 0;
						} else if (pops) {
							const regionId = entry.region_id;
							const pop = pops[regionId]?.find(
								(p) => year === new Date(p.period).getFullYear()
							);
							if (pop?.value) flightValue /= pop.value;
						}
					}
					if (flightValue > 0) {
						segments.push({
							key: 'flight',
							label: 'Int. Flugverkehr',
							value: flightValue,
							y0,
							y1: y0 + flightValue,
							color: '#7586C1',
							estimate: false
						});
						y0 += flightValue;
					}
				}
			}

			return { label: year, total: y0, segments };
		});
	}

	$: formatY = (val) => {
		if (showPerCapita) {
			return val.toLocaleString('de-AT', { maximumFractionDigits: 1 });
		}
		const divided = val / yDivisor;
		if (Number.isInteger(divided)) return String(divided);
		return divided.toLocaleString('de-AT', { maximumFractionDigits: 1 });
	};

	function buildTooltipItems(hoverX, data) {
		const bar = data.find((d) => d.label === hoverX);
		if (!bar) return [];
		return bar.segments
			.filter((s) => s.value > 0)
			.sort((a, b) => b.value - a.value)
			.map((s) => ({
				label: s.label,
				value: showPerCapita
					? s.value.toLocaleString('de-AT', { maximumFractionDigits: 2 }) + ' t'
					: Math.round(s.value).toLocaleString('de-AT') + ' t',
				color: s.color
			}));
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
							source: { _in: SOURCES }
						}
					]
				},
				sort: ['year', 'region.name'],
				fields: [
					'category.label', 'gas.name', 'gas.unit', 'id',
					'region.id', 'region.name', 'source', 'type', 'value', 'year'
				],
				limit: -1
			})
		);

		const flatData = data.map((row) => ({
			id: row.id,
			source: row.source,
			value: row.value,
			year: row.year,
			region_id: row.region?.id,
			region: row.region?.name,
			sektor: row.category?.label,
			pollutant: row.gas?.name,
			unit: row.gas?.unit,
			classification: row.type,
			isEstimate: row.source === 'Abschätzung UBA'
		}));

		// Group by year+classification+region, merging sector values across sources
		const grouped = new Map();
		for (const row of flatData) {
			if (!row.region) continue; // skip rows without a region
			// Normalize null classification to 'Gesamt' — OLI rows have type=null
			const cls = row.classification ?? 'Gesamt';
			const key = `${row.year}-${cls}-${row.region}-${row.region_id}`;
			if (!grouped.has(key)) {
				grouped.set(key, {
					year: row.year,
					classification: cls,
					region: row.region,
					region_id: row.region_id,
					isEstimate: row.isEstimate
				});
			}
			const entry = grouped.get(key);
			// Set sector value (later source overwrites earlier — OLI overwrites BLI for overlapping years)
			if (row.sektor != null && row.value != null) {
				entry[row.sektor] = row.value;
			}
			if (row.isEstimate) entry.isEstimate = true;
		}

		rawData = [...grouped.values()];
		// Default to the last region in sorted data (typically the national total)
		const regionNames = [...new Set(flatData.map((d) => d.region))];
		defaultRegion = regionNames.includes('Österreich') ? 'Österreich' : regionNames[regionNames.length - 1];
		rawKeys = [...new Set(flatData.map((row) => row.sektor))];

		// Fetch population data
		const regionIds = [...new Set(flatData.map((d) => d.region_id))];
		const temp_populations = {};
		for (const id of regionIds) {
			temp_populations[id] = await getYearlyPopulationByRegionID(id);
		}
		populations = temp_populations;

		// Fetch international flight emissions
		try {
			const flightData = await directus.request(
				readItems('emissions_data', {
					filter: {
						_and: [
							{
								country: { _eq: PUBLIC_VERSION.toUpperCase() },
								category: { _eq: 'Memo 1 D 1 a' },
								gas: { _eq: 'THG' }
							}
						]
					},
					sort: ['year', 'region.name'],
					fields: ['value', 'year', 'region', 'region.name'],
					limit: -1
				})
			);
			intl_flights = flightData;
		} catch (e) {
			console.warn('Could not fetch flight emissions data', e);
		}

		// Pass chart data to Card
		if (onChartData) {
			const gesamtRows = flatData.filter(
				(d) => d.classification == null || d.classification === 'Gesamt'
			);
			const latestYear = Math.max(...gesamtRows.map((d) => d.year));
			const availableSecs = [...new Set(gesamtRows.map((d) => d.sektor))];

			const columns = [
				{ key: 'region', label: 'Region', align: 'left' },
				...sectors
					.filter((s) => availableSecs.includes(s.key))
					.map((s) => ({
						key: s.key,
						label: v?.[s.key] || s.label,
						align: 'right',
						format: (val) => (typeof val === 'number' ? Math.round(val).toLocaleString('de-AT') : '–')
					}))
			];

			const regionNames = [...new Set(gesamtRows.map((d) => d.region))].sort();
			const tableRows = regionNames.map((region) => {
				const regionData = gesamtRows.filter(
					(d) => d.region === region && d.year === latestYear
				);
				const row = { region };
				for (const s of sectors) {
					row[s.key] = regionData.find((d) => d.sektor === s.key)?.value ?? null;
				}
				return row;
			});

			onChartData({
				raw: flatData,
				table: { columns, rows: tableRows, filename: 'emissionen_nach_sektoren' },
				placeholders: { dataYear: String(latestYear) },
				meta: { source: 'Bundesländer Inventur, Umweltbundesamt' }
			});
		}
	}

	// ── DE: Fetch from CSV ───────────────────────────────────────────────
	function fetchDataDE() {
		return new Promise((resolve, reject) => {
			Papa.parse(
				`https://data.klimadashboard.org/${PUBLIC_VERSION}/emissions/emissions_by_sectors.csv`,
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

						// Map CSV columns to unified sector keys
						// CSV uses 'state' column (e.g. 'DE'), not 'region'
						const mapped = csvRows.map((row) => {
							const entry = {
								year: row.year,
								region: row.state ?? row.region ?? 'Deutschland',
								region_id: null,
								classification: 'Gesamt',
								isEstimate: false
							};
							// Map sector columns
							for (const [csvKey, unifiedKey] of Object.entries(DE_COL_MAP)) {
								entry[unifiedKey] = row[csvKey] ?? null;
							}
							// Map per-capita columns
							for (const [csvKey, unifiedKey] of Object.entries(DE_COL_MAP)) {
								const pcKey = csvKey + '_percapita';
								if (row[pcKey] != null) {
									entry[unifiedKey + '_percapita'] = row[pcKey];
								}
							}
							return entry;
						});

						rawData = mapped;
						hasPerCapitaCols = csvRows[0]?.total_co2e_t_percapita != null;
						defaultRegion = mapped[0]?.region;
						rawKeys = sectors.filter((s) => mapped.some((r) => r[s.key] != null)).map((s) => s.key);

						// Extract flight data from the CSV's international_flight_co2e_t column
						const flightRows = csvRows
							.filter((r) => r.international_flight_co2e_t != null)
							.map((r) => ({
								year: r.year,
								value: r.international_flight_co2e_t,
								region: r.region
							}));
						if (flightRows.length > 0) {
							intl_flights = flightRows;
						}

						// Pass chart data to Card
						if (onChartData) {
							const latestYear = Math.max(...mapped.map((d) => d.year));
							const regionNames = [...new Set(mapped.map((d) => d.region))].sort();

							const columns = [
								{ key: 'region', label: 'Region', align: 'left' },
								...sectors
									.filter((s) => rawKeys.includes(s.key))
									.map((s) => ({
										key: s.key,
										label: v?.[s.key] || s.label,
										align: 'right',
										format: (val) => (typeof val === 'number' ? Math.round(val).toLocaleString('de-AT') : '–')
									}))
							];

							const tableRows = regionNames.map((region) => {
								const regionData = mapped.filter(
									(d) => d.region === region && d.year === latestYear
								);
								const row = { region };
								if (regionData.length > 0) {
									for (const s of sectors) {
										row[s.key] = regionData[0][s.key] ?? null;
									}
								}
								return row;
							});

							onChartData({
								raw: csvRows,
								table: { columns, rows: tableRows, filename: 'emissionen_nach_sektoren' },
								placeholders: { dataYear: String(latestYear) },
								meta: { source: 'Umweltbundesamt' }
							});
						}

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
			console.error('productionBasedEmissions: failed to fetch data', err);
		}
	}

	fetchData();
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap gap-3 items-end">
		{#if regions.length > 1}
			<Select
				label="Region"
				bind:value={selectedRegion}
				options={regionOptions}
				hideLabel
			/>
		{/if}

		{#if isAT}
			<Select
				label="Klassifizierung"
				bind:value={selectedClassification}
				options={classificationOptions}
				hideLabel
			/>
		{/if}
	</div>

	<div class="flex flex-wrap gap-4 items-center">
		{#if allowFlightEmissions}
			<Toggle
				label="Int. Flugverkehr"
				bind:checked={showFlightEmissions}
				disabled={intl_flights === null}
			/>
		{/if}

		<Toggle
			label="Y-Achse fixieren"
			bind:checked={freezeYAxis}
		/>

		<Toggle
			label="Pro-Kopf Emissionen"
			bind:checked={showPerCapita}
			disabled={!hasPerCapitaCols && populations === null}
		/>
	</div>

	{#if stackedData.length > 0}
		<Chart
			data={stackedData}
			x="label"
			y="total"
			xType="band"
			height={320}
			yMax={effectiveYMax * 1.1}
			margin={{ top: 10, right: 20, bottom: 40, left: leftMargin }}
			padding={0.15}
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
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={String}
					tickCount={7}
				/>

				<!-- Custom bar rendering: estimates get dashed outline, no fill -->
				<g class="mark-bar-stack">
					{#each data as d}
						{@const barX = xScale(d.label) ?? 0}
						{@const bw = xScale.bandwidth?.() ?? 20}
						{@const isHovered = hover.x === d.label}
						{@const dimmed = hover.x !== null && !isHovered}

						{#each d.segments as seg, si}
							{@const segY = yScale(seg.y1)}
							{@const segH = Math.max(0, yScale(seg.y0) - yScale(seg.y1))}
							{@const isTop = si === d.segments.length - 1}

							{#if seg.estimate}
								<rect
									x={barX + 1}
									y={segY + 1}
									width={Math.max(0, bw - 2)}
									height={Math.max(0, segH - 2)}
									fill="none"
									stroke={seg.color}
									stroke-width="1.5"
									stroke-dasharray="4 2"
									opacity={dimmed ? 0.4 : 0.8}
									rx={isTop ? 2 : 0}
									ry={isTop ? 2 : 0}
									class="transition-opacity duration-100"
								>
									<title>{seg.label || seg.key}: {seg.value.toLocaleString('de-AT')} (Schätzung)</title>
								</rect>
							{:else}
								<rect
									x={barX}
									y={segY}
									width={bw}
									height={segH}
									fill={seg.color}
									opacity={dimmed ? 0.4 : 1}
									rx={isTop ? 2 : 0}
									ry={isTop ? 2 : 0}
									class="transition-opacity duration-100"
								>
									<title>{seg.label || seg.key}: {seg.value.toLocaleString('de-AT')}</title>
								</rect>
							{/if}
						{/each}
					{/each}
				</g>

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

	{#if selectedClassification !== 'EH' || !isAT}
		<Switch
			{views}
			{activeView}
			on:itemClick={(event) => {
				activeView = event.detail;
			}}
		/>
	{/if}
</div>
