<script>
	// export let data;
	export let explanations;
	// export let ksgSectors;
	// export let crfSectors;
	export let total1990;
	export let totalSelectedYear;
	export let detailLayers;
	export let ksgSelection;
	export let crfSelection;

	// TREE MAP
	// $: console.log(detailLayers, total1990, totalSelectedYear);

	$: ksgTooltip = null;
	$: crfTooltip = null;
	$: mouse = null;

	const updateDescription = (crfCode) => {
		if (crfTooltip)
			crfTooltip.explanation =
				explanations?.find((entry) => entry.crfCode == crfCode).erklaerung || '';
	};
</script>

<div class="detail-emissions-tree-map relative pt-10 w-full max-w-2xl">
	{#if detailLayers}
		<svg
			viewBox="-100 -100 1200 1400"
			on:mouseleave={() => {
				ksgTooltip = null;
				crfTooltip = null;
				mouse = null;
			}}
			on:mousedown={() => {
				crfSelection = null;
				ksgSelection = null;
			}}
		>
			<rect
				x="-100"
				y="-100"
				width="1200"
				height="1400"
				fill="transparent"
				class={ksgSelection != null ? 'cursor-zoom-out' : ''}
			/>
			{#each detailLayers as ksgSector, s}
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
						class="transition-opacity {ksgSelection == null ? 'cursor-zoom-in' : 'cursor-pointer'}"
					>
						{#each ksgSector.sectors as crfSector, c}
							{@const selected = ksgSelection == s}
							{@const percentSector = ksgSector.value / totalSelectedYear}
							{@const percentUpToHalf =
								detailLayers.slice(0, 2).reduce((sum, entry) => sum + entry.value, 0) /
								totalSelectedYear}
							{@const percentUpToKSGIndex =
								detailLayers.slice(0, s).reduce((sum, entry) => sum + entry.value, 0) /
								totalSelectedYear}
							{@const HEIGHT = (totalSelectedYear / total1990) * 1000}

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

							{#if c == 0}
								<rect height={h} width={w} {x} {y} fill={ksgSector.colorCode} />
							{/if}

							{@const percentUpToCRFIndex =
								ksgSector.sectors.slice(0, c).reduce((sum, entry) => sum + entry.value, 0) /
								totalSelectedYear}

							{@const w2 = w}
							{@const h2 = (h * crfSector.relative) / ksgSector.relative}
							{@const x2 = x}
							{@const y2 = y + h * (percentUpToCRFIndex / ksgSector.relative)}

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
										crfSelection = c;
									}}
								/>
								{#if ksgSelection != null && h2 > 20}
									<text x={x2 + 20} y={y2 + 20} font-size="20" fill="white">{crfSector.label}</text>
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
								<text x={x + w - 80} y={y + h - 30} font-size="20"
									>{ksgSector.absolute.toFixed(1).replace('.', ',')} Mt</text
								>
							{/if}
						{/each}
					</g>
				{/if}
			{/each}
		</svg>
	{/if}
	{#if ksgTooltip}
		<div class="absolute bg-white rounded p-4" style="top: {mouse.y}px; left: {mouse.x}px;">
			<h4><strong>{ksgTooltip.label}</strong></h4>
			{ksgTooltip.absolute.toFixed(2).replace('.', ',')} Mt CO2eq
		</div>
	{/if}
	{#if crfTooltip}
		<div
			class="absolute bg-white rounded p-4 max-w-prose"
			style="top: {mouse.y}px; left: {mouse.x}px;"
		>
			<h4><strong>{crfTooltip.label}</strong></h4>
			<strong>{crfTooltip.absolute.toFixed(3).replace('.', ',')} Mt CO2eq</strong>
			<p>{crfTooltip.explanation}</p>
		</div>
	{/if}
</div>
