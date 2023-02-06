<script>
	export let data;
	export let selectedYear;
	// export let selectedGhGas;

	const lulucf = [
		{ code: '4 A 1', label: 'Forest land remaining forest land' },
		{ code: '4 A 2', label: 'Land converted to forest land' },
		{ code: '4 B 1', label: 'Cropland remaining cropland' },
		{ code: '4 B 2', label: 'Land converted to cropland' },
		{ code: '4 C 1', label: 'Grassland remaining grassland' },
		{ code: '4 C 2', label: 'Land converted to grassland' },
		{ code: '4 D 1', label: 'Wetlands remaining Wetlands' },
		{ code: '4 D 2', label: 'Land converted to Wetlands' },
		{ code: '4 E 2', label: 'Land converted to Settlements' },
		{ code: '4 F 2', label: 'Land converted to Other land' },
		{ code: '4 G', label: 'HWP' }
	];

	$: totalLulucf = data.filter(
		(entry) => entry.Jahr == selectedYear && entry.Schadstoff == 'CO2' && entry.CRF_Code == '4'
	)[0].Werte;

	$: lulucfData = lulucf.map((sector) => {
		const sectorData = data.filter(
			(entry) =>
				entry.Jahr == selectedYear && entry.Schadstoff == 'CO2' && entry.CRF_Code == sector.code
		);
		return {
			code: sector.code,
			label: sector.label,
			value: sectorData[0]?.Werte || 0,
			data: sectorData
		};
	});
	$: lulucfDataMax = lulucfData.reduce(
		(max, sector) => (Math.abs(sector.value) > max ? Math.abs(sector.value) : max),
		0
	);
</script>

{#if lulucfData}
	<svg viewBox="-500 0 1000 1000">
		<text x={0} y={50} alignment-baseline="middle">0</text>

		{#each lulucfData as sector, s}
			{@const w = 200 * (sector.value / lulucfDataMax)}
			{@const x =
				(200 * lulucfData.slice(0, s).reduce((sum, entry) => sum + entry.value, 0)) /
					lulucfDataMax +
				(w < 0 ? w : 0)}

			<rect
				width={10 + Math.abs(w)}
				height="50"
				{x}
				y={100 + s * 60}
				fill={w > 0 ? 'red' : 'green'}
			/>
			<text x={x + Math.abs(w)} y={100 + s * 60 + 30} alignment-baseline="middle"
				>{w < 0 ? '<- ' : '-> '} {sector.label}</text
			>
		{/each}

		<text x={0} y={900}>Total LULUCF{(totalLulucf / 1000000).toFixed(0)} Mio t CO2</text>
	</svg>
{/if}
