<script>
	import { createEventDispatcher, onMount, tick } from 'svelte';

	export let views = [];
	export let activeView;

	const dispatch = createEventDispatcher();

	let container;
	let indicatorStyle = '';

	function handleClick(view) {
		dispatch('itemClick', view.key ?? view);
	}

	async function updateIndicator() {
		await tick();
		if (!container) return;

		const btn = container.querySelector(`[data-key="${activeView}"]`);
		if (!btn) return;

		const btnRect = btn.getBoundingClientRect();
		const parentRect = container.getBoundingClientRect();
		const x = btnRect.left - parentRect.left;
		const w = btnRect.width;

		indicatorStyle = `
			transform: translateX(${x}px);
			width: ${w}px;
		`;
	}

	$: activeView, updateIndicator();

	onMount(updateIndicator);
</script>

<div
	bind:this={container}
	class="switch relative inline-flex rounded-full overflow-x-auto max-w-full no-scrollbar
		bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700"
>
	<!-- Sliding indicator -->
	<div
		class="switch-indicator bg-white dark:bg-gray-900 absolute inset-y-1"
		style={indicatorStyle}
	></div>

	{#each views as view (view.key)}
		<button
			data-key={view.key}
			on:click={() => handleClick(view)}
			disabled={view.disabled}
			class="relative z-10 flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium
				transition-colors duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed
				{view.key === activeView
				? 'text-black dark:text-white'
				: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
		>
			{#if view.icon}
				<span class="flex items-center" style={view.color ? `color: ${view.color}` : ''}>
					{@html view.icon}
				</span>
			{/if}
			<span>{view.label}</span>
		</button>
	{/each}
</div>

<style>
	.switch-indicator {
		left: 0;
		border-radius: 9999px;
		transition:
			transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
			width 300ms cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 0;
	}

	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
