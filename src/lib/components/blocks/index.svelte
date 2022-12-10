<script>
    import Heading from "./Heading.svelte";
    import Text from "./Text.svelte";
    import Markdown from "./Markdown.svelte";
    import Chart from "./Chart.svelte";
    import Toggle from "./Toggle.svelte";
    import Tabs from "./Tabs.svelte";
    import Navigation from "./Navigation.svelte";
    import Image from "./Image.svelte";

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
    }, {
        "type": "tabs",
        component: Tabs
    }, {
        "type": "toggle",
        component: Toggle
    }, {
        "type": "navigation",
        component: Navigation
    }, {
        "type": "image",
        component: Image
    }];
</script>

<div>
    {#each content.filter(d => !d.isHidden) as block}
        <svelte:component this={blocks.find(d => d.type == block.type).component} {block} />
    {/each}
</div>