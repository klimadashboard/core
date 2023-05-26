<script>
	// import { fade, scale } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	export let sortedData;
	export let sectorlyData;
	export let colorForKey;
	export let iconForCRFCode;
	export let selectedYear;
	export let totalSelectedYear;
	export let years;
	export let useAbsoluteUnits;
	// interactive
	export let ksgSelection;
	export let crfSelection;
	export let ksgHover;
	export let crfHover;
	export let extensiveList;

	// TREE MAP
	$: mouse = null;

	$: _y = selectedYear - 1990;
	$: relativeFactor = useAbsoluteUnits ? 1 : 100 / totalSelectedYear;
	$: unitValue = ({ value, short = true, forceAbsolute = false }) => {
		let val = value * (forceAbsolute ? 1 : relativeFactor);
		let u = 'M';
		if ((useAbsoluteUnits || forceAbsolute) && val < 0.1) {
			val *= 1000;
			u = 'k';
		}
		return `${val.toFixed(2).replace('.', ',')}${
			short
				? useAbsoluteUnits || forceAbsolute
					? `${u}t`
					: '%'
				: useAbsoluteUnits || forceAbsolute
				? `${u}t CO₂eq`
				: '%'
		}`;
	};

	$: [maxTotalYear, maxTotal] = years
		.map((y, yi) => [y, sortedData.reduce((sum, sec) => sum + sec.absolute[yi], 0)])
		.reduce(
			(max, entry) => {
				return max[1] < entry[1] ? entry : max;
			},
			[1990, 0]
		);
	// $: console.log(maxTotalYear, maxTotal);
	$: HEIGHT = 1000;

	// selected ksg sector
	$: selection = ksgSelection != null ? sortedData[ksgSelection] : null;
	$: fixedSelection = ksgSelection != null ? sectorlyData[ksgSelection] : null;
	const area = tweened([-150, 0, 1150, 1150], { easing: cubicInOut, duration: 800 });
	$: selection != null
		? area.set([selection.x, selection.y, selection.w, selection.h])
		: area.set([-150, 0, 1150, 1150]);
</script>

<div
	class="detail-emissions-tree-map relative basis-[500px] pb-[40px] select-none"
	style="background: rgba(0,0,0,0)"
