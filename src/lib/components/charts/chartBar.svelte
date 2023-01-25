<script>
	import { min, max } from 'd3-array';
	import { scaleLinear } from 'd3-scale';
	import { fade } from 'svelte/transition';
	import { pointer } from 'd3-selection';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let sort = '';
	export let source = '';
	export let label = '';
	export let lines = [];
	export let visualisation = 'standard'; // can also be »stacked« or »grouped«
	export let xAxixInterval = 1;
	export let unit = '';
	export let show0ValuesInLegend = false;
	export let freezeYAxis = false;

	let chartHeight;
	let chartWidth;
	const margin = { top: 20, right: 0, bottom: 50, left: 20 };

	$: padding = Math.min(3, Math.round(chartWidth / data.length / 5));
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: barWidth = (innerChartWidth - padding * data.length) / data.length;
	$: selectedBar = [];

	let dataValues; // variable to collect all relevant values for domain and range purposes

	$: if (visualisation == 'stacked' || visualisation == 'grouped') {
		if (visualisation == 'stacked') {
			// calculate total of all values
			dataValues = data.map((entry, index) => {
				var total = 0;
				for (var i = 0; i < entry.categories.length; i++) {
					total += entry.categories[i].value;
				}
				return {
					x: index,
					value: total
				};
			});
		} else {
			// get all relevant values
			dataValues = data.map((entry, i) => {
				var result = [];
				for (var j = 0; j < entry.categories.length; j++) {
					result.push({
						x: i,
						label: entry.categories[j].label,
						value: entry.categories[j].value
					});
				}
				return result;
			});
			dataValues = [].concat(...dataValues);
		}
	} else {
		dataValues = data.map((entry, i) => {
			return {
				x: i,
				value: entry.value
			};
		});
	}

	$: maxYValue = freezeYAxis ? maxYValue : max(dataValues, (d) => d.value);

	$: yScale = scaleLinear()
		.range([0, innerChartHeight])
		.domain([0, maxYValue * 1.2]);

	/* Sorting Function */
	$: if (sort == 'ascending') {
		data.sort(function (a, b) {
			return a.value - b.value;
		});
	} else if (sort == 'descending') {
		data.sort(function (a, b) {
			return b.value - a.value;
		});
	}

	$: calculateYPositionForCategory = function (category, datapoint) {
		var position = 0;
		if (visualisation == 'grouped') {
			position = innerChartHeight - yScale(category.value);
		} else {
			var previousValues = 0;
			for (var i = 0; i < datapoint.categories.indexOf(category); i++) {
				previousValues += datapoint.categories[i].value;
			}
			position = innerChartHeight - yScale(category.value) - yScale(previousValues);
		}
		return position;
		// visualisation == "grouped" ? innerChartHeight - yScale(category.value) || 0 : innerChartHeight - yScale(category.value)
	};

	const handleMouseMove = function (event) {
		const [currentXPosition] = pointer(event);
		const mappedPosition = ([currentXPosition][0] / innerChartWidth) * data.length;
		const index = Math.floor(mappedPosition);
		selectedBar = data[index] || [];
	};

	const handleMouseLeave = function () {
		selectedBar = [];
	};

	$: prettifyTick = function (tick, includeUnit = true) {
		if (tick > 999999) {
			return formatNumber(Math.round((tick / 1000000) * 100) / 100) + (includeUnit ? ' Mio' : '');
		}
		return formatNumber(tick);
	};
</script>

