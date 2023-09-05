<script>
	import { line, area } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { draw, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { pointer } from 'd3-selection';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let dataHistoric;
	export let dataPaths;
	export let chosenBudget;
	export let thgPathDe;
	export let selectedStartYear;
	export let showKSGGoal;

	$: keys = [
		{
			key: 'nochange',
			label: 'Gleichbleibende Emissionen',
			color: '#9E0669'
		},
		{
			key: 'linear',
			label: 'Jährliche Abnahme um {value}',
			color: '#F56860'
		},
		{
			key: 'linear_alt',
			label: 'Jährliche Abnahme um {value}',
			color: '#F2A60D'
		},
		{
			key: 'percentage',
			label: `Pfad bis Klimaneutralität ${PUBLIC_VERSION == 'at' ? '2040' : ''}<br>${
				chosenBudget.percentPerYear
			}`,
			color: '#F2A60D'
		}
	];

	let chartWidth;
	let chartHeight;
	let margin = { top: 20, right: 15, bottom: 30, left: 0 };

	const thgFactor = PUBLIC_VERSION == 'at' ? 1000 * 1000 : 1;

	let currentYear = dataHistoric[dataHistoric.length - 1].year;
	let maxTHG =
		dataHistoric.reduce((max, value) => {
			if (value.total_co2e_t > max) return value.total_co2e_t;
			return max;
		}, 0) / thgFactor;
	let lastTHG = dataHistoric[dataHistoric.length - 1].total_co2e_t / thgFactor;
	let maxAxis = Math.ceil((maxTHG * 1.1) / 100) * 100;
	let maxYear = dataPaths[dataPaths.length - 1].year + 5;

	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: xScale = scaleLinear().range([0, innerChartWidth]).domain([selectedStartYear, maxYear]);
	$: xScaleOffset = (x) => xScale(x + 1);

	$: yScale = scaleLinear().range([innerChartHeight, 0]).domain([0, maxAxis]);
	let offsetX = 0;

	$: generateLine = (key) => {
		return (
			line()
				.x((d) => xScaleOffset((d.year || 0) + offsetX))
				.y((d) => yScale(key == 'total_co2e_t' ? d[key] / thgFactor : d[key])) || 0
		);
	};

	$: generateArea = (key) => {
		return line()
			.x((d) => xScaleOffset((d.year || currentYear) + offsetX))
			.y((d) => yScale(d[key] || 0));
	};

	$: chosenPath = 1;

	$: areas = selectedKeys.map((key) =>
		key.replace(chosenBudget.value + '_', '') == 'nochange'
			? 'M' +
			  xScaleOffset(currentYear) +
			  ',' +
			  yScale(lastTHG) +
			  'L' +
			  xScaleOffset(getZeroYear(key)) +
			  ',' +
			  yScale(lastTHG) +
			  'L' +
			  xScaleOffset(getZeroYear(key)) +
			  ',' +
			  yScale(0) +
			  'L' +
			  xScaleOffset(currentYear) +
			  ',' +
			  yScale(0) +
			  'Z'
			: generateArea(key)(dataPaths.filter((d) => d.year >= currentYear))
	);
	$: lines = selectedKeys.map((key) =>
		key.replace(chosenBudget.value + '_', '') == 'nochange'
			? 'M' +
			  xScaleOffset(currentYear) +
			  ',' +
			  yScale(lastTHG) +
			  'L' +
			  xScaleOffset(getZeroYear(key)) +
			  ',' +
			  yScale(lastTHG) +
			  'L' +
			  xScaleOffset(getZeroYear(key)) +
			  ',' +
			  yScale(0)
			: generateLine(key)(dataPaths.filter((d) => d.year >= currentYear))
	);

	$: lineHistoric = generateLine('total_co2e_t')(dataHistoric);

	$: selectedKeys = Object.keys(dataPaths[0]).filter((d) => d.includes(chosenBudget.value));

	$: getZeroYear = function (key) {
		if (chosenBudget.usedUp) {
			return chosenBudget.usedUp[key.replace(chosenBudget.value + '_', '')].year
		} else if (key.replace(chosenBudget.value + '_', '') == 'nochange') {
			var selectedRow = dataPaths.reduce((last, d) => (d[key] > 0 ? d : last), null);
			var year = selectedRow.year;
			var selectedValue = selectedRow[key];
			return year + selectedValue / lastTHG;
		} else {
			return dataPaths.find((d) => d[key] == 0)?.year || dataPaths.length - 1;
		}
	};

	$: getReductionRate = function (key) {
		var values = dataPaths.map((d, i) => d[key]);
		var rates = values
			.map((d, i) => Math.round((d - values[Math.max(i - 1, 0)]) * 10) / 10)
			.slice(1)
			.filter((d) => d !== 0);
		var inflectionYear = 0;
		var inflectionIndex = 0;

		// for (var i = 0; i < rates.length; i++) {
		// 	var difference = rates[i] - rates[Math.max(i - 1, 0)];
		// 	console.log(i, difference);
		// 	if (difference > 1 || difference < -1) {
		// 		inflectionYear = dataPaths[i].year;
		// 		inflectionIndex = i;
		// 	}
		// }
		// var valueBeforeInflection = rates[inflectionIndex - 1];
		// var valueAfterInflection = rates[inflectionIndex];

		var string = '';

		if (inflectionYear == 0) {
			string = rates[1] + ' Mio t.';
		} else {
			string =
				valueBeforeInflection +
				' Mio t. bis ' +
				inflectionYear +
				', danach ' +
				valueAfterInflection +
				' Mio t. pro Jahr';
		}

		return string;
	};

	$: ksgDottedLine = showKSGGoal
		? generateLine('ksg')(dataPaths.filter((d) => d.year >= currentYear))
		: null;
	$: ksgTHGLine = showKSGGoal ? generateLine('thg')(thgPathDe) : null;
</script>

<div class="relative">
	<div
		id="legend"
		class="flex-col mb-4 mt-4 md:mt-0 md:absolute md:left-10 md:bottom-10 text-sm bg-white z-20 md:p-1"
	>
		{#each selectedKeys as key, i}
			{@const selectedKey = keys.find((d) => d.key == key.replace(chosenBudget.value + '_', ''))}
			<div
				class="flex my-1 gap-1 items-start leading-tight cursor-pointer {chosenPath == i
					? 'opacity-100'
					: 'opacity-60'}"
				on:mouseover={() => (chosenPath = i)}
				on:focus={() => (chosenPath = i)}
				on:mouseout={() => (chosenPath = 2)}
				on:blur={() => (chosenPath = 2)}
			>
				<div class="pl-1" style="border-left: 4px solid {selectedKey.color}">
					{@html selectedKey.label.replace(
						'{value}',
						chosenBudget.tonsPerYear || getReductionRate(key)
					)}
				</div>
			</div>
		{/each}
		{#if showKSGGoal}
			<hr />
			<div
				class="flex my-1 gap-1 items-start leading-tight {chosenPath == dataPaths.length - 1
					? 'opacity-100'
					: 'opacity-60'}"
			>
				<div class="pl-1 dot-before">Reduktionspfad der Bundesregierung</div>
			</div>
		{/if}
	</div>

	<div class="h-72 w-full mt-4" bind:clientHeight={chartHeight} bind:clientWidth={chartWidth}>
		<svg width={'100%'} height={'100%'}>
			{#if chartWidth && chartHeight && lines && areas}
				{#if selectedStartYear < 2016 && xScaleOffset(currentYear) > 250}
					<line
						x1={xScaleOffset(currentYear)}
						x2={xScaleOffset(currentYear)}
						y1={0}
						y2={chartHeight - margin.bottom}
						class="stroke-gray-400"
					/>
					<text
						text-anchor="end"
						dominant-baseline="hanging"
						x={xScaleOffset(currentYear) - 5}
						y="5"
						class="text-xs uppercase fill-gray-300 font-semibold tracking-wide">Vergangenheit</text
					>
					<text
						x={xScaleOffset(currentYear) + 5}
						y="5"
						dominant-baseline="hanging"
						class="text-xs uppercase fill-gray-300 font-semibold tracking-wide">Zukunft</text
					>
				{/if}

				<g transform="translate({margin.left},{margin.top})">
					<g class="chart-y-axis text-sm text-gray-600">
						{#each yScale.ticks(6) as tick, index}
							<g transform={`translate(0, ${yScale(tick)})`} class="text-gray-500">
								<line
									x1="0"
									x2={innerChartWidth}
									y1="0"
									y2="0"
									stroke-width="1"
									class="stroke-current opacity-30"
								/>
								<text class="text-xs fill-current bg-white" x="2" y="-3"
									>{tick}
									<tspan dx="2" />
									{#if index == 5}
										<tspan dx="1">Mio. t CO₂</tspan>
									{/if}
								</text>
							</g>
						{/each}
					</g>
					<g class="chart-x-axis">
						{#each xScale.ticks(10) as tick, index}
							<g
								transform={`translate(${
									index == 0 ? xScale(tick) + 12 : xScale(tick)
								}, ${innerChartHeight})`}
								class="text-xs text-gray-500"
							>
								{#if tick < 2022 && tick % 10 == 0}
									<text dy={15} text-anchor="middle" fill="currentColor">
										{tick}
									</text>
								{/if}
								<g class="text-gray-500">
									<line y1={0} y2={4} stroke="currentColor" />
								</g>
							</g>
						{/each}
					</g>
					<g id="historic">
						<path
							d="{lineHistoric}L{xScaleOffset(currentYear)},{innerChartHeight}L{margin.left +
								xScaleOffset(1990)},{innerChartHeight}Z"
							fill={'#268EA5'}
							fill-opacity="0.2"
							transition:fade
						/>
						<path
							d={lineHistoric}
							fill="none"
							stroke-width="4"
							stroke={'#268EA5'}
							transition:draw={{ duration: 2000, easing: quintOut }}
						/>
					</g>
					{#if ksgDottedLine}
						<g id="ksg-path">
							<path
								d={ksgDottedLine}
								fill="none"
								stroke-width="4"
								stroke={'#666666'}
								stroke-dasharray="1 8"
								stroke-linecap="round"
							/>
							<path d={ksgTHGLine} fill="none" stroke-width="4" stroke="navy" />
							<text
								text-anchor="end"
								dominant-baseline="hanging"
								x={xScaleOffset(2018)}
								y="40"
								class="text-m uppercase font-semibold tracking-wide"
								fill="navy">THG</text
							>
							<text
								text-anchor="end"
								dominant-baseline="hanging"
								x={xScaleOffset(2018)}
								y="100"
								class="text-m uppercase font-semibold tracking-wide"
								fill="#268EA5">CO₂</text
							>
						</g>
					{/if}
					{#key chosenBudget.value}
						<g id="budget">
							{#each lines as line, i}
								{@const selectedKey = keys.find(
									(d) => d.key == selectedKeys[i].replace(chosenBudget.value + '_', '')
								)}
								<g id="area">
									<!-- svelte-ignore a11y-mouse-events-have-key-events -->
									<path
										d="{areas[i]}L{xScaleOffset(currentYear)},{yScale(0)}L{xScaleOffset(
											currentYear
										)},{yScale(lastTHG)}z"
										fill={selectedKey.color}
										fill-opacity={chosenPath == i ? '0.3' : '0'}
										transition:fade
										on:mouseover={() => (chosenPath = i)}
										on:mouseout={() => (chosenPath = 2)}
									/>
								</g>

								<!-- svelte-ignore a11y-mouse-events-have-key-events -->
								<g
									id="line"
									on:mouseover={() => (chosenPath = i)}
									on:mouseout={() => (chosenPath = 2)}
								>
									<path
										d={line}
										fill="none"
										stroke-width="4"
										stroke={selectedKey.color}
										transition:draw={{ duration: 2000, easing: quintOut }}
									/>
								</g>
							{/each}
						</g>
					{/key}

					{#each selectedKeys as key, i}
						<g
							transform="translate({xScaleOffset(getZeroYear(key))},{innerChartHeight + 16})"
							style="color: {keys[
								keys.findIndex(
									(d) => d.key == selectedKeys[i].replace(chosenBudget.value + '_', '')
								)
							].color}"
						>
							<text class="fill-current text-xs" text-anchor="middle">
								{#if chosenBudget.usedUp}
									<tspan x="1" y="0">{chosenBudget.usedUp[key.replace(chosenBudget.value + '_', '')].season}</tspan>
									<tspan x="0" y="14">{chosenBudget.usedUp[key.replace(chosenBudget.value + '_', '')].year}</tspan>
								{:else if getZeroYear(key) % 1 !== 0}
									<tspan x="1" y="0">Mitte</tspan>
									<tspan x="0" y="14">{Math.floor(getZeroYear(key))}</tspan>
								{:else}
									<tspan x="0" y="0">Anfang</tspan>
									<tspan x="-1" y="14">{Math.floor(getZeroYear(key))}</tspan>
								{/if}
							</text>
						</g>
					{/each}

					<g transform="translate({xScaleOffset(currentYear)},{yScale(lastTHG)})">
						<circle r="5" fill="#268EA5" />
						<circle r="5" fill="#268EA5">
							<animate
								attributeName="r"
								from="5"
								to="10"
								dur="1.5s"
								begin="0s"
								repeatCount="indefinite"
							/>
							<animate
								attributeName="opacity"
								from="1"
								to="0.5"
								dur="1.5s"
								begin="0s"
								repeatCount="indefinite"
							/>
						</circle>
					</g>

					<g
						transform="translate({xScaleOffset(currentYear) +
							(selectedStartYear < 2020 ? 5 : 20)},{innerChartHeight - 45})"
						class="hidden md:block"
					>
						<text
							style="color: {keys[
								keys.findIndex(
									(d) => d.key == selectedKeys[chosenPath].replace(chosenBudget.value + '_', '')
								)
							].color}"
							class="text-sm fill-current uppercase font-semibold tracking-wide"
						>
							<tspan x="0" dy="1.2em">{chosenBudget.value} Mio. t</tspan>
							<tspan x="0" dy="1.2em">CO₂ Budget</tspan>
						</text>
					</g>
				</g>
			{/if}
		</svg>
	</div>
</div>

<style>
	.dot-before {
		padding-left: 0;
		border-left: none;
	}
	.dot-before::before {
		content: '';
		display: inline-block;
		height: 4px;
		width: 4px;
		margin-bottom: 3px;
		margin-right: 4px;
		background-color: #666666;
		border-radius: 2px;
	}
</style>
