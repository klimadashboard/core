<script>
    import Chart from "$lib/components/charts/index.svelte";

    export let block;
</script>

<div class="my-4">
    {#each block.content.chart as chart}
    <Chart id={chart} />
    {/each}
</div>  