<div class="relative h-full" bind:clientHeight={chartHeight} bind:clientWidth={chartWidth}>
	{#if innerChartWidth && innerChartHeight && barWidth}
		<svg width={'100%'} height={'100%'}>
			<g class="y-axis" transform={`translate(0, ${margin.top})`}>
				{#each yScale.ticks(6) as tick, index}
					{@const isUppermost = index == yScale.ticks(6).length - 1}
					<g transform={`translate(0, ${innerChartHeight - yScale(tick)})`} class="text-gray-500">
						<line
							x1="0"
							x2={chartWidth}
							y1="0"
							y2="0"
							stroke-width="1"
							class="stroke-current opacity-30"
						/>
						<text class="text-xs fill-current bg-white" x="2" y="-3"
							>{prettifyTick(tick, isUppermost)}
							<tspan dx="2">{isUppermost ? unit : ''}</tspan></text
						>
					</g>
				{/each}
			</g>

			<g transform={`translate(${margin.left}, ${margin.top})`}>
				{#each data as datapoint, i}
					<g
						class={datapoint.highlight ? 'text-green-700' : 'text-green-500 '}
						transform={`translate(${i * (barWidth + padding) || 0} 0)`}
						in:fade={{ delay: i * 62 }}
					>
						{#if datapoint.categories !== undefined}
							{#each datapoint.categories as category, j}
								<g>
									<linearGradient
										id="grad-{category.key}-{category.color}"
										x1="0%"
										y1="0%"
										x2="0%"
										y2="100%"
									>
										<stop offset="0%" style="stop-color:{category.color};stop-opacity:1" />
										<stop offset="100%" style="stop-color:{category.color};stop-opacity:0.8" />
									</linearGradient>
									<rect
										class="bar"
										width={visualisation == 'grouped'
											? barWidth / datapoint.categories.length || 0
											: barWidth}
										height={yScale(category.value) || 0}
										fill={category.estimate
											? 'transparent'
											: category.color
											? 'url(#grad-' + category.key + '-' + category.color + ')'
											: 'currentColor'}
										stroke={category.estimate
											? 'currentColor'
											: category.color
											? category.color
											: 'currentColor'}
										stroke-width={category.estimate ? '2' : '0'}
										x={visualisation == 'grouped'
											? (j * barWidth) / datapoint.categories.length || 0
											: 0}
										y={calculateYPositionForCategory(category, datapoint)}
										on:mouseover={(e) => (selectedBar = datapoint)}
										on:focus={(e) => (selectedBar = datapoint)}
										on:mouseout={(e) => (selectedBar = [])}
										on:blur={(e) => (selectedBar = [])}
									/>
								</g>
							{/each}
						{:else}
							<rect
								class="bar"
								width={barWidth || 0}
								height={yScale(datapoint.value) || 0}
								fill={datapoint.estimate ? 'estimate' : 'currentColor'}
								stroke="currentColor"
								stroke-width="2"
								x="0"
								y={innerChartHeight - yScale(datapoint.value) || 0}
								on:mouseover={(e) => (selectedBar = datapoint)}
								on:focus={(e) => (selectedBar = datapoint)}
								on:mouseout={(e) => (selectedBar = [])}
								on:blur={(e) => (selectedBar = [])}
							/>
							{#if selectedBar == datapoint}
								<g
									transform={`translate(0, ${
										innerChartHeight - yScale(datapoint.value) - 32 || 0
									})`}
									class="text-sm text-white"
								>
									<rect width={barWidth} height="28" class="shadow-sm fill-current" />
									<g transform="translate(4,4)" class="text-gray-800">
										<text class="fill-current">{datapoint.label}</text>
										<text y="16" class="fill-current"
											>{Math.round(datapoint.value * 10) / 10} {unit}</text
										>
									</g>
								</g>
							{/if}
							<g transform="translate(5, {innerChartHeight - yScale(datapoint.value) + 5})">
								{@html datapoint.icon}
							</g>
						{/if}

						{#if i % xAxixInterval == 0}
							<g
								transform="translate(0, {innerChartHeight + 4})"
								class="text-xs {selectedBar == datapoint
									? 'text-gray-700 '
									: 'text-gray-500'} tracking-wide"
							>
								<rect
									width={barWidth}
									height={margin.bottom}
									x={-4}
									class="text-white  fill-current"
								/>
								<text fill="currentColor" dominant-baseline="hanging">{datapoint.label}</text>
							</g>
						{/if}

						{#if datapoint.annotation}
							<g
								transform="translate({-barWidth / 2},{innerChartHeight * 0.15})"
								class="text-gray-700"
							>
								<text
									class="text-sm fill-current font-semibold"
									text-anchor="end"
									dominant-baseline="hanging"
									y="-1em"
								>
									{#each datapoint.annotation.match(/.{1,30}/g) as text}
										<tspan x="0" dy="1em">{text}</tspan>
									{/each}
								</text>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="icon icon-tabler icon-tabler-corner-right-down-double"
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
									<path d="M5 4h6a3 3 0 0 1 3 3v7" />
									<path d="M10 10l4 4l4 -4m-8 5l4 4l4 -4" />
								</svg>
							</g>
						{/if}
					</g>
				{/each}

				{#each lines as line}
					<g
						class="text-gray-500 hover:text-gray-600   transition"
						transform={`translate(0, ${innerChartHeight - yScale(line.value) || 0})`}
					>
						<line
							x1="0"
							y1="0"
							x2={chartWidth}
							y2="0"
							stroke="currentColor"
							stroke-dasharray="1,10"
							stroke-linecap="round"
							stroke-width="2"
						/>
						{#each line.label.split(' ') as text, index}
							<text
								x={innerChartWidth - 10}
								y={-6 + (line.label.split(' ').length - 1 - index) * -14}
								text-anchor="end"
								class="text-xs uppercase font-semibold fill-current">{text}</text
							>
						{/each}
					</g>
				{/each}

				<rect
					fill="transparent"
					width={innerChartWidth}
					height={innerChartHeight}
					on:mousemove={handleMouseMove}
					on:mouseleave={handleMouseLeave}
				/></g
			>

			<g class="text-gray-600">
				<line
					x1={margin.left}
					y1={innerChartHeight + margin.top || 0}
					x2={chartWidth || 0}
					y2={innerChartHeight + margin.top || 0}
					stroke="currentColor"
					stroke-width="2"
				/>
			</g>
		</svg>
	{/if}

	{#if selectedBar}
		<div class="absolute top-0 left-4 flex flex-wrap gap-2 px-4 md:px-0">
			{#if selectedBar.categories}
				{#each selectedBar.categories.filter( (c) => (show0ValuesInLegend ? c.value > -1 : c.value > 0) ) as category}
					<div
						class="font-semibold tracking-wide px-3 py-1 text-white text-xs rounded-full"
						style="background-color:{category.color || '#41AB5D'}"
						transition:fade={{ duration: 300 }}
					>
						<span class="uppercase">{category.label}</span>
						<span class="">{prettifyTick(category.value)}</span>
						{#if unit.length < 8}
							<span class="text-xs transform -translate-x-0.5 inline-block">{unit}</span>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>
