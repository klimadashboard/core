<script>
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';
	import { formatPower, getPowerUnit, convertToPowerUnit } from './formatPower';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let colors;

	let chartHeight;
	let chartWidth;
	let selectedVariable = 'net_power_kw';

	let margin = { top: 0, right: 30, bottom: 20, left: 50 };

	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: barWidth =
		chartWidth > 600 ? innerChartWidth / data.length - 5 : innerChartWidth / data.length - 2;

	$: minValue = min(data, (d) => d[selectedVariable]);
	$: maxValue = max(data, (d) => d[selectedVariable]);

	$: lastYear = data[data.length - 1]?.year;

	$: powerUnit = getPowerUnit(Math.max(Math.abs(minValue), Math.abs(maxValue)));

	$: yScale = scaleLinear()
		.domain([convertToPowerUnit(minValue, maxValue), convertToPowerUnit(maxValue, maxValue)])
		.range([innerChartHeight, 0]);

	$: xScale = scaleLinear()
		.domain([data[0]?.year || 2000, data[data.length - 1]?.year])
		.range([margin.left, chartWidth - margin.right]);

	let hoveredYear = lastYear;

	function onMouseMove(event) {
		const { left } = event.currentTarget.getBoundingClientRect();
		const x = event.clientX - left;
		const year = Math.round(xScale.invert(x));
		hoveredYear = year;
	}

	function onMouseLeave() {
		hoveredYear = lastYear;
	}
</script>

{#if hoveredYear}
	{#if data.find((d) => d.year === hoveredYear)}
		<div
			class="text-xs mt-1 inline-block rounded-full p-1 text-white font-bold"
			style="background: {colors[1]}"
		>
			<b>{hoveredYear}:</b>
			{#each data.filter((d) => d.year === hoveredYear) as item}
				<span style="color: {item.color}">
					{formatPower(item[selectedVariable])}
				</span>
			{/each}
			<span class="opacity-60 ml-1">{powerUnit}</span>
		</div>
	{/if}
{/if}

{#if data.length > 0}
	<div
		class="flex gap-2 items-end h-64 mt-2 relative"
		bind:clientHeight={chartHeight}
		bind:clientWidth={chartWidth}
		on:mousemove={onMouseMove}
		on:mouseleave={onMouseLeave}
	>
		<svg width="100%" height="100%">
			<!-- x-axis -->
			<g>
				{#each xScale.ticks(chartWidth > 600 ? 10 : 5) as year}
					<g
						transform="translate({xScale(year) + barWidth / 2},{chartHeight})"
						class="text-xs opacity-70"
					>
						<text text-anchor="middle" class="fill-current">{year}</text>
						<line x1={0} x2={0} y1={-20} y2={-12} stroke="currentColor" />
					</g>
				{/each}
			</g>

			<!-- y-axis -->
			<g>
				{#each yScale.ticks() as tick}
					<g transform="translate(0,{yScale(tick)})" class="text-xs opacity-70">
						<line x1="40" x2={chartWidth} y1="0" y2="0" class="stroke-current opacity-20" />
						<text x="0" text-anchor="left" dominant-baseline="middle" class="fill-current">
							{formatNumber(tick)}
							{#if tick === yScale.ticks().at(-1)}{powerUnit}{/if}
						</text>
					</g>
				{/each}
			</g>

			<!-- bars -->
			<g style="color: {colors[1]}">
				{#each data as item}
					<g class={hoveredYear && hoveredYear !== item.year ? 'opacity-70' : ''}>
						{#if item[selectedVariable] >= 0}
							<rect
								x={xScale(item.year)}
								y={yScale(convertToPowerUnit(item[selectedVariable], maxValue))}
								width={barWidth}
								height={yScale(convertToPowerUnit(0, maxValue)) -
									yScale(convertToPowerUnit(item[selectedVariable], maxValue))}
								fill={colors[1]}
							/>
						{:else}
							<rect
								x={xScale(item.year)}
								y={yScale(convertToPowerUnit(0, maxValue))}
								width={barWidth}
								height={yScale(convertToPowerUnit(item[selectedVariable], maxValue)) -
									yScale(convertToPowerUnit(0, maxValue))}
								fill={colors[1]}
							/>
						{/if}
					</g>
				{/each}
			</g>
			{#if hoveredYear}
				{#if data.find((d) => d.year === hoveredYear)}
					<g>
						<line
							x1={xScale(hoveredYear) + barWidth / 2}
							x2={xScale(hoveredYear) + barWidth / 2}
							y1={0}
							y2={innerChartHeight}
							stroke="currentColor"
							stroke-dasharray="4 2"
							class="opacity-40"
						/>
						<text
							x={xScale(hoveredYear) + barWidth / 2}
							y={margin.top + innerChartHeight + 10}
							dominant-baseline="hanging"
							text-anchor="middle"
							class="text-xs fill-current font-bold"
						>
							{hoveredYear}
						</text>
					</g>
				{/if}
			{/if}
		</svg>
	</div>
{/if}
