<script>
	export let block;
</script>

<div class="my-8 text-lg container text">
	<div class="max-w-2xl mx-auto px-4">
		<details itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
			<summary class="text-xl border-b" itemprop="name">{block.question}</summary>
			<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
				{@html block.answer}
			</div>
		</details>
	</div>
</div>

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
