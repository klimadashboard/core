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
	class="switch bg-gray-200 dark:bg-gray-900 border-2 border-solid border-current/10 rounded-full p-1 inline-flex overflow-y-hidden no-scrollbar overflow-x-scroll max-w-full"
	class:bg-white={type === 'primary'}
>
	{#each views as view}
		<button
			class="element px-4 py-1 rounded-full transition duration-100 flex items-center {view.key ==
			activeView
				? 'bg-gray-200 dark:bg-gray-700 font-bold'
				: 'bg-white dark:bg-gray-900 '}"
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
