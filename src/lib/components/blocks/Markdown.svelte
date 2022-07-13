<script>
    export let block;
    console.log(block);
</script>

<div class="my-4 text-lg {block.content.fullwidth == "true" ? "w-full" : "max-w-2xl mx-auto"}" id="{block.id}">
{@html block.content.text}
</div>