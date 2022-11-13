<script>
    import { page } from "$app/stores";

    export let block;
</script>

{#each block.content.image as image}
<div class="my-4 px-4 text-lg {block.content.fullwidth == "true" ? "w-full" : "max-w-2xl mx-auto"}" id="{block.id}">
    <img src="https://klimadashboard.org/klimadashboard-at{$page.url.pathname}/{image}" alt="{block.content.alt}">
</div>
{/each}