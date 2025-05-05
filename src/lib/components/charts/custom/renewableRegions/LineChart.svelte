<script>
	import { line } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import { getPowerUnit, convertToPowerUnit } from './formatPower';
	import formatNumber from '$lib/stores/formatNumber';

	let chartWidth;
	let chartHeight;

	export let data;

	let margin = { top: 0, right: 20, bottom: 20, left: 40 };

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: innerChartWidth = chartWidth - margin.left - margin.right;

	// Determine max value across all series
	$: maxRawValue = Math.max(...data.flatMap((d) => d.data.map((d) => d.value)));

	$: powerUnit = getPowerUnit(maxRawValue);
	$: convertedMax = convertToPowerUnit(maxRawValue, maxRawValue);

	$: xScale = scaleLinear().domain([2000, 2025]).range([0, innerChartWidth]);

	$: yScale = scaleLinear()
		.domain([0, convertedMax * 1.1])
		.range([innerChartHeight, 0]);

	$: generateLine = line()
		.x((d) => xScale(d.year))
		.y((d) => yScale(convertToPowerUnit(d.value, maxRawValue)));
</script>

<h3 class="my-2">Kumulative Leistung</h3>

<div class="flex gap-2 flex-wrap">
	{#each data as d}
		<span
			class="text-xs opacity-70 rounded-full px-1.5 py-0.5 text-white font-bold"
			style="background: {d.color}">{d.label}</span
		>
	{/each}
</div>

<div class="h-60" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	<svg width={'100%'} height={'100%'} class="overflow-visible">
		<!-- X-Axis -->
		<g transform="translate({margin.left},0)">
			{#each xScale.ticks(10) as year}
				<g transform="translate({xScale(year)},{chartHeight})" class="text-xs opacity-70">
					<text text-anchor="middle" class="fill-current">{year}</text>
					<line x1={0} x2={0} y1={-20} y2={-15} stroke="currentColor" />
				</g>
			{/each}
		</g>

		<!-- Y-Axis -->
		<g transform="translate(0,{margin.top})">
			{#each yScale.ticks() as tick}
				<g transform="translate(0,{yScale(tick)})" class="text-xs opacity-70">
					<line x1="40" x2={chartWidth} y1="0" y2="0" class="stroke-current opacity-20" />
					<text x="" text-anchor="start" dominant-baseline="middle" class="fill-current">
						{formatNumber(tick)}
						{#if tick === yScale.ticks().at(-1)}{powerUnit}{/if}
					</text>
				</g>
			{/each}
		</g>

		<!-- Lines -->
		<g transform="translate({margin.left},{margin.top})">
			{#each data as d}
				<g style="color: {d.color}">
					<path d={generateLine(d.data)} class="fill-none stroke-2 stroke-current" />
				</g>
			{/each}
		</g>
	</svg>
</div>
