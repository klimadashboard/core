<script>
	export let data;
	export let selectedYear;
	export let selectedGhGas;
	export let selectedSectors;
	export let ksgSelection;
	export let crfSelection;

	$: yearlySectorData = data.filter(
		(entry) =>
			entry.Schadstoff == selectedGhGas && selectedSectorCodes.find((s) => s.code == entry.CRF_Code)
	);

	let years = data.reduce((list, entry) => {
		if (list.indexOf(entry.Jahr) < 0) list.push(entry.Jahr);
		return list;
	}, []);

	$: yearlySectorData = years.map((year) => {
		let yearlyList = selectedSectorCodes.map((sectorCode) => {
			let accumulatedDataForYear = data.filter(
				(entry) =>
					entry.Schadstoff == selectedGhGas && entry.CRF_Code == sectorCode && entry.Jahr == year
			);
			return { year: year, code: sectorCode, value: accumulatedDataForYear[0].Werte };
		});

		return yearlyList;
	});

	// TODO: don't simply sum, but stack sectors (with respective sector colour)
	$: yearlySectorSum = yearlySectorData.map((list) =>
		list.reduce((sum, entry) => sum + entry.value, 0)
	);
</script>

{#if yearlySectorData}
	<svg viewBox="0 0 1000 300" style="width: 100%;">
		{#each yearlySectorSum as data, d}
			{#if d <= 30}
				{@const x = 15 + d * 30}
				{@const yearlySectorMax = yearlySectorSum.reduce(
					(max, data) => (max > data ? max : data),
					0
				)}
				{@const h = (data / yearlySectorMax) * 190}
				<rect
					width={25}
					height={h}
					x={0 + x}
					y={200 - h}
					fill={selectedYear == 1990 + d ? 'red' : 'gray'}
				/>
				<text x={12 + x} y={220} font-size="10" text-anchor="middle"><tspan>{1990 + d}</tspan></text
				>
			{/if}
		{/each}
	</svg>
{/if}
