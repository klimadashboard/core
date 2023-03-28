<script>
	// import { fade, scale } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	export let explanations;
	export let sectorlyData;
	export let colorForKey;
	export let selectedYear;
	export let ksgSelection;
	export let crfSelection;
	export let extensiveList;
	export let years;
	export let useRelativeUnits;

	// TREE MAP
	// $: console.log(detailLayers, total1990, totalSelectedYear);

	$: ksgTooltip = null;
	$: crfTooltip = null;
	$: mouse = null;

	$: _y = selectedYear - 1990;
	$: totalSelectedYear = sectorlyData.reduce((sum, sec) => sum + sec.absolute[_y], 0);
	$: relativeFactor = useRelativeUnits ? 100 / totalSelectedYear : 1;
	$: unitShort = useRelativeUnits ? '%' : 'Mt';
	$: unitLong = useRelativeUnits ? '%' : 'Mt CO₂eq';
	// $: console.log("totalSelectedYear", totalSelectedYear);

	$: [maxTotalYear, maxTotal] = years
		.map((y, yi) => [y, sectorlyData.reduce((sum, sec) => sum + sec.absolute[yi], 0)])
		.reduce(
			(max, entry) => {
				return max[1] < entry[1] ? entry : max;
			},
			[1990, 0]
		);
	// $: console.log(maxTotalYear, maxTotal);
	$: HEIGHT = 1000;

	const updateDescription = (crfCode) => {
		if (crfTooltip)
			crfTooltip.explanation =
				explanations?.find((entry) => entry.crfCode == crfCode).erklaerung || '';
	};

	let rows = [2, 3, sectorlyData.length - 5];

	$: sortedData = sectorlyData.map((ksg, s) => {
		const row = rows.reduce(
			(row, count, c) => {
				if (!row.foundRow && s >= row.start + count)
					return { start: row.start + count, foundRow: false };
				else
					return {
						start: row.start,
						end: row.end || row.start + count,
						foundRow: true
					};
			},
			{ start: 0, foundRow: false }
		);
		// percentages
		const percentSector = ksg.absolute[_y] / totalSelectedYear;
		const percentCumulative = sectorlyData
			.slice(0, s)
			.reduce((sum, sec) => sum + sec.absolute[_y] / totalSelectedYear, 0);
		const percentRow =
			sectorlyData.slice(row.start, row.end).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;
		const percentPreRow =
			sectorlyData.slice(0, row.start).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;
		const percentUpToKSGIndex =
			sectorlyData.slice(row.start, s).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
			totalSelectedYear;

		const selected = ksgSelection == s;
		const w = selected ? 1000 : (1000 * percentSector) / percentRow;
		const h = selected ? HEIGHT : percentRow * HEIGHT;
		const x = selected ? 0 : (percentUpToKSGIndex / percentRow) * 1000;
		const y = selected ? 0 : percentPreRow * HEIGHT;

		// CRF sectors -----------------------------------------
		let crfSectors = ksg.sectors.map((crf, c) => {
			const percentUpToCRFIndex =
				ksg.sectors.slice(0, c).reduce((sum, entry) => sum + entry.absolute[_y], 0) /
				totalSelectedYear;
			const w2 = w;
			const h2 = (h * crf.absolute[_y]) / ksg.absolute[_y];
			const x2 = x;
			const y2 = y + h * (percentUpToCRFIndex / (ksg.absolute[_y] / totalSelectedYear));

			return {
				absolute: crf.absolute,
				key: crf.key,
				code: crf.code,
				label: crf.label,
				w2,
				h2,
				x2,
				y2
			};
		});
		crfSectors.sort((a, b) => {
			return -a.absolute[a.absolute.length - 1] + b.absolute[a.absolute.length - 1];
		});

		// KSG sectors -----------------------------------------
		return {
			absolute: ksg.absolute,
			key: ksg.key,
			ksgSector: ksg.ksgSector,
			label: ksg.label,
			sectors: crfSectors,
			percentCumulative,
			relative: percentSector,
			w,
			h,
			x,
			y
		};
	});
	// $: console.log('sortedData', sortedData);

	// selected ksg sector
	$: selection = ksgSelection != null ? sortedData[ksgSelection] : null;
	const area = tweened([-150, 0, 1150, 1150], { easing: cubicInOut, duration: 800 });
	$: selection != null
		? area.set([selection.x, selection.y, selection.w, selection.h])
		: area.set([-150, 0, 1150, 1150]);
</script>

