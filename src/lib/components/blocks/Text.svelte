<script>
    export let block;
</script>

<div class="my-4 text-lg max-w-2xl mx-auto px-4 text" id="{block.id}">
{@html block.content.text}
</div>

<style>
    :global(.text a) {
        @apply border-b border-b-gray-300;
    }

    :global(.text p) {
        @apply my-2;
    }
</style>