<script>
	import { scaleLinear, scaleOrdinal, scaleBand } from 'd3-scale';
	import { fade } from 'svelte/transition';
	import formatNumber from '$lib/stores/formatNumber';
	import formatPercentage from '$lib/stores/formatPercentage';

	export let data;
	export let max;
	export let dataMode;
	export let selectedUnit;

	let chartWidth;

	const margin = { top: 10, right: 1, bottom: 2, left: 1 };

	$: innerChartWidth = chartWidth - margin.left - margin.right;

	$: selectedCategory = false;
	$: selectedParent = false;

	$: if (data) {
		selectedCategory = false;
	}

	$: xScale = scaleLinear().range([0, innerChartWidth]).domain([0, max]);

	$: xScaleGrandChildren = scaleLinear()
		.range([0, innerChartWidth * 0.75])
		.domain([
			0,
			Math.max(
				max / 6.5,
				Array.isArray(selectedCategory?.children) && selectedCategory.children.length > 0
					? selectedCategory.children
							.slice() // Create a copy of the array to avoid mutating the original
							.sort((a, b) => b.total - a.total)[0]?.total || 0
					: 0
			)
		]);

	$: xScaleGreatGrandChildren = scaleLinear().range([0, 200]).domain([0, 10000]);

	$: getOffset = function (element, elements, xScaleType) {
		var total = 0;
		var sortedElements = [...elements].sort((a, b) => b.total - a.total);
		var index = sortedElements.indexOf(element);

		for (var i = 0; i < index; i++) {
			total = total + sortedElements[i].total;
		}

		if (xScaleType == 'xScaleGrandChildren') {
			return xScaleGrandChildren(total);
		} else {
			return xScale(total);
		}
	};

	$: getPercentage = function (value) {
		var percentage = (value.total / data[0].total) * 100;
		return (Math.round(percentage * 10) / 10 + '%').replace('.', ',');
	};

	$: getSectorPercentage = function (child, parent) {
		var percentage = (child / parent / (dataMode == 'national' ? 1000 : 1000000)) * 100;
		return (
			Math.round(percentage * 10) / 10 +
			'% des Sektors ' +
			selectedSubCategory.label
		).replace('.', ',');
	};

	$: getValue = function (number, unit) {
		if (selectedUnit == 'terajoule') {
			var multiplier = 3600;
			if (unit == 'GWh') {
				multiplier = multiplier / 1000;
			}
			if (unit == 'MWh') {
				multiplier = multiplier / 1000000;
			}
			number = number * multiplier;
		}
		return formatNumber(
			number,
			selectedUnit == 'terajoule' ? 'TJ' : unit,
			selectedUnit == 'terajoule' ? 0 : 1
		);
	};

	$: selectedSubCategory = null;

	let m = { x: 0, y: 0 };

	function handleMousemove(event) {
		m.x = event.clientX;
		m.y = event.clientY;
	}
</script>

