<script>
    import { page } from '$app/stores';
    import Chart from "$lib/components/charts/index.svelte";

    $: id = $page.params.slug.replace('charts/','');
</script>

{#if $page.params.slug}
<Chart id={id} />
{/if}