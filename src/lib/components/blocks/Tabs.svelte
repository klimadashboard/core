<script>
	import Blocks from './index.svelte';
	export let block;

	let wrapper;

	$: tabs = block.content.sides;
	$: selectedTab = tabs[0];
</script>

<div class="md:grid md:grid-cols-4 gap-4 container" bind:this={wrapper}>
	{#each tabs as tab}
		<button
			class="mt-4 md:mt-0 w-full md:col-start-1 relative shadow text-left leading-tight tracking-tight p-2 text-lg flex space-x-2 items-center z-20 {tab ==
			selectedTab
				? 'bg-gradient-green md:rounded-l md:rounded-t-none rounded-none rounded-t text-white'
				: 'bg-white  rounded-sm'}"
			on:mousedown={() => (selectedTab = tab)}
			on:focus={() => (selectedTab = tab)}
		>
			{#if tab.icon}
				{@html tab.icon}
			{/if}
			<span>{tab.label}</span>
			{#if tab == selectedTab}
				<div class="text-[#2e9c5c]">
					<div class="hidden md:block arrow-right absolute top-1/2 bottom-0 right-0" />
				</div>
			{/if}
		</button>
		{#if tab == selectedTab && selectedTab.blocks}
			<div class="bg-white md:row-start-1 md:col-start-2 md:col-span-3 md:row-span-6 -m-4 mb-4">
				<Blocks content={JSON.parse(selectedTab.blocks)} />
			</div>
		{/if}
	{/each}
</div>

<!--
<section class="my-4">
{#each tabs as tab}
    <button on:mousedown={() => selectedTab = tab}>{tab.label}</button>
{/each}
{#if selectedTab.blocks}
<Blocks content={JSON.parse(selectedTab.blocks)} />
{/if}
</section>
-->
<style>
	.arrow-right {
		transform: translate(100%, -50%);
		width: 0;
		height: 0;
		border-top: 1.19rem solid transparent;
		border-bottom: 1.19rem solid transparent;
		border-left: 1.19rem solid currentColor;
	}
</style>
