<script>
    import { page } from "$app/stores";

    export let block;
    console.log(block)
</script>

{#if block.content.link}
{#each block.content.image as image}
<a class="my-4 px-4 text-lg {block.content.fullwidth == "true" ? "w-full" : "max-w-2xl mx-auto"}" id="{block.id}" href="{block.content.link}" target="_blank">
    <img src="https://klimadashboard.org/klimadashboard-at{$page.url.pathname}/{image}" alt="{block.content.alt}">
</a>
{/each}
{:else}
{#each block.content.image as image}
<div class="my-4 px-4 text-lg {block.content.fullwidth == "true" ? "w-full" : "max-w-2xl mx-auto"}" id="{block.id}">
    <img src="https://klimadashboard.org/klimadashboard-at{$page.url.pathname}/{image}" alt="{block.content.alt}">
</div>
{/each}
{/if}
