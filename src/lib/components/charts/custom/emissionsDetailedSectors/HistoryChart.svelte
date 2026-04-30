<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import { AxisX, AxisY } from '$lib/components/charts/primitives';
	import { scaleLinear } from 'd3-scale';

	export let selectedYear;
	export let sectorlyData;
	export let colorForKey;
	export let years;
	export let maxYear;
	// interactive
	export let ksgSelection;
	export let crfSelection;
	export let ksgHover;
	export let crfHover;

	let clientWidth = 1000;
	let clientHeight = 1000;

	$: margin = {
		top: 15,
		right: 20,
		bottom: 35,
		left: 30
	};
	$: innerWidth = clientWidth - margin.left - margin.right;
	$: innerHeight = clientHeight - margin.top - margin.bottom;

	$: yAxisMax = years.reduce((max, y, yi) => Math.max(max, ksgSectorSum(0, yi)), 0);

	$: xScale = scaleLinear()
		.domain([1990, 1990 + years.length - 1])
		.range([0, innerWidth]);

	$: yScale = scaleLinear()
		.domain([0, (yAxisMax === 0 ? 1 : yAxisMax) * 1.15])
		.range([innerHeight, 0])
		.nice();

	$: ksgSectorSum = (s, yi) => {
		if (crfSelection != null && ksgSelection != null) {
			const selectedSector = sectorlyData.find((sec) => sec.key === ksgSelection);
			const crfSector = selectedSector?.sectors.find((sector) => sector.code === crfSelection);
			return crfSector ? crfSector.absolute[yi] : 0;
		}
		if (ksgSelection != null) {
			return sectorlyData.find((sec) => sec.key === ksgSelection)?.absolute[yi] ?? 0;
		}
		return sectorlyData
			.slice(0, sectorlyData.length - s)
			.reduce((sum, entry) => sum + entry.absolute[yi], 0);
	};
</script>

{#if sectorlyData}
	<div class="basis-[350px] min-h-[400px] grow" bind:clientWidth bind:clientHeight>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<svg
			class="w-full h-full"
			on:mouseleave={() => {
				ksgHover = null;
				crfHover = null;
			}}
		>
			<g transform="translate({margin.left},{margin.top})">
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />

				{#each [...sectorlyData].reverse() as ksgSector, s}
					{#if ksgSelection == null || ksgSelection == ksgSector.key}
						{@const path = ksgSector.absolute
							.filter((_, yi) => 1990 + yi <= maxYear)
							.map((year, yi) => {
								const sum = ksgSectorSum(s, yi);
								const x = xScale(1990 + yi);
								const y = yScale(sum);
								return [yi == 0 ? 'M' : 'L', x, y];
							})
							.concat(['L', xScale(maxYear), innerHeight, 'L', xScale(1990), innerHeight, 'Z'])
							.flat()
							.join(' ')}
						{#if ksgSelection == null}
							<path
								d={path}
								fill={ksgHover == ksgSector.key
									? colorForKey(ksgSector.key).colorCodeHighlighted
									: colorForKey(ksgSector.key).colorCode}
								stroke="white"
								stroke-width="2"
								on:mousemove={() => {
									if (ksgSelection != null) return;
									ksgHover = ksgSector.key;
								}}
								on:mousedown={() => {
									ksgSelection = ksgSector.key;
								}}
								class="cursor-pointer"
							/>
						{/if}

						{#each [...ksgSector.sectors].reverse() as crfSector, c}
							{#if (ksgHover != null && ksgHover == ksgSector.key) || (ksgSelection != null && (crfSelection == null || crfSelection == crfSector.code))}
								{@const crfPath = crfSector.absolute
									.filter((_, yi) => 1990 + yi <= maxYear)
									.map((year, yi) => {
										const subSectorSum = ksgSector.sectors
											.slice(0, c)
											.reduce((subSum, entry) => subSum + entry.absolute[yi], 0);
										const sum = ksgSectorSum(s, yi) - (crfSelection != null ? 0 : subSectorSum);
										const x = xScale(1990 + yi);
										const y = yScale(sum);
										return [yi ? 'L' : 'M', x, y];
									})
									.concat(['L', xScale(maxYear), innerHeight, 'L', xScale(1990), innerHeight, 'Z'])
									.flat()
									.join(' ')}
								<path
									d={crfPath}
									data-path="crf-{ksgSector.key}-{c}"
									fill={ksgHover == ksgSector.key || crfHover == crfSector.code
										? colorForKey(ksgSector.key).colorCodeHighlighted
										: colorForKey(ksgSector.key).colorCode}
									stroke={ksgHover == ksgSector.key || ksgSelection != null
										? '#ffffffaa'
										: 'transparent'}
									stroke-width="1"
									class="{ksgSelection == null ? 'pointer-events-none' : ''} cursor-pointer"
									on:mousemove={() => {
										if (crfSelection != null) return;
										crfHover = crfSector.code;
									}}
									on:mousedown={() => {
										if (crfSelection != null) return;
										crfSelection = crfSector.code;
									}}
								/>
							{/if}
						{/each}
					{/if}
				{/each}

				{#if selectedYear != null}
					<line
						x1={xScale(selectedYear)}
						x2={xScale(selectedYear)}
						y1="0"
						y2={innerHeight}
						stroke-width="2"
						stroke-linecap="round"
						stroke="black"
					/>
				{/if}

				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					unit="Mt CO₂eq"
					format={(v) => {
						const r = Math.round(v * 10) / 10;
						return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
					}}
				/>
				<AxisX
					{xScale}
					xDomain={years}
					{innerWidth}
					{innerHeight}
					format={(v) => String(v)}
					forceTicks={[1990]}
				/>
			</g>
		</svg>
	</div>
{/if}
