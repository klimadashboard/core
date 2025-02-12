<script>
	import formatNumber from '$lib/stores/formatNumber';
	import Chart from '$lib/components/charts/builder/index.svelte';
	import GasUsage from '$lib/components/charts/small/gasUsage.svelte';
	export let block;

	let customCharts = [
		{
			key: 'gasUsage',
			component: GasUsage
		}
	];
</script>

<a
	class="p-3 h-full group hover:opacity-90 relative leading-tight flex flex-col break-words hyphens-auto group transition"
	style="background: {block.colorBackground}; color: {block.colorText}"
	href={block.link}
>
	<div class="flex justify-between font-bold border-b border-current pb-1">
		<h3 class="">
			{block.title} <span class="opacity-0 group-hover:opacity-100 transition">&rarr;</span>
		</h3>
		{#if block.icon}
			{@html block.icon}
		{/if}
	</div>
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
		{#if block.chart_custom}
			<svelte:component this={customCharts.find((d) => d.key == block.chart_custom).component} />
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
		<div class="text-xs leading-none mt-auto pt-2">{block.source}</div>
	{/if}
</a>
