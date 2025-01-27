<script>
    import { line } from "d3-shape";
    import { scaleLinear, scaleTime } from 'd3-scale';
    import { min, max } from 'd3-array';

    export let data;
    export let layer;
    export let chartWidth;
    export let chartHeight;
    export let options;

    $: xScale = scaleLinear()
		.domain([min(data, (d) => d.x), max(data, (d) => d.x)])
		.range([0, chartWidth - options.margin.left - options.margin.right]);

    $: relevantData = data.map(d => {
        return {
        x: d.x,
        y: d.layers.find(d => d.label == layer.name).y
        }
    });

    $: console.log(relevantData);

	$: yScale = scaleLinear()
		.domain([min(relevantData, (d) => d.y), max(relevantData, (d) => d.y)])
		.range([chartHeight, 0]);

    $: generateLine = line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y));
</script>

<g>
	<path d={generateLine(relevantData)} class="stroke-black stroke-2 fill-none" />
</g>
