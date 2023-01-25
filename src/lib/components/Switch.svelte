<script>
	import { createEventDispatcher } from 'svelte';

	export let views;
	export let activeView;
	export let type = undefined; // use type="primary" for yellow switch

	const dispatch = createEventDispatcher();

	function handleClick(view) {
		dispatch('itemClick', view?.key || view, view);
	}
</script>

<!-- switch between views -->
<div
	class="switch bg-gray-200  border-2 border-solid border-gray-100  rounded-full p-1 inline-flex overflow-y-hidden text-gray-600  no-scrollbar overflow-x-scroll max-w-full"
	class:bg-white={type === 'primary'}
>
	{#each views as view}
		<button
			class="element px-4 py-1 rounded-full transition duration-100 flex items-center {view.key ==
			activeView
				? 'bg-white  font-bold'
				: 'bg-gray-200 '}"
			on:click={() => handleClick(view)}
		>
			{#if view.icon}
				<div class="mr-2" style="color: {view.color}">
					{@html view.icon}
				</div>
			{/if}
			<span>{view.label}</span>
		</button>
	{/each}
</div>
