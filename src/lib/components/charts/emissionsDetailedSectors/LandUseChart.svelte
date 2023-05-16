<script>
	let maxYear = 2020;
	let selectedYear = maxYear;
	$: _y = selectedYear - 1990;

	let dataset = 0;
	// const datasetPromise = fetch('https://data.klimadashboard.at/at/emissions/emissions_lulucf_at.json')
	const datasetPromise = fetch('../data/at/emissions/emissions_lulucf_at.json')
		.then((response) => response.json())
		.then((responseData) => {
			dataset = responseData;
			return responseData;
		});

	const selectedGhGas = 'CO2';

	$: lulucfData = dataset?.[selectedGhGas]?.[0]; //.sort((a, b) => b.absolute[30] - a.absolute[30]);
	$: console.log(lulucfData);

	const style = {
		label: 'LULUCF',
		color: 'lulucf',
		colorCode: 'hsl(0, 0%, 50%)',
		colorCodeHighlighted: 'hsl(0, 0%, 60%)',
		icon: (size) =>
			`<svg width='${size * 20}' height='${
				size * 20
			}' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 3 L 17 3 L 17 17 L 3 17 Z' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`
	};

	// const lulucf = [
	// 	{ code: '4 A 1', label: 'Forest land remaining forest land' },
	// 	{ code: '4 A 2', label: 'Land converted to forest land' },
	// 	{ code: '4 B 1', label: 'Cropland remaining cropland' },
	// 	{ code: '4 B 2', label: 'Land converted to cropland' },
	// 	{ code: '4 C 1', label: 'Grassland remaining grassland' },
	// 	{ code: '4 C 2', label: 'Land converted to grassland' },
	// 	{ code: '4 D 1', label: 'Wetlands remaining Wetlands' },
	// 	{ code: '4 D 2', label: 'Land converted to Wetlands' },
	// 	{ code: '4 E 2', label: 'Land converted to Settlements' },
	// 	{ code: '4 F 2', label: 'Land converted to Other land' },
	// 	{ code: '4 G', label: 'HWP' }
	// ];
</script>

<h2 class="text-2xl">LULUCF</h2>
<hr />

<div class="flex items-center gap-2">
	<input
		type="range"
		min="1990"
		max="2020"
		bind:value={selectedYear}
		name="lulucf-year"
		id="lulucf-year"
	/><label for="lulucf-year">{selectedYear}</label><br />
</div>

{#if lulucfData}
	{@const totalLulucf = lulucfData.absolute[_y]}
	{@const lulucfDataMax = lulucfData.sectors.reduce((max, crf, c) => {
		const abs = Math.abs(crf.absolute[_y]);
		return abs > max ? abs : max;
	}, 0)}
	<svg viewBox="0 -250 1000 1000" height="700">
		<text x={0} y={50} alignment-baseline="middle">0</text>

		{#each lulucfData.sectors as sector, s}
			{@const h = 300 * (sector.absolute[_y] / lulucfDataMax)}
			{@const y =
				(300 * lulucfData.sectors.slice(0, s).reduce((sum, entry) => sum + entry.absolute[_y], 0)) /
					lulucfDataMax +
				(h < 0 ? h : 0)}

			<line x1="0" x2="1000" y1="0" y2="0" stroke="black"></line>
			<rect
				width="50"
				height={10 + Math.abs(h)}
				x={100 + s * 60}
				y={h < 0 ? -y + h : -y-h}
				fill={h > 0 ? 'red' : 'green'}
			/>
			<text x={100 + s * 60 + 30} y={h < 0 ? -y + h : -y-h} alignment-baseline="middle"
				>{h < 0 ? 'v ' : '^ '} {sector.label}</text
			>
		{/each}

		<text x={0} y={900} font-size="40">{totalLulucf.toFixed(2).replace('.', ',')} Mt</text>
	</svg>

	{@const lulucfPath = lulucfData.absolute
		.reduce((path, year, y) => {
			path.push([y == 0 ? 'M' : 'L', (y * 1000) / 30, 50 - year * 30]);
			return path;
		}, [])
		.flat()
		.join(' ')}

	<svg viewBox="0 0 1000 700" width="700">
		<path d={lulucfPath} stroke="green" stroke-width="4" fill="none" />
		{#each lulucfData.sectors as sector, s}
			{@const crfPath = sector.absolute
				.reduce((path, year, y) => {
					path.push([y == 0 ? 'M' : 'L', (y * 1000) / 30, 50 - year * 30]);
					return path;
				}, [])
				.flat()
				.join(' ')}

			<line x1="0" x2="1000" y1="50" y2="50" stroke="black" />
			<path d={crfPath} stroke="lightgreen" stroke-width="2" fill="none" />
			<!-- 
			<text x={x + Math.abs(w)} y={100 + s * 60 + 30} alignment-baseline="middle"
				>{w < 0 ? '<- ' : '-> '} {sector.label}</text
			> -->
		{/each}
	</svg>
{/if}
