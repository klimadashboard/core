<script>
	import Papa from 'papaparse';
	import HistoryChart from './HistoryChart.svelte';
	import SectorsTreeChart from './SectorsTreeChart.svelte';
	import LandUseChart from './LandUseChart.svelte';

	let dataset = null;
	let explanations = null;

	Papa.parse('./data/CRF_austria.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			dataset = results.data;
		}
	});
	Papa.parse('./data/CRF_en_de_expl.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			explanations = results.data;
		}
	});

	let ghGas = ['THG', 'CO2', 'CH4', 'N2O', 'HFC', 'PFC', 'SF6', 'NF3'];

	let ksgSectors = [
		{
			label: 'Industrie',
			color: 'industry',
			colorCode: 'rgb(55, 57, 73)',
			icon: "<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 17H1L1.00017 5.75676L8.10537 9.21622V5.75676L14.7369 9.21622V1H19V17Z' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			label: 'Mobilität',
			color: 'mobility',
			colorCode: 'rgb(245, 175, 74)',
			icon: "<svg width='20' height='15' viewBox='0 0 20 15' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10C13.8954 10 13 10.8954 13 12C13 13.1046 13.8954 14 15 14Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 12H1V6M1 6L3 1H12L16 6M1 6H16M16 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V12H17M10 6V1' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7 12H13' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			label: 'Energie',
			color: 'energy',
			colorCode: 'rgb(189, 55, 55)',
			icon: "<svg width='16' height='20' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 1V8H15L7 19V12H1L9 1Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			label: 'Gebäude',
			color: 'building',
			colorCode: 'rgb(72, 128, 168)',
			icon: "<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 10H1L10 1L19 10H17' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 10V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H15C15.5304 19 16.0391 18.7893 16.4142 18.4142C16.7893 18.0391 17 17.5304 17 17V10' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 10H8V14H12V10Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			label: 'Landwirtschaft',
			color: 'agriculture',
			colorCode: 'rgb(101, 152, 125)',
			icon: "<svg width='20' height='16' viewBox='0 0 20 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 15C7.20914 15 9 13.2091 9 11C9 8.79086 7.20914 7 5 7C2.79086 7 1 8.79086 1 11C1 13.2091 2.79086 15 5 15Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M5 11V11.01' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M17 15C18.1046 15 19 14.1046 19 13C19 11.8954 18.1046 11 17 11C15.8954 11 15 11.8954 15 13C15 14.1046 15.8954 15 17 15Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M8.5 13H15' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18 11.2V7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6H11L9 1H3V7.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M16 1H15C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V6' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			label: 'Abfall',
			color: 'waste',
			colorCode: 'rgb(183, 105, 61)',
			icon: "<svg width='22' height='21' viewBox='0 0 22 21' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 18H19C19.3186 17.9836 19.6287 17.8912 19.9043 17.7305C20.1799 17.5698 20.4131 17.3456 20.5843 17.0764C20.7556 16.8073 20.86 16.501 20.8888 16.1833C20.9177 15.8656 20.8701 15.5456 20.75 15.25L20.2 14.25M12 16L10 18L12 20V16Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.80319 7.26807L3.30319 15.0623C3.15811 15.3464 3.08311 15.6611 3.08444 15.9802C3.08578 16.2992 3.16342 16.6133 3.31087 16.8962C3.45832 17.1791 3.67131 17.4226 3.93206 17.6064C4.19281 17.7903 4.49375 17.909 4.80976 17.9528L5.95078 17.9765M8.53524 10.0001L7.80319 7.26807L5.07114 8.00012L8.53524 10.0001Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18.1968 10.7319L13.6968 2.93771C13.5233 2.67 13.2882 2.44769 13.0113 2.28933C12.7343 2.13098 12.4235 2.04117 12.1048 2.02742C11.7861 2.01366 11.4687 2.07635 11.1791 2.21026C10.8895 2.34417 10.6362 2.5454 10.4402 2.79716L9.84922 3.77347M15.4648 9.99988L18.1968 10.7319L18.9289 7.99988L15.4648 9.99988Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			label: 'Fluorierte Gase',
			color: 'fluorinatedGases',
			colorCode: 'rgb(124, 175, 186)',
			icon: "<svg width='21' height='20' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 6.00003H11.5C11.9644 6.00892 12.4222 5.88823 12.8218 5.65152C13.2215 5.4148 13.5473 5.07141 13.7627 4.65986C13.9782 4.24832 14.0747 3.78489 14.0414 3.32156C14.0082 2.85824 13.8465 2.41334 13.5745 2.03676C13.3026 1.66019 12.931 1.36683 12.5017 1.1896C12.0723 1.01237 11.602 0.958278 11.1436 1.03338C10.6852 1.10849 10.2568 1.30982 9.90643 1.6148C9.55606 1.91979 9.29758 2.31636 9.16 2.76003' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M1 9.99997H16.5C16.9644 9.99108 17.4222 10.1118 17.8218 10.3485C18.2215 10.5852 18.5473 10.9286 18.7627 11.3401C18.9782 11.7517 19.0747 12.2151 19.0414 12.6784C19.0082 13.1418 18.8465 13.5867 18.5745 13.9632C18.3026 14.3398 17.931 14.6332 17.5017 14.8104C17.0723 14.9876 16.602 15.0417 16.1436 14.9666C15.6852 14.8915 15.2568 14.6902 14.9064 14.3852C14.5561 14.0802 14.2976 13.6836 14.16 13.24' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 14H7.5C7.96443 13.9911 8.42216 14.1118 8.82183 14.3485C9.22151 14.5852 9.54733 14.9286 9.76274 15.3401C9.97816 15.7517 10.0747 16.2151 10.0414 16.6784C10.0082 17.1418 9.8465 17.5867 9.57453 17.9632C9.30256 18.3398 8.93105 18.6332 8.50167 18.8104C8.07229 18.9876 7.60203 19.0417 7.14362 18.9666C6.68522 18.8915 6.2568 18.6902 5.90643 18.3852C5.55605 18.0802 5.29758 17.6836 5.16 17.24' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			label: 'Memo',
			colorCode: '#ccc,'
		}
		// {
		// 	label: 'LULUCF',
		// 	colorCode: '#e3eef8'
		// }
	];

	let crfSectors = [
		// Total
		// { code: "0", ksgSector: '', crfName: "Total (without LULUCF)", },

		// Energie
		// { code: "1", ksgSector: '', crfName: "Total Energy", },
		// { code: "1 A", ksgSector: '', crfName: "Fuel Combustion Activities (Sectoral Approach)", },
		// { code: "1 A 1", ksgSector: '', crfName: "Energy Industries", },
		{ code: '1 A 1 a', ksgSector: 'Energie', crfName: 'Public Electricity and Heat Production' },
		{ code: '1 A 1 b', ksgSector: 'Energie', crfName: 'Petroleum Refining' },
		{
			code: '1 A 1 c',
			ksgSector: 'Energie',
			crfName: 'Manufacture of Solid Fuels and Other Energy Industries'
		},
		{ code: '1 A 3 e 1', ksgSector: 'Energie', crfName: 'Pipeline Transport' },
		// { code: "1 B", ksgSector: '', crfName: "Fugitive Emissions from Fuels", },
		{ code: '1 B 1', ksgSector: 'Energie', crfName: 'Solid Fuels' },
		{ code: '1 B 2', ksgSector: 'Energie', crfName: 'Oil and Natural Gas' },
		// Industrie
		// { code: "1 A 2", ksgSector: '', crfName: "Manufacturing Industries and Construction", },
		{ code: '1 A 2 a', ksgSector: 'Industrie', crfName: 'Iron and Steel' },
		{ code: '1 A 2 b', ksgSector: 'Industrie', crfName: 'Non-Ferrous Metals' },
		{ code: '1 A 2 c', ksgSector: 'Industrie', crfName: 'Chemicals' },
		{ code: '1 A 2 d', ksgSector: 'Industrie', crfName: 'Pulp, Paper and Print' },
		{ code: '1 A 2 e', ksgSector: 'Industrie', crfName: 'Food Processing, Beverages and Tobacco' },
		{ code: '1 A 2 f', ksgSector: 'Industrie', crfName: 'Non-Metallic Minerals' },
		{ code: '1 A 2 g', ksgSector: 'Industrie', crfName: 'Other (please specify)' },
		// Industry
		// { code: "2", ksgSector: '', crfName: "Total Industrial Processes", },
		{ code: '2 A', ksgSector: 'Industrie', crfName: 'Mineral Industry' },
		{ code: '2 B', ksgSector: 'Industrie', crfName: 'Chemical Industry' },
		{ code: '2 C', ksgSector: 'Industrie', crfName: 'Metal Industry' },
		{
			code: '2 D',
			ksgSector: 'Industrie',
			crfName: 'Non-Energy Products from Fuels and Solvent Use'
		},
		{ code: '2 G', ksgSector: 'Industrie', crfName: 'Other Product Manufacture and Use' },
		// Transport
		// { code: "1 A 3", ksgSector: 'Mobilität', crfName: "Transport", },
		{ code: '1 A 3 a', ksgSector: 'Mobilität', crfName: 'Domestic Aviation' },
		// { code: '1 A 3 b', ksgSector: 'Mobilität', crfName: 'Road Transportation' },
		{ code: '1 A 3 b 1', ksgSector: 'Mobilität', crfName: 'Cars' },
		{ code: '1 A 3 b 2', ksgSector: 'Mobilität', crfName: 'Light duty trucks' },
		{ code: '1 A 3 b 3', ksgSector: 'Mobilität', crfName: 'Heavy duty trucks and buses' },
		{ code: '1 A 3 b 4', ksgSector: 'Mobilität', crfName: 'Motorcycles' },
		{ code: '1 A 3 b 5', ksgSector: 'Mobilität', crfName: 'Other (please specify)' },
		{ code: '1 A 3 c', ksgSector: 'Mobilität', crfName: 'Railways' },
		{ code: '1 A 3 d', ksgSector: 'Mobilität', crfName: 'Domestic Navigation' },
		// { code: "1 A 3 e", ksgSector: 'Mobilität', crfName: "Other Transportation", },
		{ code: '1 A 3 e 2', ksgSector: 'Mobilität', crfName: 'Other (please specify)' },
		{ code: '1 A 5', ksgSector: 'Mobilität', crfName: 'Other' },
		// Buildings
		// { code: "1 A 4", ksgSector: 'Gebäude', crfName: "Other Sectors", },
		{ code: '1 A 4 a', ksgSector: 'Gebäude', crfName: 'Commercial/Institutional' },
		{ code: '1 A 4 b', ksgSector: 'Gebäude', crfName: 'Residential' },
		// Agriculture
		// { code: "3", ksgSector: 'Landwirtschaft', crfName: "Total Agriculture", },
		{ code: '1 A 4 c', ksgSector: 'Landwirtschaft', crfName: 'Agriculture/Forestry/Fishing' },
		{ code: '3 A', ksgSector: 'Landwirtschaft', crfName: 'Enteric Fermentation' },
		{ code: '3 B', ksgSector: 'Landwirtschaft', crfName: 'Manure Management' },
		{ code: '3 D', ksgSector: 'Landwirtschaft', crfName: 'Agricultural Soils' },
		{ code: '3 F', ksgSector: 'Landwirtschaft', crfName: 'Field Burning of Agricultural Residues' },
		{ code: '3 G', ksgSector: 'Landwirtschaft', crfName: 'Liming' },
		{ code: '3 H', ksgSector: 'Landwirtschaft', crfName: 'Urea application' },
		{ code: '3 I', ksgSector: 'Landwirtschaft', crfName: 'Other (please specify)' },
		// F-Gase
		{ code: '2 E', ksgSector: 'Fluorierte Gase', crfName: 'Electronics Industry' },
		{ code: '2 F', ksgSector: 'Fluorierte Gase', crfName: 'Product Uses as Substitutes for ODS' },
		// LULUCF
		// { code: '4', ksgSector: 'LULUCF', crfName: 'Land Use, Land Use Change and Forestry' },
		// { code: '4', ksgSector: 'LULUCF', crfName: 'Total land use categories' },
		// Waste
		// { code: "5", ksgSector: 'Abfall', crfName: "Total Waste", },
		{ code: '5 A', ksgSector: 'Abfall', crfName: 'Solid Waste Disposal' },
		{ code: '5 B', ksgSector: 'Abfall', crfName: 'Biological Treatment of Solid Waste' },
		{ code: '5 C', ksgSector: 'Abfall', crfName: 'Incineration and Open Burning of Waste' },
		{ code: '5 D', ksgSector: 'Abfall', crfName: 'Waste Water Treatment and Discharge' },
		// Memo
		// { code: 'Memo 1 D', ksgSector: 'Memo', crfName: 'Memo items' },
		{ code: 'Memo 1 D 1', ksgSector: 'Memo', crfName: 'International Bunkers' },
		{ code: 'Memo 1 D 1 a', ksgSector: 'Memo', crfName: 'International Aviation' },
		{ code: 'Memo 1 D 1 b', ksgSector: 'Memo', crfName: 'International Navigation' }
	];

	function crf(data) {
		return crfSectors.find((crf) => crf.code === data.CRF_Code.toString());
	}

	$: total1990 = dataset
		?.filter(
			(entry) =>
				entry.Jahr == 1990 && entry.Schadstoff == selectedGhGas && crf(entry) && entry.Werte > 0
		)
		.reduce((sum, entry) => sum + entry.Werte, 0);

	$: totalSelectedYear = dataset
		?.filter(
			(entry) =>
				entry.Jahr == selectedYear &&
				entry.Schadstoff == selectedGhGas &&
				crf(entry) &&
				entry.Werte > 0
		)
		.reduce((sum, entry) => sum + entry.Werte, 0);

	// compare totals to Klimaschutzbericht
	// console.log('1990', total1990 / 10 ** 6);
	// $: console.log('2020', totalSelectedYear / 10 ** 6);

	let years = Array.from({ length: 2020 - 1990 + 1 }).map((_, i) => 1990 + i);

	$: detailLayers = Object.fromEntries(
		new Map(
			years.map((year) => {
				return [
					year,
					ksgSectors.map((ksgSector) => {
						const sectors = selectedSectors?.filter((entry) =>
							entry.Jahr == year && crf(entry) ? crf(entry).ksgSector == ksgSector.label : false
						);
						const total = sectors?.reduce((sum, crf) => sum + crf.Werte, 0);

						return {
							label: ksgSector.label,
							sectors: sectors
								?.map((sec) => {
									const crfNameDE =
										explanations?.find((entry) => entry.crfCode == crf(sec).code).crfNamenDe || '';

									return {
										label: crfNameDE,
										code: crf(sec).code,
										value: sec.Werte,
										absolute: sec.Werte / 1000000,
										relative: sec.Werte / totalSelectedYear
									};
								})
								.sort((secA, secB) => secB.value - secA.value),
							value: total, // t CO2eq
							absolute: total / 1000000, // Mt CO2eq
							relative: total / totalSelectedYear, // % THG / year
							color: ksgSector.color,
							colorCode: ksgSector.colorCode
						};
					})
				];
			})
		)
	);

	// dynamic variables
	let selectedYear = 2020;
	let selectedGhGas = 'THG';
	$: selectedSectors = dataset?.filter((entry) => entry.Schadstoff == selectedGhGas);

	// TREE PLOT selections
	let ksgSelection = null;
	let crfSelection = null;
</script>

{#if dataset}
	<div class="" style="padding: 0.5em; background-color: aliceblue;">
		<div style="position: sticky; top: 64px; background-color: aliceblue; z-index: 1;">
			<input
				type="range"
				min="1990"
				max="2020"
				bind:value={selectedYear}
				name="emission-detail-year"
				id="emission-detail-year"
			/><label for="emission-detail-year">Jahr: {selectedYear}</label><br />

			<label for="emission-detail-ghg">Treibhausgas:</label>
			<select bind:value={selectedGhGas} id="emission-detail-ghg">
				{#each ghGas as ghg}
					<option value={ghg}>{ghg}</option>
				{/each}
			</select>
		</div>
		<hr />

		<div class="flex justify-start items-center flex-wrap">
			<SectorsTreeChart
				{crfSectors}
				{ksgSectors}
				{explanations}
				{total1990}
				{totalSelectedYear}
				detailLayers={detailLayers[selectedYear]}
				bind:ksgSelection
				bind:crfSelection
			/>
			<HistoryChart {selectedYear} {total1990} {detailLayers} bind:ksgSelection bind:crfSelection />
		</div>

		<div class="h-4 bg-black" />
		<LandUseChart data={dataset} {selectedYear} />
	</div>
{/if}
