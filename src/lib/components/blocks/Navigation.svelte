<script>
    export let block;
    console.log(block);
</script>

<div class="container grid md:grid-cols-3 gap-4">
    {#each block.content.navigation as item}
    <a href="{item.link}" class="border-2 p-4 text-2xl hover:bg-gray-200 transition">
        {item.label} &rarr;
    </a>
    {/each}
</div>