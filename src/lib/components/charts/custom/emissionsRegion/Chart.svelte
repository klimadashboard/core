<script lang="ts">
	import { page } from '$app/state';
	import { scaleLinear } from 'd3-scale';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let region;

	console.log(data);

	let chartWidth;
	let chartHeight;

	$: barWidth = chartWidth && maxYear && minYear ? chartWidth / (maxYear - minYear) - 4 : 8;
	$: margin = { top: 0, right: 20, bottom: 20, left: 50 };
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	// group data by period
	$: years = [...new Set(data.map((d) => d.year))].sort();

	$: categoryOrder = region.categoryOrder ?? [];

	$: grouped = years.map((year) => {
		const values = categoryOrder.map((cat) => {
			const match = data.find((d) => d.year === year && d.category === cat);
			return {
				sector: cat,
				label: match?.category_label ?? cat,
				color: match?.category_color ?? '#ccc',
				value: match?.value ?? 0
			};
		});

		return {
			year,
			sectors: values,
			total: values.reduce((sum, d) => sum + d.value, 0)
		};
	});

	// stack sectors
	$: stacked = grouped.map((yearData) => {
		let yOffset = 0;
		const stackedSectors = yearData.sectors.map((s) => {
			const start = yOffset;
			yOffset += s.value;
			return { ...s, start, end: yOffset };
		});
		return { ...yearData, stackedSectors };
	});

	let unit = 'Mt CO2eq';

	$: maxTotal = Math.max(...grouped.map((g) => g.total));
	$: minYear = 1990;
	$: maxYear = 2050;

	$: xScale = scaleLinear().domain([minYear, maxYear]).range([0, innerChartWidth]);
	$: yScale = scaleLinear().domain([0, maxTotal]).range([innerChartHeight, 0]);
</script>

{#if grouped.length > 0}
	<div>
		<p class="text-xl mt-4">
			Die Sektoren mit dem größten Anteil an Emissionen im Jahr {grouped[grouped.length - 1].year}
			in
			<span class="underline underline-offset-4 decoration-current/40"
				>{region.name} ({region.layer_label})</span
			>
			sind
			{#each grouped[grouped.length - 1].sectors
				.slice()
				.sort((a, b) => b.value - a.value)
				.slice(0, 3) as s, i}
				<span
					class="inline-block px-1 py-0.5 rounded text-white"
					style="background-color: {s.color}"
				>
					{s.label}
				</span>{i < 2 ? ', ' : '.'}
			{/each}
		</p>
	</div>

	<div bind:clientWidth={chartWidth} bind:clientHeight={chartHeight} class="h-80 mt-4">
		{#if chartWidth && chartHeight}
			<svg width="100%" height="100%">
				<!-- x-axis -->
				<g transform={`translate(${margin.left},${margin.top + innerChartHeight})`}>
					{#each xScale.ticks() as tick}
						<g transform={`translate(${xScale(tick)}, 0)`} class="text-xs">
							<line x1={0} y1={0} x2={0} y2={5} class="stroke-current/10" />
							<text class="fill-current/70" dominant-baseline="hanging" y={7} text-anchor="middle">
								{tick}
							</text>
						</g>
					{/each}
				</g>

				<!-- y-axis -->
				<g transform={`translate(0,${margin.top})`}>
					{#each yScale.ticks() as tick, i}
						<g transform={`translate(0, ${yScale(tick)})`} class="text-xs">
							<line x1={0} y1={0} x2={chartWidth} y2={0} class="stroke-current/10" />
							<text class="fill-current/70" x={4}>
								{formatNumber(tick / 1_000_000)}
								{i === 0 ? unit : ''}
							</text>
						</g>
					{/each}
				</g>

				<!-- bars -->
				<g transform={`translate(${margin.left},${margin.top})`}>
					{#each stacked as yearData}
						<g transform={`translate(${xScale(yearData.year)}, 0)`}>
							{#each yearData.stackedSectors as s}
								<rect
									x={-barWidth / 2}
									y={yScale(s.end)}
									width={barWidth}
									height={yScale(s.start) - yScale(s.end)}
									fill={s.color}
								>
									<title>{s.label}: {formatNumber(s.value)} t</title>
								</rect>
							{/each}
						</g>
					{/each}
				</g>
			</svg>
		{/if}
	</div>
{/if}
