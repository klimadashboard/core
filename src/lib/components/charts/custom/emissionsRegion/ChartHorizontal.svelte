<script>
	import { scaleLinear } from 'd3-scale';
	import { regionColors } from '../mobilityRenewableShare/transformData';

	export let data;
	export let region;

	let chartWidth;
	let chartHeight;

	// Compute total and scale
	$: total = data.reduce((sum, d) => sum + d.value, 0);
	$: xScale = scaleLinear().domain([0, total]).range([0, chartWidth]);

	// Compute xOffsets for horizontal stacking
	$: stackedData = [];
	$: {
		let offset = 0;
		stackedData = data.map((d) => {
			const item = { ...d, xOffset: offset };
			offset += d.value;
			return item;
		});
	}
</script>

<p class="text-xl mt-4">
	Die Sektoren mit dem größten Anteil in <span class="font-bold"
		>{region.name} ({region.layer_label})</span
	>
	waren im Jahr {data[0].year}
	{#each data
		.slice()
		.sort((a, b) => b.value - a.value)
		.slice(0, 3) as s, i}
		<span
			class="inline-block px-1 py-0.5 rounded text-white"
			style="background-color: {s.category_color}"
		>
			{s.category_label}
		</span>{i < 2 ? ', ' : '.'}
	{/each}
</p>

<div bind:clientWidth={chartWidth} bind:clientHeight={chartHeight} class="h-24 mt-4">
	<svg width="100%" height="100%">
		{#each stackedData as datapoint}
			<g transform={`translate(${xScale(datapoint.xOffset)}, 0)`}>
				<rect
					width={xScale(datapoint.value)}
					height={chartHeight}
					fill={datapoint.category_color}
				/>
			</g>
		{/each}
	</svg>
</div>

<div class="max-w-2xl text-sm leading-tight mt-4 opacity-80">
	<p>Datenquelle: {data[0].source}</p>
	{#if data[0].source == 'energiemosaik.at'}
		<p>
			Die Emissionsdaten basieren auf dem Energiemosaik Austria, einem modellbasierten Ansatz, der
			den Energieverbrauch und die Treibhausgasemissionen aller Gemeinden Österreichs für das Jahr
			2019 abschätzt. Grundlage sind über 90 raumbezogene Parameter wie Wohnflächen, Beschäftigte
			oder Verkehrsaufkommen, die mit typischen Energiekennwerten und Emissionsfaktoren verrechnet
			wurden. Die Daten dienen der Orientierung in der lokalen Klimaplanung, sind aber mit
			Unsicherheiten verbunden und nicht als gemessene Werte zu verstehen.
		</p>
	{/if}
</div>
