<script>
	import { min, max, extent, bisector } from 'd3-array';
	import { scaleLinear, scaleTime } from 'd3-scale';

	export let data;
	export let selectedCountries;
	export let worldAverage;

	let chartWidth;
	let yHeight = 40;

	let margin = { left: 150, right: 0, top: 30, bottom: 0 };

	$: chartHeight = (data.length + 1) * yHeight + margin.top + margin.bottom;

	$: maxValue = Math.max(max(data, (d) => d.value) * 1.25, 0);

	$: xScale = scaleLinear()
		.range([0, chartWidth - margin.left - margin.right])
		.domain([0, maxValue]);

	$: removeCountry = function (code) {
		selectedCountries?.splice(selectedCountries.indexOf(code), 1);
		selectedCountries = selectedCountries;
	};
</script>

<div class="" style="height: {chartHeight}px" bind:clientWidth={chartWidth}>
	{#if chartWidth && chartHeight}
		<svg width="100%" height="100%">
			{#each xScale.ticks() as tick, i}
				<g transform={`translate(${margin.left + xScale(tick)}, 4)`} class="text-xs text-gray-500">
					<text fill="currentColor" text-anchor="middle" dominant-baseline="hanging"
						>{tick}
						{i + 1 == xScale.ticks().length ? 't THG' : ''}</text
					>
					<line x1={0} x2={0} y1={14} y2={chartHeight} class="stroke-gray-200 stroke-1" />
				</g>
			{/each}
			{#if worldAverage > 0}
				<g transform="translate({xScale(worldAverage) + margin.left},4)">
					<rect width={62} height={10} class="fill-white" />
					<text dominant-baseline="hanging" text-anchor="middle" class="text-sm font-bold">🌍</text>
					<text class="text-xs text-gray-800 font-bold" dominant-baseline="hanging" x={10}
						>{worldAverage}t THG</text
					>
					<line x1={0} x2={0} y1={10} y2={chartHeight} class="stroke-gray-600 stroke-1" />
				</g>
			{/if}
			<g transform="translate(0,{margin.top})">
				{#each data as country, i}
					<g transform="translate(0,{i * yHeight})">
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
								class="fill-white text-sm font-bold">{country.value}</text
							>
						{:else}
							<text x={margin.left + 10} y={8} dominant-baseline="hanging">No data available</text>
						{/if}
						<g
							transform="translate({xScale(country.value) + margin.left + 10},0)"
							class="opacity-10 hover:opacity-100 transition cursor-pointer"
							on:mousedown={removeCountry(country.code)}
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
								d="M12 2l.324 .001l.318 .004l.616 .017l.299 .013l.579 .034l.553 .046c4.785 .464 6.732 2.411 7.196 7.196l.046 .553l.034 .579c.005 .098 .01 .198 .013 .299l.017 .616l.005 .642l-.005 .642l-.017 .616l-.013 .299l-.034 .579l-.046 .553c-.464 4.785 -2.411 6.732 -7.196 7.196l-.553 .046l-.579 .034c-.098 .005 -.198 .01 -.299 .013l-.616 .017l-.642 .005l-.642 -.005l-.616 -.017l-.299 -.013l-.579 -.034l-.553 -.046c-4.785 -.464 -6.732 -2.411 -7.196 -7.196l-.046 -.553l-.034 -.579a28.058 28.058 0 0 1 -.013 -.299l-.017 -.616c-.003 -.21 -.005 -.424 -.005 -.642l.001 -.324l.004 -.318l.017 -.616l.013 -.299l.034 -.579l.046 -.553c.464 -4.785 2.411 -6.732 7.196 -7.196l.553 -.046l.579 -.034c.098 -.005 .198 -.01 .299 -.013l.616 -.017c.21 -.003 .424 -.005 .642 -.005zm3 9h-6l-.117 .007a1 1 0 0 0 .117 1.993h6l.117 -.007a1 1 0 0 0 -.117 -1.993z"
								stroke-width="0"
								fill="currentColor"
							/>
						</g>
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>
