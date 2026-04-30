<script>
	// import { fade, scale } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { IconX } from '@tabler/icons-svelte-runes';

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
	export let crfSelection; // Now stores the CRF code instead of index
	export let ksgHover;
	export let crfHover;
	export let extensiveList;

	// Add console logs for the requested props
	$: console.log('SectorsTreeChart - ksgSelection:', ksgSelection);
	$: console.log('SectorsTreeChart - crfSelection:', crfSelection);
	$: console.log('SectorsTreeChart - ksgHover:', ksgHover);
	$: console.log('SectorsTreeChart - crfHover:', crfHover);
	$: console.log('SectorsTreeChart - extensiveList:', extensiveList);

	// TREE MAP
	$: mouse = null;

	$: _y = selectedYear - 1990;
	$: relativeFactor = useAbsoluteUnits ? 1 : 100 / totalSelectedYear;
	$: unitValue = ({ value, short = true, forceAbsolute = false }) => {
		let val = value * (forceAbsolute ? 1 : relativeFactor);
		if (useAbsoluteUnits || forceAbsolute) {
			if (val < 1) {
				const tons = (val * 1_000_000).toLocaleString('de-AT', { maximumFractionDigits: 0 });
				return `${tons}${short ? 't' : 't CO₂eq'}`;
			}
			return `${val.toFixed(2).replace('.', ',')}${short ? 'Mt' : 'Mt CO₂eq'}`;
		}
		return `${val.toFixed(2).replace('.', ',')}%`;
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
	$: selection = ksgSelection != null ? sortedData.find((sec) => sec.key === ksgSelection) ?? null : null;
	$: fixedSelection = ksgSelection != null ? sectorlyData.find((sec) => sec.key === ksgSelection) ?? null : null;
	$: sortedSelection = selection;
	const area = tweened([-150, 0, 1150, 1150], { easing: cubicInOut, duration: 800 });
	$: selection != null
		? area.set([selection.x, selection.y, selection.w, selection.h])
		: area.set([-150, 0, 1150, 1150]);
</script>

<div
	class="detail-emissions-tree-map relative basis-[450px] pb-[40px] select-none"
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
					fill={ksgHover == ksgSector.key
						? colorForKey(ksgSector.key).colorCodeHighlighted
						: colorForKey(ksgSector.key).colorCode}
					style="transition: fill 0.3s ease;"
					opacity={ksgSelection != null && ksgSector.key != ksgSelection ? 0.2 : 1}
					class="cursor-pointer"
					on:mousedown|stopPropagation={() => {
						ksgSelection = ksgSector.key;
						ksgHover = null;
						crfSelection = null;
						crfHover = null;
					}}
					on:mousemove|stopPropagation={(e) => {
						if (ksgSelection != null) return;
						ksgHover = ksgSector.key;
					}}
				/>
				{#if ksgSector.relative * HEIGHT > 30}
					<g
						class="pointer-events-none"
						transform="translate(-115, {ksgSector.percentCumulative * HEIGHT +
							(ksgSector.relative * HEIGHT) / 2 -
							10})"
					>
						<svelte:component this={colorForKey(ksgSector.key).iconComponent} size={30} color="white" />
					</g>
				{/if}

				{#if ksgSelection == null || ksgSector.key == ksgSelection}
					<g
						on:mousemove|stopPropagation={(e) => {
							if (ksgSelection != null) return;
							mouse = { x: e.layerX, y: e.layerY };
							ksgHover = ksgSector.key;
						}}
						on:mousedown|stopPropagation={() => {
							ksgSelection = ksgSector.key;
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
										style="border: 3px solid white; transition: background 0.3s ease; background-color: {ksgHover == ksgSector.key
											? colorForKey(ksgSector.key).colorCodeHighlighted
											: colorForKey(ksgSector.key).colorCode};"
									>
										<div
											class="w-full max-h-full flex items-center flex-wrap grow-0 gap-2 text-white"
											style="padding: {fontSize < 30
												? 4
												: fontSize / 4}px; font-size: {fontSize}px;"
										>
											{#if ksgSelection == null}
												<span style="display: inline-block; margin-right: {fontSize / 6}px"
													><svelte:component this={colorForKey(ksgSector.key).iconComponent} size={Math.round(fontSize * 1.5)} color="white" /></span
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
									crfHover = crfSector.code;
								}}
								on:pointerdown|stopPropagation={() => {
									if (ksgSelection == null) return;
									crfSelection = crfSector.code;
								}}
							>
								{#if crfSector.h2 >= 40}
									<div
										class="w-full h-full flex items-end justify-between px-[25px]"
										style="transition: background 0.3s ease; background-color: {ksgSelection == null
											? 'transparent'
											: crfHover == crfSector.code
												? colorForKey(crfSector.key).colorCodeHighlighted
												: colorForKey(crfSector.key).colorCode}; {ksgHover == ksgSector.key ||
										ksgSelection != null
											? 'border-bottom: 4px solid #ffffff44;'
											: ''} padding-block: {fontSizeCRF < 30
											? 4
											: fontSizeCRF / 4}px; font-size: {fontSizeCRF}px; color: white;"
									>
										{#if ksgSelection != null}
											<strong class="flex items-center"
												><span class="mr-4">
													<svelte:component this={iconForCRFCode({ crfCode: crfSector.code, ksgKey: ksgSector.key })} size={fontSizeCRF} color="white" />
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
										: colorForKey(ksgSector.key).colorCode}; {ksgHover == ksgSector.key || ksgSelection != null
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
				{@const detailSector = sortedSelection?.sectors.find(
					(sector) => sector.code === crfSelection
				)}
				<foreignObject height={HEIGHT} width={1000} x={0} y={0}>
					<div
						class="w-full h-full flex flex-col p-8"
						style="background-color: {colorForKey(detailSector.key)
							.colorCode}; font-size: 50px; color: white;"
					>
						<strong class="basis-[125px] flex items-center">
							<span class="mr-8"
								><svelte:component this={iconForCRFCode({ crfCode: detailSector.code, ksgKey: ksgSelection })} size={50} color="white" /></span
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
			class="absolute rounded-sm -top-4 -right-4 h-90 w-5/6 overflow-scroll"
			style="background-color: {colorForKey(ksgSelection).colorCode};"
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
					>
					<IconX size={24} />
				</button
				>
			</div>
			<ul class="divide-y">
				{#each (selection?.sectors ?? []) as crfSector, c}
					{#if crfSector.h2 < 40}
						<li
							class="px-4 py-2 text-white flex justify-between cursor-pointer"
							style="transition: background 0.3s ease; background-color: {crfHover ==
							crfSector.code
								? colorForKey(crfSector.key).colorCodeHighlighted
								: colorForKey(crfSector.key).colorCode};"
							on:mousemove={(e) => {
								e.stopPropagation();
								mouse = { x: e.layerX, y: e.layerY };
								crfHover = crfSector.code;
							}}
							on:pointerdown|stopPropagation={() => {
								crfSelection = crfSector.code;
								extensiveList = false;
							}}
						>
							<strong class="flex items-center"
								><span class="mr-4">
									<svelte:component this={iconForCRFCode({ crfCode: crfSector.code, ksgKey: ksgSelection })} size={25} color="white" />
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
