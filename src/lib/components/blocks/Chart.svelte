<script>
    import Chart from "$lib/components/charts/index.svelte";

    export let block;
    $: hideWrapper = block.content.hidewrapper == "true";
</script>

<div class="my-4 {hideWrapper ? "" : "container"}">
    {#each block.content.chart as chart}
    <Chart id={chart} {hideWrapper} />
    {/each}
</div>  