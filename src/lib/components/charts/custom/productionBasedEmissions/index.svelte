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

	export let chart;
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
			icon: "<svg width='16' height='20' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 1V8H15L7 19V12H1L9 1Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Industrie',
			label: 'Industrie',
			color: '#373949',
			icon: "<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 17H1L1.00017 5.75676L8.10537 9.21622V5.75676L14.7369 9.21622V1H19V17Z' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Gebäude',
			label: 'Gebäude',
			color: '#4880A8',
			icon: "<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 10H1L10 1L19 10H17' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 10V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H15C15.5304 19 16.0391 18.7893 16.4142 18.4142C16.7893 18.0391 17 17.5304 17 17V10' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 10H8V14H12V10Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Verkehr',
			label: 'Verkehr',
			color: '#F5AF4A',
			icon: "<svg width='20' height='15' viewBox='0 0 20 15' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10C13.8954 10 13 10.8954 13 12C13 13.1046 13.8954 14 15 14Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 12H1V6M1 6L3 1H12L16 6M1 6H16M16 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V12H17M10 6V1' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7 12H13' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Landwirtschaft',
			label: 'Landwirtschaft',
			color: '#65987D',
			icon: "<svg width='20' height='16' viewBox='0 0 20 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 15C7.20914 15 9 13.2091 9 11C9 8.79086 7.20914 7 5 7C2.79086 7 1 8.79086 1 11C1 13.2091 2.79086 15 5 15Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M5 11V11.01' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M17 15C18.1046 15 19 14.1046 19 13C19 11.8954 18.1046 11 17 11C15.8954 11 15 11.8954 15 13C15 14.1046 15.8954 15 17 15Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M8.5 13H15' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18 11.2V7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6H11L9 1H3V7.5' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M16 1H15C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V6' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Müll',
			label: 'Abfallwirtschaft',
			color: '#B7693D',
			icon: "<svg width='22' height='21' viewBox='0 0 22 21' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 18H19C19.3186 17.9836 19.6287 17.8912 19.9043 17.7305C20.1799 17.5698 20.4131 17.3456 20.5843 17.0764C20.7556 16.8073 20.86 16.501 20.8888 16.1833C20.9177 15.8656 20.8701 15.5456 20.75 15.25L20.2 14.25M12 16L10 18L12 20V16Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.80319 7.26807L3.30319 15.0623C3.15811 15.3464 3.08311 15.6611 3.08444 15.9802C3.08578 16.2992 3.16342 16.6133 3.31087 16.8962C3.45832 17.1791 3.67131 17.4226 3.93206 17.6064C4.19281 17.7903 4.49375 17.909 4.80976 17.9528L5.95078 17.9765M8.53524 10.0001L7.80319 7.26807L5.07114 8.00012L8.53524 10.0001Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18.1968 10.7319L13.6968 2.93771C13.5233 2.67 13.2882 2.44769 13.0113 2.28933C12.7343 2.13098 12.4235 2.04117 12.1048 2.02742C11.7861 2.01366 11.4687 2.07635 11.1791 2.21026C10.8895 2.34417 10.6362 2.5454 10.4402 2.79716L9.84922 3.77347M15.4648 9.99988L18.1968 10.7319L18.9289 7.99988L15.4648 9.99988Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'F-Gase',
			label: 'Fluorierte Gase',
			color: '#7CAFBA',
			icon: "<svg width='21' height='20' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 6.00003H11.5C11.9644 6.00892 12.4222 5.88823 12.8218 5.65152C13.2215 5.4148 13.5473 5.07141 13.7627 4.65986C13.9782 4.24832 14.0747 3.78489 14.0414 3.32156C14.0082 2.85824 13.8465 2.41334 13.5745 2.03676C13.3026 1.66019 12.931 1.36683 12.5017 1.1896C12.0723 1.01237 11.602 0.958278 11.1436 1.03338C10.6852 1.10849 10.2568 1.30982 9.90643 1.6148C9.55606 1.91979 9.29758 2.31636 9.16 2.76003' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M1 9.99997H16.5C16.9644 9.99108 17.4222 10.1118 17.8218 10.3485C18.2215 10.5852 18.5473 10.9286 18.7627 11.3401C18.9782 11.7517 19.0747 12.2151 19.0414 12.6784C19.0082 13.1418 18.8465 13.5867 18.5745 13.9632C18.3026 14.3398 17.931 14.6332 17.5017 14.8104C17.0723 14.9876 16.602 15.0417 16.1436 14.9666C15.6852 14.8915 15.2568 14.6902 14.9064 14.3852C14.5561 14.0802 14.2976 13.6836 14.16 13.24' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 14H7.5C7.96443 13.9911 8.42216 14.1118 8.82183 14.3485C9.22151 14.5852 9.54733 14.9286 9.76274 15.3401C9.97816 15.7517 10.0747 16.2151 10.0414 16.6784C10.0082 17.1418 9.8465 17.5867 9.57453 17.9632C9.30256 18.3398 8.93105 18.6332 8.50167 18.8104C8.07229 18.9876 7.60203 19.0417 7.14362 18.9666C6.68522 18.8915 6.2568 18.6902 5.90643 18.3852C5.55605 18.0802 5.29758 17.6836 5.16 17.24' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
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
						const pop = pops[regionId]?.find(
							(p) => year === new Date(p.period).getFullYear()
						);
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
