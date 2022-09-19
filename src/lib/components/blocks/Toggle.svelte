<script>
    import Blocks from "./index.svelte";
    import { fade } from "svelte/transition";
    export let block;
</script>

<details class="max-w-2xl mx-auto my-4 px-4">
    <summary class="text-xl border-b">{block.content.label}</summary>
    <Blocks content={JSON.parse(block.content.blocks)} />
</details>

<style>
:global(details[open] summary ~ *) {
  animation: sweep .5s ease-in-out;
}

@keyframes sweep {
  0%    {opacity: 0; margin-left: -10px}
  100%  {opacity: 1; margin-left: 0px}
}
</style>