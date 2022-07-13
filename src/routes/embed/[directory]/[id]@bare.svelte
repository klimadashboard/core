<script>
    import { page } from '$app/stores';
    import Chart from "$lib/components/charts/index.svelte";
</script>

{#if $page.params.id}
<Chart id={$page.params.directory + '/' + $page.params.id} />
{/if}