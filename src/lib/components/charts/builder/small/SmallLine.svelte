<script>
    import { line, area } from 'd3-shape';
    import { scaleLinear } from 'd3-scale';
    import { min, max } from 'd3-array';

    export let data = []; // Ensure data is an array of objects with x and y properties
    export let innerChartWidth; // Default values
    export let innerChartHeight;

    // Corrected usage of min and max
    $: xScale = scaleLinear()
        .domain([min(data, d => d.x), max(data, d => d.x)])
        .range([0, innerChartWidth]);

    $: yScale = scaleLinear()
        .domain([min(data, d => d.y), max(data, d => d.y)])
        .range([innerChartHeight, 0]);

    $: generateLine = line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    $: generateArea = area()
        .x(d => xScale(d.x))
        .y0(innerChartHeight)
        .y1(d => yScale(d.y));
</script>

<g>
    <path d={generateLine(data)} class="fill-none stroke-current stroke-2" />
    <path d={generateArea(data)} class="fill-current opacity-20" />
</g>