>
	{#if sortedData}
		<svg
			viewBox="-150 -20 1150 1020"
			on:mouseleave={() => {
				ksgHover = null;
				crfHover = null;
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
					fill={ksgHover == s
						? colorForKey(ksgSector.key).colorCodeHighlighted
						: colorForKey(ksgSector.key).colorCode}
					style="transition: fill 0.3s ease;"
					opacity={ksgSelection != null && s != ksgSelection ? 0.2 : 1}
					class="cursor-pointer"
					on:mousedown|stopPropagation={() => {
						ksgSelection = s;
						ksgHover = null;
						crfSelection = null;
						crfHover = null;
					}}
					on:mousemove|stopPropagation={(e) => {
						if (ksgSelection != null) return;
						ksgHover = s;
					}}
				/>
				{#if ksgSector.relative * HEIGHT > 30}
					<g
						class="pointer-events-none"
						transform="translate(-115, {ksgSector.percentCumulative * HEIGHT +
							(ksgSector.relative * HEIGHT) / 2 -
							10})"
					>
						{@html colorForKey(ksgSector.key).icon(1)}
					</g>
				{/if}

				{#if ksgSelection == null || s == ksgSelection}
					<g
						on:mousemove|stopPropagation={(e) => {
							if (ksgSelection != null) return;
							mouse = { x: e.layerX, y: e.layerY };
							ksgHover = s;
						}}
						on:mousedown|stopPropagation={() => {
							ksgSelection = s;
							ksgHover = null;
						}}
						class="transition-opacity cursor-pointer"
					>
						{#each ksgSector.sectors as crfSector, c}
							{@const fontSize = parseInt(Math.max(20, Math.min(ksgSector.h / 2, 50)).toFixed(0))}
							{@const fontSizeCRF = parseInt(
								Math.max(20, Math.min(crfSector.h2 / 2, 50)).toFixed(0)
							)}
							{#if c == 0}
								<foreignObject
									height={ksgSector.h}
									width={ksgSector.w}
									x={ksgSector.x}
									y={ksgSector.y}
								>
									<div
										class="w-full h-full flex items-end justify-start"
										style="border: 3px solid white; transition: background 0.3s ease; background-color: {ksgHover ==
										s
											? colorForKey(ksgSector.key).colorCodeHighlighted
											: colorForKey(ksgSector.key).colorCode};"
									>
										<div
											class="w-full max-h-full flex items-center flex-wrap flex-grow-0 gap-2 text-white"
											style="padding: {fontSize < 30
												? 4
												: fontSize / 4}px; font-size: {fontSize}px;"
										>
											{#if ksgSelection == null}
												<span style="display: inline-block; margin-right: {fontSize / 6}px"
													>{@html colorForKey(ksgSector.key).icon(fontSize / 20)}</span
												>
												<strong
													class="{ksgSector.h < 100
														? 'max-w-[60%]'
														: ''} text-ellipsis overflow-hidden">{@html ksgSector.label}</strong
												>
												<span class=""
													>{unitValue({ value: ksgSector.absolute[_y], short: true })}</span
												>
											{/if}
										</div>
									</div>
								</foreignObject>
							{/if}

							<!-- CRF -->
							<foreignObject
								height={crfSector.h2}
								width={crfSector.w2}
								x={crfSector.x2}
								y={crfSector.y2}
								on:mousemove={(e) => {
									if (ksgSelection == null) return;
									else e.stopPropagation();

									mouse = { x: e.layerX, y: e.layerY };
									crfHover = crfSector.index;
								}}
								on:pointerdown|stopPropagation={() => {
									if (ksgSelection == null) return;
									crfSelection = c;
								}}
							>
								{#if crfSector.h2 >= 40}
									<div
										class="w-full h-full flex items-end justify-between px-[25px]"
										style="transition: background 0.3s ease; background-color: {ksgSelection == null
											? 'transparent'
											: crfHover == crfSector.index
											? colorForKey(crfSector.key).colorCodeHighlighted
											: colorForKey(crfSector.key).colorCode}; {ksgHover == s ||
										ksgSelection != null
											? 'border-bottom: 4px solid #ffffff44;'
											: ''} padding-block: {fontSizeCRF < 30
											? 4
											: fontSizeCRF / 4}px; font-size: {fontSizeCRF}px; color: white;"
									>
										{#if ksgSelection != null}
											<strong class="flex items-center"
												><span class="mr-4">
													{@html iconForCRFCode({
														crfCode: crfSector.code,
														ksgKey: ksgSector.key,
														size: fontSizeCRF / 30
													})}
												</span>
												{crfSector.label}
												<!-- {crfSector.code} -->
											</strong>
											<span>
												{unitValue({ value: crfSector.absolute[_y], short: false })}
											</span>
										{/if}
									</div>
								{/if}
							</foreignObject>
						{/each}
						{#if ksgSelection != null && crfSelection == null && ksgSector.more.active}
							{@const fontSizeMore = Math.min(40, ((ksgSector.more.height + 20) * 3) / 4)}
							<foreignObject
								height={ksgSector.more.height + 20}
								width={1000}
								x={0}
								y={-20}
								style="transition: fill 0.3s ease"
								on:pointerdown|stopPropagation={() => {
									extensiveList = true;
								}}
								on:mousemove={(e) => {
									e.stopPropagation();
									crfHover = -1;
								}}
							>
								<div
									class="w-full h-full flex items-center justify-between px-[25px]"
									style="transition: background 0.3s ease; background-color: {crfHover == -1
										? colorForKey(ksgSector.key).colorCodeHighlighted
										: colorForKey(ksgSector.key).colorCode}; {ksgHover == s || ksgSelection != null
										? 'border-bottom: 4px solid #ffffff44;'
										: ''} font-size: {fontSizeMore}px; color: white;"
								>
									{#if ksgSelection != null}
										<strong class="flex items-center"> Weitere </strong>
										<span>
											{unitValue({ value: ksgSector.more.absolute, short: false })}
										</span>
									{/if}
								</div>
							</foreignObject>
						{/if}
					</g>
				{/if}
			{/each}
			{#if ksgSelection != null && crfSelection != null}
				{@const detailSector = fixedSelection?.sectors[crfSelection]}
				<foreignObject height={HEIGHT} width={1000} x={0} y={0}>
					<div
						class="w-full h-full flex flex-col p-8"
						style="background-color: {colorForKey(detailSector.key)
							.colorCode}; font-size: 50px; color: white;"
					>
						<strong class="basis-[125px] flex items-center">
							<span class="mr-8"
								>{@html iconForCRFCode({
									crfCode: detailSector.code,
									ksgKey: sectorlyData[ksgSelection].key,
									size: 50 / 30
								})}</span
							>
							{detailSector.label}
						</strong>
						<div class="basis-[150px] w-full flex justify-start gap-24">
							<span>
								{unitValue({
									value: detailSector.absolute[_y],
									short: false,
									forceAbsolute: true
								})}
							</span>
							<span
								>{((detailSector.absolute[_y] * 100) / totalSelectedYear)
									.toFixed(2)
									.replace('.', ',')}%</span
							>
						</div>
						<div class="basis-[730px] overflow-hidden">
							<p style="font-size: 43px;">{detailSector.explanation}</p>
						</div>
					</div>
				</foreignObject>
			{/if}
		</svg>
	{/if}
	{#if extensiveList && ksgSelection != null}
		<div
			class="absolute rounded -top-4 -right-4 h-90 w-5/6 overflow-scroll"
			style="background-color: {colorForKey(sortedData[ksgSelection].key).colorCode};"
		>
			<div
				class="text-white p-4 flex justify-between items-start"
				style="background-color: rgba(255,255,255,0.2)"
				on:mousemove={(e) => {
					e.stopPropagation();
					crfHover = null;
				}}
			>
				<strong>Weitere</strong>
				<button
					on:click={() => {
						extensiveList = false;
					}}
					><svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-x"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><line
							x1="18"
							y1="6"
							x2="6"
							y2="18"
						/><line x1="6" y1="6" x2="18" y2="18" /></svg
					></button
				>
			</div>
			<ul class="divide-y">
				{#each sortedData[ksgSelection].sectors as crfSector, c}
					{#if crfSector.h2 < 40}
						<li
							class="px-4 py-2 text-white flex justify-between cursor-pointer"
							style="transition: background 0.3s ease; background-color: {crfHover ==
							crfSector.index
								? colorForKey(crfSector.key).colorCodeHighlighted
								: colorForKey(crfSector.key).colorCode};"
							on:mousemove={(e) => {
								e.stopPropagation();
								mouse = { x: e.layerX, y: e.layerY };
								crfHover = crfSector.index;
							}}
							on:pointerdown|stopPropagation={() => {
								crfSelection = c;
								extensiveList = false;
							}}
						>
							<strong class="flex items-center"
								><span class="mr-4">
									{@html iconForCRFCode({
										crfCode: crfSector.code,
										ksgKey: sortedData[ksgSelection].key,
										size: 25 / 30
									})}
								</span>{crfSector.label}
								<!-- {crfSector.code} -->
							</strong>
							<span>{unitValue({ value: crfSector.absolute[_y], short: false })}</span>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
	{/if}
</div>
