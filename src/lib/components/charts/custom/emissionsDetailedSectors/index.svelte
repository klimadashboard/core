<script>
	import HistoryChart from './HistoryChart.svelte';
	import SectorsTreeChart from './SectorsTreeChart.svelte';
	import { glossaryItem } from '$lib/stores/glossary';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Loader from '$lib/components/Loader.svelte';
	import { page } from '$app/state';
	import { Select, RangeSlider, Toggle } from '$lib/components/ui';
	import {
		IconBuildingFactory2,
		IconCar,
		IconBolt,
		IconHome2,
		IconTractor,
		IconRecycle,
		IconWind,
		IconPlane,
		IconTruck,
		IconTruckDelivery,
		IconDropletPin,
		IconFlame,
		IconMeat,
		IconChevronRight,
		IconCircle,
		IconCircleArrowLeft
	} from '@tabler/icons-svelte-runes';

	export let chart = undefined;
	export let onChartData = undefined;

	let dataset = null;
	let explanations = null;

	let maxYear = PUBLIC_VERSION == 'at' ? 2022 : 2021;

	let years = Array.from({ length: maxYear - 1990 + 1 }).map((_, i) => 1990 + i);

	let ghGas = [
		{ key: 'THG', label: 'Alle Treibhausgase' },
		{ key: 'CO2', label: 'CO₂' },
		{ key: 'CH4', label: 'Methan' },
		{ key: 'N2O', label: 'Lachgas (N₂O)' },
		{ key: 'FLU', label: 'Fluorierte Gase' }
	];

	let ksgSectors = [
		{
			label: 'Industrie',
			color: 'industry',
			colorCode: '#373949',
			colorCodeHighlighted: '#21222c',
			colorCodeLight: '#e2e3e9',
			iconComponent: IconBuildingFactory2
		},
		{
			label: 'Mobilität',
			color: 'traffic',
			colorCode: '#f6af4c',
			colorCodeHighlighted: '#f3991b',
			colorCodeLight: 'hsl(35, 90%, 90%)',
			iconComponent: IconCar
		},
		{
			label: 'Energie',
			color: 'energy',
			colorCode: '#be3737',
			colorCodeHighlighted: '#962c2c',
			colorCodeLight: 'hsl(0, 55%, 90%)',
			iconComponent: IconBolt
		},
		{
			label: 'Gebäude',
			color: 'buildings',
			colorCode: 'hsl(205, 40%, 47%)',
			colorCodeHighlighted: 'hsl(205, 40%, 37%)',
			colorCodeLight: 'hsl(205, 40%, 90%)',
			iconComponent: IconHome2
		},
		{
			label: 'Land&shy;wirt&shy;schaft',
			color: 'agriculture',
			colorCode: 'hsl(148, 20%, 50%)',
			colorCodeHighlighted: 'hsl(148, 20%, 40%)',
			colorCodeLight: 'hsl(148, 20%, 90%)',
			iconComponent: IconTractor
		},
		{
			label: 'Abfall',
			color: 'waste',
			colorCode: 'hsl(22, 50%, 48%)',
			colorCodeHighlighted: 'hsl(22, 50%, 38%)',
			colorCodeLight: 'hsl(22, 50%, 90%)',
			iconComponent: IconRecycle
		},
		{
			label: 'Fluorierte Gase',
			color: 'fluorinated',
			colorCode: 'hsl(191, 31%, 61%)',
			colorCodeHighlighted: 'hsl(191, 31%, 51%)',
			colorCodeLight: 'hsl(191, 31%, 90%)',
			iconComponent: IconWind
		},
		{
			label: 'Memo',
			color: 'memo',
			colorCode: 'hsl(227, 38%, 61%)',
			colorCodeHighlighted: 'hsl(227, 38%, 51%)',
			iconComponent: IconPlane
		}
	];
	const colorForKey = (key) => ksgSectors.find((sector) => sector.color == key);
	let rows =
		PUBLIC_VERSION == 'at'
			? [2, 3, (sortedData?.length || 8) - 5]
			: [2, 2, (sortedData?.length || 8) - 4];

	let crfIcons = [
		// Auto
		{
			codes: ['1 A 3 b 1'],
			iconComponent: IconCar
		},
		// Sattelschlepper
		{
			codes: ['1 A 3 b 3'],
			iconComponent: IconTruck
		},
		// Campervan
		// { codes: ['1 A 3 b 2'], icon: (size) => `<svg width="${size * 30}" height="${size * 50}" viewBox="0 0 85 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.0111 46.5221C30.6071 46.5221 33.5221 43.6071 33.5221 40.0111C33.5221 36.415 30.6071 33.5 27.0111 33.5C23.415 33.5 20.5 36.415 20.5 40.0111C20.5 43.6071 23.415 46.5221 27.0111 46.5221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M65.0111 46.5221C68.6071 46.5221 71.5221 43.6071 71.5221 40.0111C71.5221 36.415 68.6071 33.5 65.0111 33.5C61.415 33.5 58.5 36.415 58.5 40.0111C58.5 43.6071 61.415 46.5221 65.0111 46.5221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 40V5C8 4.44772 8.44772 4 9 4H66.4683C66.8007 4 67.1114 4.16523 67.2973 4.44086L77.3977 19.4173C80.0715 23.3819 81.5 28.0548 81.5 32.8367V39C81.5 39.5523 81.0523 40 80.5 40H71M4 40H20.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M33.5 40H58.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M79 22.5H8" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M52.5 5.5V22.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>` },
		// Schottertranspo30
		{
			codes: ['1 A 3 b 2'],
			iconComponent: IconTruckDelivery
		},
		// Lieferwagen
		// { codes: ['1 A 3 b 2'], icon: (size) => `<svg width="${size * 30}" height="${size * 55}" viewBox="0 0 76 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.5111 51.0221C27.107 51.0221 30.0221 48.1071 30.0221 44.5111C30.0221 40.915 27.107 38 23.5111 38C19.9151 38 17 40.915 17 44.5111C17 48.1071 19.9151 51.0221 23.5111 51.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M59.0111 51.0221C62.607 51.0221 65.5221 48.1071 65.5221 44.5111C65.5221 40.915 62.607 38 59.0111 38C55.4151 38 52.5 40.915 52.5 44.5111C52.5 48.1071 55.4151 51.0221 59.0111 51.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 45V14.5L44.371 4H9V45" stroke="white" stroke-width="6.45" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 15H68.3636L72 25.5V43C72 44.1046 71.1046 45 70 45H68.3636" stroke="white" stroke-width="6.45" stroke-linecap="round" stroke-linejoin="round"/><path d="M52 45H30" stroke="white" stroke-width="6.45" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 45H4.5" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M4 28H22" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>` },
		// LKW-Kabi
		// { codes: ['1 A 3 b 2'], icon: (size) => `<svg width="${size * 30}" height="${size * 58}" viewBox="0 0 76 58" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M56.4889 54.0221C52.893 54.0221 49.9779 51.1071 49.9779 47.5111C49.9779 43.915 52.893 41 56.4889 41C60.0849 41 63 43.915 63 47.5111C63 51.1071 60.0849 54.0221 56.4889 54.0221Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M25.4889 54.3222C21.8929 54.3222 18.9779 51.4072 18.9779 47.8111C18.9779 44.2151 21.8929 41.3 25.4889 41.3C29.085 41.3 32 44.2151 32 47.8111C32 51.4072 29.085 54.3222 25.4889 54.3222Z" stroke="white" stroke-width="6.51107" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 48H9.43448M17.6979 48H9.43448M63.7366 48H71C71.5523 48 72 47.5523 72 47V33H15.4345C12.1208 33 9.43448 35.6863 9.43448 39V48M50.1517 48H32.2759" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M58 10V31" stroke="white" stroke-width="6.45"/><path d="M41 48V10C41 9.44772 41.4477 9 42 9H55C64.3888 9 72 16.6112 72 26V39.9706" stroke="white" stroke-width="6.45"/><path d="M41 10.5V9C41 6.23858 38.7614 4 36 4H34" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M41 10.5V9C41 6.23858 38.7614 4 36 4H34" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>` },
		// Flugzeug
		{
			codes: ['1 A 3 a'],
			iconComponent: IconPlane
		},
		// Energy
		{
			codes: ['1 A 2 g'],
			iconComponent: IconBolt
		},
		// Öl-Pipeline
		{
			codes: ['2 A'],
			iconComponent: IconDropletPin
		},
		// Valve
		{
			codes: ['1 A 2 c'],
			iconComponent: IconFlame
		},
		// Silo
		// { codes: [''], icon: (size) => `<svg width="${size * 30}" height="${ size * 30 }" viewBox="0 0 68 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 66L64 66" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M28 18.5C28 10.4919 34.4919 4 42.5 4V4C50.5081 4 57 10.4919 57 18.5V66H28V18.5Z" stroke="white" stroke-width="6.45"/><path d="M30 21L56 21" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M46 17V52" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M10 49V66" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M5 50L27 45" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>` },
		// Speicher
		// {codes: [''],icon: (size) =>`<svg width="${size * 30}" height="${size * 30}" viewBox="0 0 69 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 13.3299C4 12.8731 4.31738 12.4722 4.76021 12.3601C27.743 6.54436 39.9352 6.54661 64.2265 12.3673C64.6754 12.4749 65 12.8788 65 13.3404V60C65 60.5523 64.5523 61 64 61H5C4.44771 61 4 60.5523 4 60V13.3299Z" stroke="white" stroke-width="6.45"/><path d="M37 4V60" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M51 4V60" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M35.5333 19.1373L52 20.6343" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M35.5333 34.1071L52 35.6041" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M35.5333 48.0768L52 49.5738" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`},
		// Ochse
		// {codes: [''],icon: (size) =>`<svg width="${size * 30}" height="${size * 30}" viewBox="0 0 86 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M82 10H29C20.7157 10 14 16.7157 14 25V51.5858C14 52.4767 15.0771 52.9229 15.7071 52.2929L28.2071 39.7929C28.3946 39.6054 28.649 39.5 28.9142 39.5H47.1243C47.3665 39.5 47.6005 39.5879 47.7828 39.7474L61.8415 52.0488C62.4881 52.6146 63.5 52.1554 63.5 51.2962V30" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M32 10H14C8.47715 10 4 14.4772 4 20V31" stroke="white" stroke-width="6.45" stroke-linecap="round"/><path d="M76.5 4L70.7891 25.5257C70.3239 27.2792 68.7369 28.5 66.9228 28.5H61.5772C59.7631 28.5 58.1761 27.2792 57.7109 25.5257L52 4" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`},
		// Kuh
		{
			codes: ['3 A'],
			iconComponent: IconMeat
		},
		// Kalb
		// {codes: [''],icon: (size) =>`<svg width="${size * 30}" height="${size * 30}" viewBox="0 0 83 60" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M53.6437 12.2436H27.6404C19.156 12.2436 12.6217 19.7302 13.7689 28.1366L17.4534 55.1352C17.521 55.6307 17.9442 56 18.4442 56H23.8129C24.2877 56 24.6971 55.6661 24.7925 55.201L26.5741 46.5183C27.3376 42.7974 30.6124 40.1263 34.4109 40.1263H36.5606C40.359 40.1263 43.6338 42.7974 44.3973 46.5183L46.1789 55.201C46.2744 55.6661 46.6837 56 47.1585 56H52.5652C53.1472 56 53.6061 55.5049 53.5613 54.9246C52.6984 43.7439 51.4739 28.7308 62.4513 28.7308L77.1035 25.9368C77.7698 25.8098 78.3262 25.3538 78.5817 24.7254L79.5147 22.4304C79.8102 21.7034 79.6533 20.8708 79.1135 20.3013L67.5697 8.12179M72.3225 4L63.008 11.7787C62.6483 12.079 62.1946 12.2436 61.726 12.2436H15C8.92487 12.2436 4 17.1685 4 23.2436V37.9368" stroke="white" stroke-width="6.45" stroke-linecap="round"/></svg>`},
		// Fluorierte Gase
		{
			codes: [''],
			iconComponent: IconWind
		}
	];

	const iconForCRFCode = ({ crfCode, ksgKey }) => {
		const crfIcon = crfIcons.find((icon) => icon.codes.indexOf(crfCode) >= 0);
		if (crfIcon) return crfIcon.iconComponent;
		return colorForKey(ksgKey)?.iconComponent;
	};

	const KSG_SECTOR_LABELS = {
		industry: 'Industrie',
		traffic: 'Mobilität',
		energy: 'Energie',
		buildings: 'Gebäude',
		agriculture: 'Landwirtschaft',
		waste: 'Abfall',
		fluorinated: 'Fluorierte Gase'
	};

	const datasetPromise = fetch(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/emissions/emissions_crf_${PUBLIC_VERSION}.json`
	)
		.then((response) => response.json())
		.then((responseData) => {
			dataset = responseData;

			// Derive maxYear dynamically from data
			const thgData = responseData['THG'];
			if (thgData?.length && thgData[0].absolute?.length) {
				maxYear = 1990 + thgData[0].absolute.length - 1;
				selectedYear = maxYear;
				years = Array.from({ length: maxYear - 1990 + 1 }).map((_, i) => 1990 + i);
			}

			// Provide table data to Card for table tab + CSV/JSON download
			if (onChartData && thgData?.length) {
				const sectorData = thgData.filter((s) => s.key !== 'memo' && KSG_SECTOR_LABELS[s.key]);
				const sectorKeys = sectorData.map((s) => s.key);

				const columns = [
					{ key: 'year', label: 'Jahr', align: 'left' },
					...sectorKeys.map((key) => ({
						key,
						label: KSG_SECTOR_LABELS[key],
						align: 'right',
						format: (v) =>
							typeof v === 'number'
								? v.toLocaleString('de-DE', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									})
								: '–'
					})),
					{
						key: 'total',
						label: 'Gesamt',
						align: 'right',
						format: (v) =>
							typeof v === 'number'
								? v.toLocaleString('de-DE', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									})
								: '–'
					}
				];

				const yearCount = thgData[0].absolute.length;
				const tableRows = [];
				for (let yi = 0; yi < yearCount; yi++) {
					const row = { year: 1990 + yi };
					let total = 0;
					for (const sector of sectorData) {
						const val = sector.absolute[yi];
						row[sector.key] = val;
						if (typeof val === 'number') total += val;
					}
					row.total = total > 0 ? total : null;
					tableRows.push(row);
				}

				const latestTotal = tableRows[tableRows.length - 1]?.total ?? 0;

				onChartData({
					raw: tableRows,
					table: { columns, rows: tableRows, filename: 'emissionen_sektoren_detail' },
					hasData: true,
					placeholders: {
						latestYear: String(maxYear),
						totalEmissions: latestTotal.toLocaleString('de-DE', {
							minimumFractionDigits: 1,
							maximumFractionDigits: 1
						})
					},
					meta: { source: 'Umweltbundesamt' }
				});
			}

			return responseData;
		});

	$: data = dataset?.[selectedGhGas].sort(
		(a, b) => b.absolute[maxYear - 1990] - a.absolute[maxYear - 1990]
	);
	$: sectorlyData = data
		?.filter((sector) => (sector.label == 'Memo' ? showFlightEmissions : true))
		.map((sector) => {
			let crfSectors = [...sector.sectors];
			crfSectors = crfSectors.sort((a, b) => {
				const last = maxYear - 1990;
				return a.absolute[last] - b.absolute[last];
			});
			crfSectors = crfSectors.map((crf, c) => {
				return { ...crf, index: c };
			});

			return {
				...sector,
				sectors: crfSectors
			};
		});
	$: memoAvailable = data ? data.find((sector) => sector.label == 'Memo').absolute[0] != 0 : false;

	$: sortedData = sectorlyData?.map((ksg, s) => {
		const row = rows.reduce(
			(row, count, c) => {
				if (!row.foundRow && s >= row.start + count)
					return { start: row.start + count, foundRow: false };
				else
					return {
						start: row.start,
						end: row.end || row.start + count,
						foundRow: true
					};
			},
			{ start: 0, foundRow: false }
		);
		// percentages
		const percentSector = ksg.absolute[_y] / totalSelectedYear;
		const percentCumulative = sectorlyData
			.slice(0, s)
			.reduce((sum, sec) => sum + sec.absolute[_y] / totalSelectedYear, 0);
		const percentRow =
			sectorlyData.slice(row.start, row.end).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;
		const percentPreRow =
			sectorlyData.slice(0, row.start).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;
		const percentUpToKSGIndex =
			sectorlyData.slice(row.start, s).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;

		const selected = ksgSelection == s;
		const w = selected ? 1000 : (1000 * percentSector) / percentRow;
		const h = selected ? 1000 : percentRow * 1000;
		const x = selected ? 0 : (percentUpToKSGIndex / percentRow) * 1000;
		const y = selected ? 0 : percentPreRow * 1000;

		// CRF sectors -----------------------------------------
		let moreSection = { active: false, height: 0, absolute: 0 };

		let crfSectors = ksg.sectors;
		crfSectors = crfSectors.sort((a, b) => {
			return a.absolute[_y] - b.absolute[_y];
		});
		crfSectors = crfSectors.map((crf, c) => {
			const percentUpToCRFIndex =
				ksg.sectors.slice(0, c).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
				totalSelectedYear;
			const w2 = w;
			const h2 = (h * crf.absolute[_y]) / ksg.absolute[_y];
			const x2 = x;
			const y2 = y + h * (percentUpToCRFIndex / (ksg.absolute[_y] / totalSelectedYear));
			moreSection.active = moreSection.active || h2 < 40;
			if (h2 < 40) moreSection.height += h2;
			if (h2 < 40) moreSection.absolute += crf.absolute[_y];

			return {
				index: crf.index,
				absolute: crf.absolute,
				key: crf.key,
				code: crf.code,
				label: crf.label,
				explanation: crf.explanation,
				w2,
				h2,
				x2,
				y2
			};
		});

		// KSG sectors -----------------------------------------
		return {
			absolute: ksg.absolute,
			key: ksg.key,
			ksgSector: ksg.ksgSector,
			label: colorForKey(ksg.key).label,
			sectors: crfSectors,
			percentCumulative,
			relative: percentSector,
			more: {
				active: moreSection.active,
				height: moreSection.height,
				absolute: moreSection.absolute
			},
			w,
			h,
			x,
			y
		};
	});

	// TODO: compare totals to Klimaschutzbericht

	$: totalForYear = (year) =>
		sectorlyData?.reduce((sum, entry) => sum + entry.absolute[year - 1990], 0);
	$: totalSelectedYear = totalForYear(selectedYear);

	// dynamic variables
	let selectedYear = maxYear;
	let selectedGhGas = 'THG';
	$: _y = selectedYear - 1990;

	// TREE PLOT selections
	let ksgSelection = null;
	let crfSelection = null;
	let ksgHover = null;
	let crfHover = null;
	let extensiveList = false;

	// Pre-filter: select a sector on load via chart.options.sector (e.g. "traffic")
	// Uses sectorlyData (not sortedData) to avoid reactive cycle since sortedData depends on ksgSelection
	let initialSelectionApplied = false;
	$: if (sectorlyData && !initialSelectionApplied && chart?.options?.sector) {
		const idx = sectorlyData.findIndex((s) => s.key === chart.options.sector);
		if (idx >= 0) ksgSelection = idx;
		initialSelectionApplied = true;
	}

	let useAbsoluteUnits = false;
	let showFlightEmissions = false;
</script>

{#if sortedData}
	<div class="flex flex-wrap gap-5 items-center sm:justify-center md:justify-start">
		<Select
			label={page.data.translations?.greenhouseGas || 'Treibhausgas'}
			hideLabel
			bind:value={selectedGhGas}
			options={ghGas.map((g) => ({ value: g.key, label: g.label }))}
			small
			on:change={() => {
				ksgSelection = null;
				crfSelection = null;
			}}
		/>

		<div class="w-40">
			<RangeSlider
				label="Jahr"
				hideLabel
				bind:value={selectedYear}
				min={1990}
				max={maxYear}
			/>
		</div>

		{#if memoAvailable}
			<div class="flex items-center gap-1">
				<Toggle
					label="int. Flug- & Schiffverkehr"
					bind:checked={showFlightEmissions}
				/>
				<button
					class="glossary-label"
					aria-label="?"
					on:mousedown={() => glossaryItem.set('memo')}
				></button>
			</div>
		{/if}

		<Toggle label="Absolute Werte" bind:checked={useAbsoluteUnits} />
	</div>

	<div class="relative overflow-hidden mt-6 py-1 border-b sm:text-lg">
		<div class="breadcrumb-slider overflow-x-auto flex items-center pr-8">
			<button
				class="flex space-x-1 items-center group"
				on:mousedown={() => {
					crfSelection = null;
					ksgSelection = null;
					extensiveList = false;
				}}
				disabled={ksgSelection == null}
			>
				{#if ksgSelection !== null}
					<IconCircleArrowLeft size={20} />
				{:else}
					<IconCircle size={20} />
				{/if}
				<span>
					<span
						class="underline-offset-2 group-hover:underline group-disabled:no-underline font-bold"
						>Gesamtemissionen {selectedYear}</span
					>
					<span class="text-sm opacity-70 pb-[2px]"
						>{totalSelectedYear.toFixed(2).replace('.', ',')} Mt CO₂eq (100%)</span
					>
				</span>
			</button>
			{#if ksgSelection != null}
				<IconChevronRight size={24} />
				<button
					class="group overflow"
					style="color: {colorForKey(sortedData[ksgSelection].color)};"
					on:mousedown={() => {
						crfSelection = null;
						extensiveList = false;
					}}
					disabled={crfSelection == null && !extensiveList}
				>
					<span class="group-hover:underline group-disabled:no-underline underline-offset-2"
						>{@html sortedData[ksgSelection].label}</span
					>
					<span class="text-sm max-sm:hidden opacity-70 pb-[2px]"
						>{sortedData[ksgSelection].absolute[_y].toFixed(2).replace('.', ',')} Mt CO₂eq ({(
							(sortedData[ksgSelection].absolute[_y] / totalSelectedYear) *
							100
						)
							.toFixed(2)
							.replace('.', ',')}%)</span
					>
				</button>
			{/if}
			{#if ksgSelection != null && crfSelection != null}
				<IconChevronRight size={24} />
				<span>
					<span>
						{@html sortedData[ksgSelection].sectors.find((sector) => sector.code === crfSelection)
							?.label}
					</span>
					<span class="text-sm max-sm:hidden opacity-70 pb-[2px] ml-1"
						>{sortedData[ksgSelection].sectors
							.find((sector) => sector.code === crfSelection)
							?.absolute[_y].toLocaleString('de-AT', {
								minimumFractionDigits: 1,
								maximumFractionDigits: 1
							})} kt ({Math.round(
							(sortedData[ksgSelection].sectors.find((sector) => sector.code === crfSelection)
								?.absolute[_y] /
								totalSelectedYear) *
								10000
						) / 100}%)</span
					>
				</span>
			{/if}
			<div
				class="absolute top-0 right-0 bottom-0 w-16 bg-linear-to-r from-transparent to-white dark:to-gray-950"
			></div>
		</div>
	</div>

	<div class="relative flex justify-stretch items-stretch flex-wrap gap-x-4">
		<SectorsTreeChart
			{ksgSectors}
			{explanations}
			{sectorlyData}
			{sortedData}
			{colorForKey}
			{iconForCRFCode}
			{years}
			{useAbsoluteUnits}
			{totalSelectedYear}
			{selectedYear}
			bind:ksgSelection
			bind:crfSelection
			bind:ksgHover
			bind:crfHover
			bind:extensiveList
			class="p-4"
		/>
		<HistoryChart
			{years}
			{maxYear}
			{sectorlyData}
			{colorForKey}
			{selectedYear}
			bind:ksgSelection
			bind:crfSelection
			bind:ksgHover
			bind:crfHover
		/>
	</div>
{:else}
	<Loader />
{/if}

<style>
	@reference "tailwindcss/theme";
	.breadcrumb-slider > * {
		@apply shrink-0;
	}
</style>
