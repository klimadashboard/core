<script>
	import HistoryChart from './HistoryChart.svelte';
	import SectorsTreeChart from './SectorsTreeChart.svelte';
	import LandUseChart from './LandUseChart.svelte';
	import { glossaryItem } from '$lib/stores/glossary';

	let dataset = null;
	let explanations = null;

	let maxYear = 2020;

	let years = Array.from({ length: maxYear - 1990 + 1 }).map((_, i) => 1990 + i);

	let ghGas = ['THG', 'CO2', 'CH4', 'N2O', 'FLU'];

	let ksgSectors = [
		{
			label: 'Industrie',
			color: 'industry',
			colorCode: 'hsl(233, 14%, 25%)',
			colorCodeHighlighted: 'hsl(233, 14%, 35%)',
			colorCodeLight: 'hsl(233, 14%, 90%)',
			icon: (size) =>
				`<svg width='${size * 20}' height='${
					size * 18
				}' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 17H1L1.00017 5.75676L8.10537 9.21622V5.75676L14.7369 9.21622V1H19V17Z' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Mobilität',
			color: 'traffic',
			colorCode: 'hsl(35, 90%, 63%)',
			colorCodeHighlighted: 'hsl(35, 90%, 73%)',
			colorCodeLight: 'hsl(35, 90%, 90%)',
			icon: (size) =>
				`<svg width='${size * 20}' height='${
					size * 15
				}' viewBox='0 0 20 15' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10C13.8954 10 13 10.8954 13 12C13 13.1046 13.8954 14 15 14Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 12H1V6M1 6L3 1H12L16 6M1 6H16M16 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V12H17M10 6V1' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7 12H13' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Energie',
			color: 'energy',
			colorCode: 'hsl(0, 55%, 48%)',
			colorCodeHighlighted: 'hsl(0, 55%, 58%)',
			colorCodeLight: 'hsl(0, 55%, 90%)',
			icon: (size) =>
				`<svg width='${size * 16}' height='${
					size * 20
				}' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 1V8H15L7 19V12H1L9 1Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Gebäude',
			color: 'buildings',
			colorCode: 'hsl(205, 40%, 47%)',
			colorCodeHighlighted: 'hsl(205, 40%, 57%)',
			colorCodeLight: 'hsl(205, 40%, 90%)',
			icon: (size) =>
				`<svg width='${size * 20}' height='${
					size * 20
				}' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 10H1L10 1L19 10H17' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 10V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H15C15.5304 19 16.0391 18.7893 16.4142 18.4142C16.7893 18.0391 17 17.5304 17 17V10' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 10H8V14H12V10Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Landwirtschaft',
			color: 'agriculture',
			colorCode: 'hsl(148, 20%, 50%)',
			colorCodeHighlighted: 'hsl(148, 20%, 60%)',
			colorCodeLight: 'hsl(148, 20%, 90%)',
			icon: (size) =>
				`<svg width='${size * 20}' height='${
					size * 16
				}' viewBox='0 0 20 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 15C7.20914 15 9 13.2091 9 11C9 8.79086 7.20914 7 5 7C2.79086 7 1 8.79086 1 11C1 13.2091 2.79086 15 5 15Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M5 11V11.01' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M17 15C18.1046 15 19 14.1046 19 13C19 11.8954 18.1046 11 17 11C15.8954 11 15 11.8954 15 13C15 14.1046 15.8954 15 17 15Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M8.5 13H15' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18 11.2V7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6H11L9 1H3V7.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M16 1H15C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V6' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Abfall',
			color: 'waste',
			colorCode: 'hsl(22, 50%, 48%)',
			colorCodeHighlighted: 'hsl(22, 50%, 58%)',
			colorCodeLight: 'hsl(22, 50%, 90%)',
			icon: (size) =>
				`<svg width='${size * 22}' height='${
					size * 21
				}' viewBox='0 0 22 21' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 18H19C19.3186 17.9836 19.6287 17.8912 19.9043 17.7305C20.1799 17.5698 20.4131 17.3456 20.5843 17.0764C20.7556 16.8073 20.86 16.501 20.8888 16.1833C20.9177 15.8656 20.8701 15.5456 20.75 15.25L20.2 14.25M12 16L10 18L12 20V16Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.80319 7.26807L3.30319 15.0623C3.15811 15.3464 3.08311 15.6611 3.08444 15.9802C3.08578 16.2992 3.16342 16.6133 3.31087 16.8962C3.45832 17.1791 3.67131 17.4226 3.93206 17.6064C4.19281 17.7903 4.49375 17.909 4.80976 17.9528L5.95078 17.9765M8.53524 10.0001L7.80319 7.26807L5.07114 8.00012L8.53524 10.0001Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18.1968 10.7319L13.6968 2.93771C13.5233 2.67 13.2882 2.44769 13.0113 2.28933C12.7343 2.13098 12.4235 2.04117 12.1048 2.02742C11.7861 2.01366 11.4687 2.07635 11.1791 2.21026C10.8895 2.34417 10.6362 2.5454 10.4402 2.79716L9.84922 3.77347M15.4648 9.99988L18.1968 10.7319L18.9289 7.99988L15.4648 9.99988Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Fluorierte Gase',
			color: 'fluorinated',
			colorCode: 'hsl(191, 31%, 61%)',
			colorCodeHighlighted: 'hsl(191, 31%, 71%)',
			colorCodeLight: 'hsl(191, 31%, 90%)',
			icon: (size) =>
				`<svg width='${size * 21}' height='${
					size * 20
				}' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 6.00003H11.5C11.9644 6.00892 12.4222 5.88823 12.8218 5.65152C13.2215 5.4148 13.5473 5.07141 13.7627 4.65986C13.9782 4.24832 14.0747 3.78489 14.0414 3.32156C14.0082 2.85824 13.8465 2.41334 13.5745 2.03676C13.3026 1.66019 12.931 1.36683 12.5017 1.1896C12.0723 1.01237 11.602 0.958278 11.1436 1.03338C10.6852 1.10849 10.2568 1.30982 9.90643 1.6148C9.55606 1.91979 9.29758 2.31636 9.16 2.76003' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M1 9.99997H16.5C16.9644 9.99108 17.4222 10.1118 17.8218 10.3485C18.2215 10.5852 18.5473 10.9286 18.7627 11.3401C18.9782 11.7517 19.0747 12.2151 19.0414 12.6784C19.0082 13.1418 18.8465 13.5867 18.5745 13.9632C18.3026 14.3398 17.931 14.6332 17.5017 14.8104C17.0723 14.9876 16.602 15.0417 16.1436 14.9666C15.6852 14.8915 15.2568 14.6902 14.9064 14.3852C14.5561 14.0802 14.2976 13.6836 14.16 13.24' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 14H7.5C7.96443 13.9911 8.42216 14.1118 8.82183 14.3485C9.22151 14.5852 9.54733 14.9286 9.76274 15.3401C9.97816 15.7517 10.0747 16.2151 10.0414 16.6784C10.0082 17.1418 9.8465 17.5867 9.57453 17.9632C9.30256 18.3398 8.93105 18.6332 8.50167 18.8104C8.07229 18.9876 7.60203 19.0417 7.14362 18.9666C6.68522 18.8915 6.2568 18.6902 5.90643 18.3852C5.55605 18.0802 5.29758 17.6836 5.16 17.24' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		},
		{
			label: 'Memo',
			color: 'memo',
			colorCode: 'hsl(0, 0%, 50%)',
			colorCodeHighlighted: 'hsl(0, 0%, 60%)',
			icon: (size) =>
				`<svg width='${size * 20}' height='${
					size * 20
				}' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 3 L 17 3 L 17 17 L 3 17 Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
		}
	];
	const colorForKey = (key) => ksgSectors.find((sector) => sector.color == key);

	const datasetPromise = fetch('../data/at/emissions/emissions_crf_at.json')
		.then((response) => response.json())
		.then((responseData) => {
			dataset = responseData;
			return responseData;
		});

	$: data = dataset?.[selectedGhGas].sort((a, b) => b.absolute[30] - a.absolute[30]);

	$: console.log('sectorlyData', data);

	// TODO: compare totals to Klimaschutzbericht
	// console.log('1990', total1990 / 10 ** 6);
	// $: console.log('2020', totalSelectedYear / 10 ** 6);

	$: sectorlyData = data?.filter((sector) => (sector.label == 'Memo' ? showFlightEmissions : true));

	$: totalForYear = (year) =>
		sectorlyData?.reduce((sum, entry) => sum + entry.absolute[year - 1990], 0);

	// dynamic variables
	let selectedYear = maxYear;
	let selectedGhGas = 'THG';

	// TREE PLOT selections
	let ksgSelection = null;
	let crfSelection = null;
	let extensiveList = false;

	// let freezeYAxis = false;
	let useRelativeUnits = false;
	let showFlightEmissions = true;
