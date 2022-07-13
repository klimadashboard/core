<script>
    import Blocks from "./index.svelte";
    export let block;
</script>

<details>
    <summary class="text-xl max-w-2xl mx-auto">{block.content.label}</summary>
    <Blocks content={JSON.parse(block.content.blocks)} />
</details>