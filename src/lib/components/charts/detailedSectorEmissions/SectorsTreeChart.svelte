<script>
	export let data;
	export let explanations;
	export let ksgSectors;
	export let crfSectors;
	export let selectedYear;
	export let selectedGhGas;
	export let selectedSectorCodes;

	const total1990 = data.filter(
		(entry) => entry.Jahr == 1990 && entry.Schadstoff == selectedGhGas && entry.CRF_Code == '0'
	)[0].Werte;

	$: totalSelectedYear = data.filter(
		(entry) =>
			entry.Jahr == selectedYear && entry.Schadstoff == selectedGhGas && entry.CRF_Code == '0'
	)[0].Werte;

	$: selectedSectorsData = selectedSectorCodes
		.map((code) => {
			const crfSectorEntry = data.filter(
				(entry) =>
					entry.Jahr == selectedYear && entry.Schadstoff == selectedGhGas && entry.CRF_Code == code
			);
			const crfSector = crfSectors.find((crf) => crf.code == code);
			const ksgSector = ksgSectors.find((sector) => sector.label == crfSector.ksgSector);
			const ksgSectorIndex = ksgSectors.reduce(
				(index, sector, s) => (sector.label == crfSector.ksgSector ? s : index),
				-1
			);

			return {
				code: code,
				value: crfSectorEntry[0].Werte,
				name: crfSector.crfName,
				color: ksgSector.colorCode,
				sectorIndex: ksgSectorIndex
			};
		})
		.sort((sectorA, sectorB) => {
			if (sectorA.sectorIndex != sectorB.sectorIndex)
				return sectorA.sectorIndex < sectorB.sectorIndex ? -1 : +1;
			if (sectorA.sectorIndex == sectorB.sectorIndex)
				return sectorA.value < sectorB.value ? +1 : -1;
		});
</script>

{#if selectedSectorsData}
	<svg viewBox="0 0 1200 1000" style="max-width: 600px;">
		{#each selectedSectorsData as sector, s}
			{@const h = 800 * (sector.value / totalSelectedYear) * (totalSelectedYear / total1990)}
			{@const y =
				((800 * selectedSectorsData.slice(0, s).reduce((sum, entry) => sum + entry.value, 0)) /
					totalSelectedYear) *
				(totalSelectedYear / total1990)}
			{@const percent = (sector.value / totalSelectedYear) * 100}
			{@const crfNameDE =
				explanations?.find((entry) => entry.crfCode == sector.code).crfNamenDe || ''}
			<rect height={h} width="300" x={10} {y} stroke-width="1" stroke="white" fill={sector.color} />
			{#if percent >= 1.7}
				<text x={320} y={y + 15} size="10">{crfNameDE}: {percent.toFixed(2)}%</text>
			{/if}
		{/each}
	</svg>
{/if}
