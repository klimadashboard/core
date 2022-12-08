<script>
    import "../app.css";
    import { glossaryItem } from "$lib/stores/glossary";
    import Glossary from "$lib/components/Glossary.svelte";
</script>

{#if $glossaryItem}
<Glossary />
{/if}

<slot />