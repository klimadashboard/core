<script>
    import { page } from '$app/stores';
    import Chart from "$lib/components/charts/index.svelte";
</script>

<div class="container my-24">
{#if $page.params.id}
<Chart id={'charts/' + $page.params.id} />
{/if}
</div>