</script>

{#if sectorlyData}
	<div
		style="transition: 0.5s background ease-in-out; background-color: {ksgSelection != null
			? ksgSectors[ksgSelection].colorCodeLight
			: 'white'}"
	>
		<div>
			<span>Treibhausgas:</span>
			{#each ghGas as ghg, g}
				<label>
					<input
						type="radio"
						checked={g == 0}
						bind:group={selectedGhGas}
						name="scoops"
						value={ghg}
					/>
					{ghg}
				</label>
			{/each}
			<!-- <select bind:value={selectedGhGas} id="emission-detail-ghg">
				{#each ghGas as ghg}
					<option value={ghg}>{ghg}</option>
				{/each}
			</select> -->
			<br />
			<!-- <input type="checkbox" bind:checked={freezeYAxis} />
			<span>Y-Achse fixieren?</span>
			<br />
			-->
			<input type="checkbox" bind:checked={useRelativeUnits} />
			<span>Relative Zahlen</span>
			<br />
			<input
				id="emissions-detail-memo-checkbox"
				type="checkbox"
				bind:checked={showFlightEmissions}
			/>
			<label for="emissions-detail-memo-checkbox"
				>Internationaler Schiffs- und Flugverkehr (MEMO <span
				class="glossary-label"
				on:mousedown={() => glossaryItem.set('memo-items')}
			/>)</label>

			<div class="flex items-center gap-2">
				<input
					type="range"
					min="1990"
					max="2020"
					bind:value={selectedYear}
					name="emission-detail-year"
					id="emission-detail-year"
				/><label for="emission-detail-year">{selectedYear}</label><br />
			</div>
		</div>

		<div class="relative pt-10 flex justify-stretch items-end flex-wrap gap-x-8">
			<SectorsTreeChart
				{ksgSectors}
				{explanations}
				{sectorlyData}
				{colorForKey}
				{years}
				{useRelativeUnits}
				bind:selectedYear
				bind:ksgSelection
				bind:crfSelection
				bind:extensiveList
				class="p-4"
			/>
			<HistoryChart
				{years}
				{maxYear}
				{sectorlyData}
				{colorForKey}
				bind:selectedYear
				bind:ksgSelection
				bind:crfSelection
			/>
		</div>
		{#if ksgSelection != null}
			<button
				class="inline-block"
				on:mousedown={() => {
					crfSelection = null;
					ksgSelection = null;
					extensiveList = false;
				}}>Zurück zur Übersicht</button
			>
			<h4 class="text-black text-l inline-block">
				<i style="filter: invert(); display: inline-block;"
					>{@html ksgSectors[ksgSelection].icon(1)}</i
				>
				{ksgSectors[ksgSelection].label}
			</h4>
		{/if}
	</div>

	<LandUseChart />
{/if}