<div class="detail-emissions-tree-map relative basis-[400px]" style="background: rgba(0,0,0,0)">
	{#if sortedData}
		<!-- <svg viewBox={$area}></svg> -->
		<svg
			viewBox="-150 0 1150 1150"
			on:mouseleave={() => {
				ksgTooltip = null;
				crfTooltip = null;
				mouse = null;
			}}
		>
			{#each sortedData as ksgSector, s}
				<!-- 100% Overview Sidebar -->
				<rect
					x="-140"
					y={ksgSector.percentCumulative * HEIGHT}
					width="80"
					height={ksgSector.relative * HEIGHT}
					fill={colorForKey(ksgSector.key).colorCode}
					opacity={ksgSelection != null && s != ksgSelection ? 0.2 : 1}
				/>
				{#if ksgSector.relative * HEIGHT > 30}
					<g
						transform="translate(-110, {ksgSector.percentCumulative * HEIGHT +
							(ksgSector.relative * HEIGHT) / 2 -
							10})"
					>
						{@html colorForKey(ksgSector.key).icon(1.2)}
					</g>
				{/if}

				{#if ksgSelection == null || s == ksgSelection}
					<g
						on:mousemove|stopPropagation={(e) => {
							if (ksgSelection != null) return;
							mouse = { x: e.layerX, y: e.layerY };
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
							{#if c == 0}
								<foreignObject
									height={ksgSector.h}
									width={ksgSector.w}
									x={ksgSector.x}
									y={ksgSector.y}
								>
									<div
										class="w-full h-full flex items-end justify-start"
										style="background-color: {colorForKey(ksgSector.key).colorCode};"
									>
										<div
											class="w-full flex flex-wrap flex-grow-0 gap-2 p-5 text-white text-2xl"
											style="font-size: 40px;"
										>
											<span class="py-4">{@html colorForKey(ksgSector.key).icon(2)}</span>
											<strong class="text-ellipsis overflow-hidden py-4">{ksgSector.label}</strong>
											<span class="py-4"
												>{(ksgSector.absolute[_y] * relativeFactor)
													.toFixed(1)
													.replace('.', ',')}{unitShort}</span
											>
										</div>
									</div>
								</foreignObject>
								<!-- <rect height={h} width={w} {x} {y} fill={colorForKey(ksgSector.key).colorCode} /> -->
							{/if}

							<g
								on:mousemove={(e) => {
									if (ksgSelection == null) return;
									else e.stopPropagation();

									mouse = { x: e.layerX, y: e.layerY };
									crfTooltip = crfSector;
									updateDescription(crfSector.code);
								}}
								opacity={crfTooltip == crfSector ? 0.8 : 1}
							>
								<rect
									height={crfSector.h2}
									width={crfSector.w2}
									x={crfSector.x2}
									y={crfSector.y2}
									fill={c == crfSelection ? 'rgba(0,0,0,0.1)' : 'transparent'}
									stroke-width="1"
									stroke="rgba(255,255,255,{ksgSelection ? 1 : 0.3})"
									on:pointerdown|stopPropagation={() => {
										if (ksgSelection == null) return;
										if (crfSector.h2 < 100) {
											extensiveList = true;
											return;
										}
										crfSelection = c;
									}}
								/>
								{#if ksgSelection != null && crfSector.h2 > 20}
									<text x={crfSector.x2 + 20} y={crfSector.y2 + 30} font-size="30" fill="white"
										>{crfSector.label} | {(crfSector.absolute[_y] * relativeFactor)
											.toFixed(2)
											.replace('.', ',')}{unitLong}</text
									>
								{/if}
							</g>
						{/each}
					</g>
				{/if}
			{/each}
			<text x="990" y="1060" font-size="50" text-anchor="end"
				>{totalSelectedYear.toFixed(2).replace('.', ',')}Mt CO2eq</text
			>
		</svg>
	{/if}
	{#if extensiveList && ksgSelection != null}
		<div
			class="absolute rounded p-4 top-0 left-0 h-full w-full overflow-scroll"
			style="background-color: {colorForKey(sortedData[ksgSelection].key).colorCode};"
		>
			<ul class="divide-y">
				{#each sortedData[ksgSelection].sectors as crfSector, c}
					<li
						class="mb-1 text-white grid grid-cols-2"
						on:pointerdown|stopPropagation={() => {
							crfSelection = c;
							extensiveList = false;
						}}
					>
						<span>{(crfSector.absolute[_y] * relativeFactor).toFixed(3)}{unitLong}</span>
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
