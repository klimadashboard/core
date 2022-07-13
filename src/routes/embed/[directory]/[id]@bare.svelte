<script>
    import { page } from '$app/stores';
    import Chart from "$lib/components/charts/index.svelte";

    console.log($page.params);
</script>

{#if $page.params.id}
<Chart id={$page.params.directory + '/' + $page.params.id} />
{/if}