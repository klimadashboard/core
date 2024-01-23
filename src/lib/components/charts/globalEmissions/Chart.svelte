<script>
	import { min, max, extent, bisector } from 'd3-array';
	import { scaleLinear, scaleTime } from 'd3-scale';

	export let data;
	export let selectedCountries;

	let chartWidth;
	let yHeight = 40;

	let margin = { left: 150, right: 0, top: 20, bottom: 0 };

	$: chartHeight = (data.length + 1) * yHeight + margin.top + margin.bottom;

	$: xScale = scaleLinear()
		.range([0, chartWidth - margin.left - margin.right])
		.domain([0, max(data, (d) => d.value) * 1.2]);

	console.log(data);
</script>

<div class="" style="height: {chartHeight}px" bind:clientWidth={chartWidth}>
	{#if chartWidth && chartHeight}
		<svg width="100%" height="100%">
			{#each xScale.ticks() as tick}
				<g transform={`translate(${margin.left + xScale(tick)}, 0)`} class="text-xs text-gray-500">
					<text fill="currentColor" text-anchor="middle" dominant-baseline="hanging">{tick}t</text>
					<line x1={0} x2={0} y1={14} y2={chartHeight} class="stroke-gray-200 stroke-1" />
				</g>
			{/each}
			<g transform="translate(0,{margin.top})">
				{#each data as country, i}
					<g
						transform="translate(0,{i * yHeight})"
						on:mousedown={() =>
							selectedCountries.splice(selectedCountries.indexOf(country.code), 1)}
					>
						<text
							dominant-baseline="middle"
							text-anchor="end"
							x={margin.left - 10}
							y={16}
							class="text-sm font-bold">{country.label}</text
						>
						{#if country.value}
							<rect
								x={margin.left}
								width={xScale(country.value)}
								height={yHeight - 10}
								class="fill-gray-900"
							/>
							<image
								x={margin.left + 10}
								y={8}
								width={25}
								href="https://data.klimadashboard.org/global/flags/{country.code}.svg"
							/>
							<text
								x={xScale(country.value) + margin.left - 5}
								y={yHeight / 2 - 4}
								dominant-baseline="middle"
								text-anchor="end"
								class="fill-white text-sm">{country.value}t</text
							>
						{:else}
							<text x={margin.left + 10} y={8} dominant-baseline="hanging">No data available</text>
						{/if}
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>
