<script>
    export let block;
</script>

{#if block.content.level == "h1"}
<h1 id="{block.id}" class="mt-20 text-4xl max-w-2xl tracking-tight mx-auto">{block.content.text}</h1>
{:else if block.content.level == "h2"}
<h2 id="{block.id}" class="mt-16 text-3xl max-w-2xl mx-auto">{block.content.text}</h2>
{:else if block.content.level == "h3"}
<h3 id="{block.id}" class="mt-8 text-xl max-w-2xl mx-auto">{block.content.text}</h3>
{:else if block.content.level == "h4"}
<h4 id="{block.id}" class="mt-8 font-bold max-w-2xl mx-auto">{block.content.text}</h4>
{/if}


