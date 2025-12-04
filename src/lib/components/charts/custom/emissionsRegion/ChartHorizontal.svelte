<script lang="ts">
	import { scaleLinear } from 'd3-scale';

	export let data: any[];
	export let region: any;
	export let showPerCapita = false;
	export let populationByYear: { [year: number]: number } = {};

	let chartWidth: number;
	let chartHeight: number;

	// Transform data based on showPerCapita flag and year-specific population
	$: transformedData =
		showPerCapita && Object.keys(populationByYear).length > 0
			? data.map((d: any) => {
					const yearPopulation = populationByYear[d.year];
					if (yearPopulation) {
						return {
							...d,
							value: (d.value / yearPopulation) * 1000000 // Convert to tons per million people for better readability
						};
					} else {
						// Fallback to region.population if year-specific data not available
						return region.population
							? {
									...d,
									value: (d.value / region.population) * 1000000
								}
							: d;
					}
				})
			: data;

	// Compute total and scale using transformed data
	$: total = transformedData.reduce((sum: number, d: any) => sum + d.value, 0);
	$: xScale = scaleLinear()
		.domain([0, total])
		.range([0, chartWidth || 0]);

	// Compute xOffsets for horizontal stacking using transformed data
	let stackedData: any[] = [];
	$: {
		let offset = 0;
		stackedData = transformedData.map((d: any) => {
			const item = { ...d, xOffset: offset };
			offset += d.value;
			return item;
		});
	}

	// Update unit label
	$: unit = showPerCapita ? 't CO2eq/Mio. Einwohner' : 't CO2eq';
</script>

<p class="text-xl mt-4">
	Die Sektoren mit dem größten Anteil in <span class="font-bold"
		>{region.name} ({region.layer_label})</span
	>
	waren im Jahr {data[0].year}
	{#each transformedData
		.slice()
		.sort((a: any, b: any) => b.value - a.value)
		.slice(0, 3) as s, i}
		<span
			class="inline-block px-1 py-0.5 rounded text-white"
			style="background-color: {s.category_color}"
		>
			{s.category_label}
		</span>{i < 2 ? ', ' : '.'}
	{/each}
	{#if showPerCapita && Object.keys(populationByYear).length > 0}
		pro Million Einwohner
	{:else if showPerCapita && region.population}
		pro Million Einwohner
	{/if}
</p>

<div bind:clientWidth={chartWidth} bind:clientHeight={chartHeight} class="h-24 mt-4">
	<svg width="100%" height="100%">
		{#each stackedData as datapoint}
			<g transform={`translate(${xScale(datapoint.xOffset)}, 0)`}>
				<rect width={xScale(datapoint.value)} height={chartHeight} fill={datapoint.category_color}>
					<title>{datapoint.category_label}: {datapoint.value.toFixed(2)} {unit}</title>
				</rect>
			</g>
		{/each}
	</svg>
</div>

<div class="max-w-2xl text-sm leading-tight mt-4 opacity-80">
	<p>Datenquelle: {data[0].source}</p>
	{#if showPerCapita && Object.keys(populationByYear).length > 0}
		<p>Pro-Kopf-Werte basieren auf jahresspezifischen Bevölkerungsdaten für {region.name}.</p>
	{:else if showPerCapita && region.population}
		<p>
			Pro-Kopf-Werte basieren auf einer Bevölkerung von {region.population.toLocaleString()} Einwohnern
			(einheitlich für alle Jahre).
		</p>
	{/if}
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
