<script>
    import { line, area } from 'd3-shape';
    import { scaleLinear, scaleTime } from 'd3-scale';
    import { min, max } from 'd3-array';

    export let data = []; // Ensure data is an array of objects with x and y properties
    export let innerChartWidth; // Default values
    export let innerChartHeight;

    // Helper function to check if a value is a valid date
    const isValidDate = (dateString) => {
        return !isNaN(Date.parse(dateString));
    };

    // Determine the scale type based on whether x is a date
    $: xScale = (() => {
        const sampleX = data[0]?.x;
        if (isValidDate(sampleX)) {
            return scaleTime()
                .domain([new Date(min(data, (d) => new Date(d.x))), new Date(max(data, (d) => new Date(d.x)))])
                .range([0, innerChartWidth]);
        } else {
            return scaleLinear()
                .domain([min(data, (d) => d.x), max(data, (d) => d.x)])
                .range([0, innerChartWidth]);
        }
    })();

    $: yScale = scaleLinear()
        .domain([min(data, d => d.y), max(data, d => d.y)])
        .range([innerChartHeight, 0]);

    $: generateLine = line()
        .x(d => xScale(isValidDate(d.x) ? new Date(d.x) : d.x))
        .y(d => yScale(d.y));

    $: generateArea = area()
        .x(d => xScale(isValidDate(d.x) ? new Date(d.x) : d.x))
        .y0(innerChartHeight)
        .y1(d => yScale(d.y));
</script>

<g>
    <path d={generateLine(data)} class="fill-none stroke-current stroke-2" />
    <path d={generateArea(data)} class="fill-current opacity-20" />
</g>
