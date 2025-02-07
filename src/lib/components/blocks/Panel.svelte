<script>
	import formatNumber from '$lib/stores/formatNumber';
	import Chart from '$lib/components/charts/builder/index.svelte';
	export let block;
</script>

<div
	class="p-3 h-full group relative leading-tight flex flex-col break-words hyphens-auto"
	style="background: {block.colorBackground}; color: {block.colorText}"
>
	<a class="flex justify-between font-bold border-b border-current pb-1" href={block.link}>
		<h3>{block.title}</h3>
		{#if block.icon}
			{@html block.icon}
		{/if}
	</a>
	<div>
		<div class="flex items-end gap-2 mt-1">
			<p class="text-5xl font-light font-condensed">
				{formatNumber(block.number)}<span class="text-2xl font-normal">{block.unit}</span>
			</p>
		</div>
		<div class="text-balance">{@html block.subtitle}</div>
		{#if block.chart}
			<div class="h-20">
				<Chart chart={block.chart} type="small" />
			</div>
		{/if}
	</div>
	{#if block.list}
		<ul class="card-list">
			{#each block.list as item}
				<li>{@html item.text}</li>
			{/each}
		</ul>
	{/if}
	{#if block.source}
		<div class="text-xs leading-none mt-auto">{block.source}</div>
	{/if}
</div>
