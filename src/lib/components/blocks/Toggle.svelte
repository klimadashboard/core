<script>
	import Blocks from './index.svelte';
	export let block;
</script>

<section class="container my-4">
	<details class="max-w-4xl" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
		<summary class="text-xl border-b" itemprop="name">{block.content.label}</summary>
		<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
			{#if block.content.blocks}
				<div itemprop="text">
					<Blocks content={JSON.parse(block.content.blocks)} />
				</div>
			{/if}
		</div>
	</details>
</section>

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
