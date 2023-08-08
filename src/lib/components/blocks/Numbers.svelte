<script>
	export let block;
</script>

<section class="my-4 container">
	{#if block.content.heading}
		<h2 class="uppercase font-semibold tracking-wider mb-2">{@html block.content.heading}</h2>
	{/if}

	<div class="max-w-4xl grid gap-4 {block.content.layout == 'two' ? 'grid-cols-2' : ''}">
		{#each block.content.structure as number}
			<div>
				{#if number.heading}
					<h3>{@html number.heading}</h3>
				{/if}

				<div class="text-7xl font-light tabular-nums flex items-end">
					{@html number.value}
					<span class="text-2xl font-normal">{@html number.unit}</span>
				</div>

				{#if number.text}
					<div class="text-lg ">
						{@html number.text}
					</div>
				{/if}

				{#if number.source}
					<div class="text-sm text-gray-600">
						{@html number.source}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
