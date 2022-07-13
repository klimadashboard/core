<script>
    import Chart from "$lib/components/charts/index.svelte";

    export let block;
</script>

<div>
    <Chart id={block.content.chart[0]} />
</div>  