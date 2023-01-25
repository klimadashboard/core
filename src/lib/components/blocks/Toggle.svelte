<script>
	import Blocks from './index.svelte';
	export let block;
</script>

<details class="max-w-2xl mx-auto my-4 px-4 md:px-0">
	<summary class="text-xl border-b">{block.content.label}</summary>
	{#if block.content.blocks}
		<Blocks content={JSON.parse(block.content.blocks)} />
	{/if}
</details>

<style>
	:global(details[open] summary ~ *) {
		animation: sweep 0.5s ease-in-out;
	}

	@keyframes sweep {
		0% {
			opacity: 0;
			margin-left: -10px;
		}
		100% {
			opacity: 1;
			margin-left: 0px;
		}
	}
</style>
