<script>
	export let explanations;
	export let sectorlyData;
	export let selectedYear;
	export let ksgSelection;
	export let crfSelection;
	export let extensiveList;
	export let years;

	// TREE MAP
	// $: console.log(detailLayers, total1990, totalSelectedYear);

	$: ksgTooltip = null;
	$: crfTooltip = null;
	$: mouse = null;

	$: _y = selectedYear - 1990;
	$: totalSelectedYear = sectorlyData.reduce((sum, sec) => sum + sec.value[_y], 0);
	console.log(totalSelectedYear);

	$: [maxTotalYear, maxTotal] = years
		.map((y, yi) => [y, sectorlyData.reduce((sum, sec) => sum + sec.value[yi], 0)])
		.reduce(
			(max, entry) => {
				return max[1] < entry[1] ? entry : max;
			},
			[1990, 0]
		);
	// $: console.log(maxTotalYear, maxTotal);
	$: HEIGHT = (totalSelectedYear / maxTotal) * 1150;

	const updateDescription = (crfCode) => {
		if (crfTooltip)
			crfTooltip.explanation =
				explanations?.find((entry) => entry.crfCode == crfCode).erklaerung || '';
	};
</script>

<div class="detail-emissions-tree-map relative basis-[500px]" style="background: rgba(0,0,0,0)">
	<input
		type="range"
		min="1990"
		max="2020"
		bind:value={selectedYear}
		name="emission-detail-year"
		id="emission-detail-year"
	/><label for="emission-detail-year">Jahr: {selectedYear}</label><br />

	{#if sectorlyData}
		<svg
			viewBox="-150 0 1150 1150"
			on:mouseleave={() => {
				ksgTooltip = null;
				crfTooltip = null;
				mouse = null;
			}}
		>
			{#if ksgSelection == null}
				<rect
					x="-140"
					y="2"
					width="80"
					height="1146"
					fill="transparent"
					stroke="#ccc"
					stroke-dasharray="20"
				/>

				<rect
					x="2"
					y="2"
					width="996"
					height="1146"
					fill="transparent"
					stroke="#ccc"
					stroke-dasharray="20"
				/>
				<text x="970" y="1110" text-anchor="end" font-size="40" fill="#ccc"
					>Maximum {maxTotalYear}: {(maxTotal / 1000000).toFixed(1).replace('.', ',')} Mt CO2eq</text
				>
			{/if}

			{#each sectorlyData as ksgSector, s}
				<!-- 100% Overview bar -->
				{@const cumulativePercent = sectorlyData
					.slice(0, s)
					.reduce((sum, sec) => sum + sec.relative[_y], 0)}
				{@const sectorHeight = ksgSector.relative[_y] * HEIGHT}
				<rect
					x="-140"
					y={cumulativePercent * HEIGHT}
					width="80"
					height={sectorHeight}
					fill={ksgSector.colorCode}
					opacity={ksgSelection != null && s != ksgSelection ? 0.2 : 1}
				/>
				{#if sectorHeight > 30}
					<g transform="translate(-110, {cumulativePercent * HEIGHT + sectorHeight / 2 - 10})">
						{@html ksgSector.icon}
					</g>
				{/if}

				{#if ksgSelection == null || s == ksgSelection}
					<g
						on:mousemove|stopPropagation={(e) => {
							if (ksgSelection != null) return;
							mouse = { x: e.layerX, y: e.layerY };
							ksgTooltip = ksgSector;
						}}
						tab-index="1"
						on:focus={() => {
							ksgTooltip = ksgSector;
						}}
						on:mousedown|stopPropagation={() => {
							ksgSelection = s;
							ksgTooltip = null;
						}}
						opacity={ksgTooltip == ksgSector ? 0.8 : 1}
						class="transition-opacity cursor-pointer"
					>
						{#each ksgSector.sectors as crfSector, c}
							{@const selected = ksgSelection == s}
							{@const percentSector = ksgSector.value[_y] / totalSelectedYear}
							{@const percentUpToHalf =
								sectorlyData.slice(0, 2).reduce((sum, entry) => sum + entry.value[_y], 0) /
								totalSelectedYear}
							{@const percentUpToKSGIndex =
								sectorlyData.slice(0, s).reduce((sum, entry) => sum + entry.value[_y], 0) /
								totalSelectedYear}

							{@const w = selected
								? 1000
								: s < 2
								? (1000 * percentSector) / percentUpToHalf
								: (1000 * percentSector) / (1 - percentUpToHalf)}
							{@const h = selected
								? HEIGHT
								: s < 2
								? percentUpToHalf * HEIGHT
								: HEIGHT * (1 - percentUpToHalf)}
							{@const x = selected
								? 0
								: s < 2
								? (percentUpToKSGIndex / percentUpToHalf) * 1000
								: ((percentUpToKSGIndex - percentUpToHalf) / (1 - percentUpToHalf)) * 1000}
							{@const y = selected ? 0 : s < 2 ? 0 : percentUpToHalf * HEIGHT}

							<!-- {@const combinedIndices = ksgSector.sectors.reduce(
								(combined, crfEntry, cIndex) => {
									const hh = h * crfEntry.relative[_y];
									if (combined.height + hh > 40) return combined;
									console.log('also include to COMBINED', crfEntry.label, {
										index: cIndex,
										height: combined.height + hh
									});
									return { index: cIndex, height: combined.height + hh };
								},
								{ index: 0, height: 0 }
							)} -->

							{#if c == 0}
								<rect height={h} width={w} {x} {y} fill={ksgSector.colorCode} />
							{/if}

							{@const percentUpToCRFIndex =
								ksgSector.sectors.slice(0, c).reduce((sum, entry) => sum + entry.value[_y], 0) /
								totalSelectedYear}

							{@const w2 = w}
							{@const h2 = (h * crfSector.relative[_y]) / ksgSector.relative[_y]}
							{@const x2 = x}
							{@const y2 = y + h * (percentUpToCRFIndex / ksgSector.relative[_y])}

							<g
								on:mousemove={(e) => {
									if (ksgSelection == null) return;
									else e.stopPropagation();

									mouse = { x: e.layerX, y: e.layerY };
									crfTooltip = crfSector;
									updateDescription(crfSector.code);
								}}
								on:focus={(e) => {
									if (crfSelection != null) return;
									mouse = { x: e.layerX, y: e.layerY };
									crfTooltip = crfSector;
									updateDescription(crfSector.code);
								}}
								opacity={crfTooltip == crfSector ? 0.8 : 1}
							>
								<rect
									height={h2}
									width={w2}
									x={x2}
									y={y2}
									fill={c == crfSelection ? 'rgba(0,0,0,0.1)' : 'transparent'}
									stroke-width="1"
									stroke="rgba(255,255,255,{ksgSelection ? 1 : 0.3})"
									on:pointerdown|stopPropagation={() => {
										if (ksgSelection == null) return;
										if (h2 < 100) {
											extensiveList = true;
											return;
										}
										crfSelection = c;
									}}
								/>
								{#if ksgSelection != null && h2 > 20}
									<text x={x2 + 20} y={y2 + 30} font-size="30" fill="white"
										>{crfSector.label} | {crfSector.absolute[_y].toFixed(2)}Mt CO2eq</text
									>
								{/if}
							</g>

							{#if c == ksgSector.sectors.length - 1}
								<rect
									{x}
									{y}
									height="40"
									width="230"
									transform="translate({x + 43}, {y + 15}) rotate(90) translate({-x}, {-y})"
									fill="rgba(255,255,255,0.3)"
								/>
								<text
									{x}
									{y}
									font-size="30"
									transform="translate({x + 13}, {y + 30}) rotate(90) translate({-x}, {-y})"
									>{ksgSector.label}</text
								>
								{#if w > 80}
									<text x={x + w - 90} y={y + h - 30} font-size="30"
										>{ksgSector.absolute[_y].toFixed(1).replace('.', ',')}Mt</text
									>
								{/if}
							{/if}
						{/each}
					</g>
				{/if}
			{/each}
		</svg>
	{/if}
	{#if extensiveList && ksgSelection != null}
		<div
			class="absolute rounded p-4 top-0 left-0 h-full w-full overflow-scroll"
			style="background-color: {sectorlyData[ksgSelection].colorCode};"
		>
			<ul class="divide-y">
				{#each sectorlyData[ksgSelection].sectors as crfSector, c}
					<li
						class="mb-1 text-white grid grid-cols-2"
						on:pointerdown|stopPropagation={() => {
							crfSelection = c;
							extensiveList = false;
						}}
					>
						<span>{crfSector.absolute[_y].toFixed(2)}Mt CO2eq</span>
						<strong>{crfSector.label}</strong>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	<!-- {#if ksgTooltip}
		<div class="absolute bg-white rounded p-4" style="top: {mouse.y}px; left: {mouse.x}px;">
			<h4><strong>{ksgTooltip.label}</strong></h4>
			{ksgTooltip.absolute[_y].toFixed(2).replace('.', ',')} Mt CO2eq
		</div>
	{/if} -->
	<!-- {#if crfTooltip}
		<div
			class="absolute bg-white rounded p-4 max-w-prose"
			style="top: {mouse.y}px; left: {mouse.x}px;"
		>
			<h4><strong>{crfTooltip.label}</strong></h4>
			<strong>{crfTooltip.absolute[_y].toFixed(3).replace('.', ',')} Mt CO2eq</strong>
			<p>{crfTooltip.explanation}</p>
		</div>
	{/if} -->
</div>
