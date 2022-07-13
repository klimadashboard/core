<script>
    import Blocks from "./index.svelte";
    export let block;

    $: selectedTab = block.content.sides[0];
</script>

<section class="my-4">
{#each block.content.sides as tab}
    <button on:mousedown={() => selectedTab = tab}>{tab.label}</button>
{/each}
<Blocks content={JSON.parse(selectedTab.blocks)} />
</section>
