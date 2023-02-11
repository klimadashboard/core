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
</script>

<div class="detail-emissions-tree-map pt-10">
	{#if detailLayers}
		<svg viewBox="0 0 1000 1200" style="max-width: 600px;">
			{#each detailLayers as ksgSector, s}
				<g
					on:mouseover={(ksgSector.hover = true)}
					on:focus={(ksgSector.hover = true)}
					opacity={ksgSector.hover ? 0.5 : 1}
				>
					{#each ksgSector.sectors as crfSector, c}
						{@const HEIGHT = (totalSelectedYear / total1990) * 1000}
						{@const percentSector = ksgSector.value / totalSelectedYear}
						{@const percentUpToHalf =
							detailLayers.slice(0, 2).reduce((sum, entry) => sum + entry.value, 0) /
							totalSelectedYear}
						{@const percentUpToKSGIndex =
							detailLayers.slice(0, s).reduce((sum, entry) => sum + entry.value, 0) /
							totalSelectedYear}

						{@const w =
							s < 2
								? (1000 * percentSector) / percentUpToHalf
								: (1000 * percentSector) / (1 - percentUpToHalf)}
						{@const h = s < 2 ? percentUpToHalf * HEIGHT : HEIGHT * (1 - percentUpToHalf)}
						{@const x =
							s < 2
								? (percentUpToKSGIndex / percentUpToHalf) * 1000
								: ((percentUpToKSGIndex - percentUpToHalf) / (1 - percentUpToHalf)) * 1000}
						{@const y = s < 2 ? 0 : percentUpToHalf * HEIGHT}

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

						<rect
							height={h2}
							width={w2}
							x={x2}
							y={y2}
							fill="transparent"
							stroke-width="1"
							stroke="white"
						/>
						{#if crfSector.relative > 0.02}
							<text x={x2 + 20} y={y2 + 20} font-size="15" fill="white">{crfSector.label}</text>
						{/if}

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
			{/each}
		</svg>
	{/if}
</div>
