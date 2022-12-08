<script>
    import { page } from '$app/stores';
    import Chart from "$lib/components/charts/index.svelte";
</script>

{#if $page.params.slug}
<Chart id={$page.params.slug} />
{/if}