<div class="relative w-full" bind:clientWidth={chartWidth}>
	{#if chartWidth}
		<svg width={'100%'} height={'200px'}>
			<g transform="translate({margin.left},{margin.top})">
				<g
					transform="translate(0, 0)"
					style="color: {data[0].color}"
					class="cursor-help"
					role="tooltip"
					on:mousedown={() => showGlossary('gas_grossDomesticConsumption')}
				>
					<path
						d="m 2 28 v -22 h {xScale(data[0].total) - 4} v 22"
						class="fill-transparent stroke-current"
						stroke-width={2}
					/>
					<rect
						class="fill-white dark:fill-gray-800"
						x={xScale(data[0].total) / 2 - (data[0].label.length * 9) / 2}
						height={10}
						width={data[0].label.length * 9}
					/>
					<text
						class="fill-current text-xs font-semibold tracking-wide uppercase"
						text-anchor="middle"
						x={xScale(data[0].total) / 2}
						y={11}>{data[0].label}</text
					>
					<text
						class="fill-current text-xs tracking-wide font-semibold"
						text-anchor="middle"
						x={xScale(data[0].total) / 2}
						y={25}
						>{getValue(data[0].total, 'TWh')}
						<tspan dx={2}>{getPercentage(data[0])}</tspan></text
					>
				</g>
				<g transform="translate(0, 32)">
					{#each data[0].children as category}
						<g transform="translate({getOffset(category, data[0].children)}, 0)">
							<g
								style="color: {category.color}"
								class="cursor-help {!selectedParent || selectedParent == category
									? 'opacity-100'
									: 'opacity-50'}"
								role="tooltip"
								on:mouseover={() => (selectedParent = category)}
								on:focus={() => (selectedParent = category)}
								on:mouseout={() => (selectedParent = false)}
								on:blur={() => (selectedParent = false)}
								on:mousedown={() => showGlossary(category.glossary)}
							>
								{#if xScale(category.total) > 150}
									<path
										d="m 2 28 v -22 h {xScale(category.total) - 4} v 22"
										class="fill-transparent stroke-current"
										stroke-width={2}
									/>
									<rect
										class="fill-white dark:fill-gray-800"
										x={xScale(category.total) / 2 - (category.label.length * 9) / 2}
										height={10}
										width={category.label.length * 9}
									/>
									<text
										class="fill-current text-xs font-semibold tracking-wide uppercase"
										text-anchor="middle"
										x={xScale(category.total) / 2}
										y={11}>{category.label}</text
									>
									<text
										class="fill-current text-xs tracking-wide"
										text-anchor="middle"
										x={xScale(category.total) / 2}
										y={25}
										>{getValue(category.total, 'TWh')}
										<tspan dx={2}>{getPercentage(category)}</tspan></text
									>
								{/if}
							</g>

							<g transform="translate(0, 36)">
								<rect fill={category.color} width={xScale(category.total)} height={60} />
								{#if category.children && category.children.length > 0}
									{#each category.children.filter((d) => d.total > 0) as subcategory}
										{@const isAtEndOfChart =
											getOffset(category, data[0].children) > chartWidth * 0.7}
										{@const isSelectedCategory = selectedCategory == subcategory}
										<g
											transform="translate({getOffset(subcategory, category.children)}, 0)"
											class="transition {isSelectedCategory || !selectedCategory
												? 'opacity-100'
												: 'opacity-50'}"
											transition:fade
										>
											<rect
												width={xScale(subcategory.total)}
												height={60}
												role="tooltip"
												fill={subcategory.color}
												on:mouseover={() => (selectedCategory = subcategory)}
												on:focus={() => (selectedCategory = subcategory)}
											/>
											{#if (xScale(subcategory.total) > Math.max(subcategory.label.length, 15) * 7 && selectedCategory == false) || isSelectedCategory}
												<path
													d="m {isAtEndOfChart
														? xScale(subcategory.total) - 1
														: 1} 60 v {isSelectedCategory ? 50 : 40}"
													stroke-width={2}
													stroke={subcategory.color}
													fill="none"
												/>
												<text
													class="font-semibold text-sm md:text-base md:-translate-y-1"
													x={isAtEndOfChart ? xScale(subcategory.total) - 10 : 10}
													y={84}
													fill={subcategory.color}
													text-anchor={isAtEndOfChart ? 'end' : 'start'}>{subcategory.label}</text
												>
												<text
													class="text-sm md:text-base"
													x={isAtEndOfChart ? xScale(subcategory.total) - 10 : 10}
													y={100}
													fill={subcategory.color}
													text-anchor={isAtEndOfChart ? 'end' : 'start'}
													>{getValue(subcategory.total, 'TWh')}
													<tspan dx={4}>{getPercentage(subcategory)}</tspan></text
												>
											{/if}
										</g>
									{/each}
								{/if}
							</g>
						</g>
					{/each}
				</g>

				{#if selectedCategory}
					<g transform="translate(0, 192)" transition:fade>
						<path
							d="m 1 0 v -15 h {innerChartWidth - 2} v 15"
							stroke-width="2"
							stroke={selectedCategory.color}
							fill="transparent"
						/>
					</g>
				{/if}
			</g>
		</svg>
		{#if selectedCategory.children || selectedCategory.description}
			<div
				style="margin:0 {margin.right}px 0 {margin.left}px; color: {selectedCategory.color}; border-color: {selectedCategory.color}"
				class="relative p-2 pt-0 border-x-2 border-b-2 -translate-y-2"
				transition:fade
			>
				{#if selectedCategory}
					<button
						class="absolute top-0 right-1 text-sm"
						on:mousedown={() => (selectedCategory = false)}
						aria-label="Close"
					>
						<svg
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
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				{/if}

				<h3 class="text-lg font-semibold">
					{#if selectedCategory.key == 'sectorEnergy_sub'}
						{selectedCategory.label} im Detail
					{:else}
						Detailverbrauch des Sektors {selectedCategory.label}
					{/if}
				</h3>
				{#if selectedCategory.description}
					<p class="text-sm md:text-base max-w-lg" style="">
						{selectedCategory.description}
					</p>
				{/if}

				{#if selectedCategory.children && selectedCategory.children.length > 0}
					<svg
						width={'100%'}
						height="{selectedCategory.children.filter((d) => d.total > 0).length * 40}px"
						on:mousemove={handleMousemove}
						role="tooltip"
						class="mt-2"
					>
						{#each [...selectedCategory.children]
							.sort((a, b) => b.total - a.total)
							.filter((d) => d.total > 0) as child, index}
							<g
								transform="translate(0, {index * 40})"
								style="color: {selectedCategory.color}"
								on:mouseover={() => (selectedSubCategory = child)}
								on:focus={() => (selectedSubCategory = child)}
								on:mouseout={() => (selectedSubCategory = null)}
								on:blur={() => (selectedSubCategory = null)}
								role="tooltip"
							>
								<rect
									height={36}
									width={xScaleGrandChildren(child.total)}
									class="fill-current"
									stroke-width={1}
									stroke="currentColor"
								/>
								<text
									x={xScaleGrandChildren(child.total) + (child.total > 0 ? 10 : 0)}
									y={14}
									class="font-semibold text-sm fill-current"
								>
									{child.label}
								</text>
								<text
									x={xScaleGrandChildren(child.total) + (child.total > 0 ? 10 : 0)}
									y={32}
									class="text-sm fill-current"
								>
									{getValue(child.total, selectedCategory.childrenUnit || 'TWh')}
									{#if selectedCategory.childrenUnit == 'TWh' || !selectedCategory.childrenUnit}
										<tspan dx={2}>{getPercentage(child)}</tspan>
									{/if}
								</text>
							</g>
						{/each}
					</svg>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if selectedSubCategory}
	{#if selectedSubCategory.children}
		<div
			class="fixed bg-white dark:bg-gray-900 p-4 pointer-events-none shadow"
			style="color: {selectedSubCategory.color}; left: {m.x}px; top: {m.y}px;"
		>
			<p>Prozessverbrauch des Sektors {selectedSubCategory.label}</p>

			{#if selectedSubCategory.children.length > 0}
				<svg
					width={600}
					height={selectedSubCategory.children.filter((d) => d.total > 0).length * 30}
				>
					{#each [...selectedSubCategory.children]
						.sort((a, b) => b.total - a.total)
						.filter((d) => d.total > 0) as subchild, subindex}
						<g transform="translate(4, {subindex * 30 + 4})">
							<rect
								height={24}
								width={xScaleGreatGrandChildren(subchild.total)}
								class="fill-current"
								stroke-width={1}
								stroke="currentColor"
							/>
							<text
								x={xScaleGreatGrandChildren(subchild.total) + (subchild.total > 0 ? 10 : 0)}
								y={10}
								class="font-semibold text-xs fill-current"
							>
								{subchild.label}
							</text>
							<text
								x={xScaleGreatGrandChildren(subchild.total) + (subchild.total > 0 ? 10 : 0)}
								y={24}
								class="text-xs fill-current"
							>
								{getValue(subchild.total, dataMode == 'national' ? 'GWh' : 'MWh')}
								<tspan dx={4}
									>{getSectorPercentage(subchild.total, selectedSubCategory.total)}</tspan
								>
							</text>
						</g>
					{/each}
				</svg>
			{:else}
				<p>
					Keine Daten für dieses Jahr und diese Kategorie verfügbar. Detaildaten sind aktuell bis
					2022 verfügbar.
				</p>
			{/if}
		</div>
	{/if}
{/if}
