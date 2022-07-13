<script>
    import Heading from "./Heading.svelte";
    import Text from "./Text.svelte";
    import Markdown from "./Markdown.svelte";
    import Chart from "./Chart.svelte";
    export let content;

    const blocks = [{
        "type": "text",
        component: Text
    }, {
        "type": "heading",
        component: Heading
    }, {
        "type": "markdown",
        component: Markdown
    }, {
        "type": "chart",
        component: Chart
    }];

    console.log(content);
</script>

<div>
    {#each content as block}
        <svelte:component this={blocks.find(d => d.type == block.type).component} {block} />
    {/each}
</div>