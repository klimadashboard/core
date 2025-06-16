<script>
	import { createEventDispatcher, onMount, tick } from 'svelte';

	export let views = [];
	export let activeView;
	export let type; // undefined | "small" | "primary"

	const dispatch = createEventDispatcher();

	let container;
	let indicatorStyle = '';

	function handleClick(view) {
		dispatch('itemClick', view.key ?? view);
	}

	async function updateIndicator() {
		await tick();
		if (!container || type === 'small') return; // Skip indicator for small type

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
	       {type === 'small' ? 'bg-transparent gap-2' : 'bg-gray-100 dark:bg-gray-900 py-1 border-2 border-current/10'}
	       {type === 'primary' ? 'bg-white' : ''}"
>
	<!-- overlay the indicator behind buttons for non-small types -->
	{#if type !== 'small'}
		<div class="switch-indicator inset-y-0.5 absolute" style={indicatorStyle}></div>
	{/if}

	{#each views as view (view.key)}
		<button
			data-key={view.key}
			on:click={() => handleClick(view)}
			disabled={view.disabled}
			class="relative z-10 flex items-center rounded-full transition duration-200
			       {type === 'small' 
					? (view.key === activeView 
						? 'bg-gray-800 text-white px-4 py-2 font-semibold text-sm' 
						: 'bg-gray-200 text-gray-700 px-4 py-2 text-sm hover:bg-gray-300')
					: 'px-4 ' + (view.key === activeView ? 'font-bold' : '')}
			       disabled:opacity-40 disabled:line-through"
		>
			{#if view.icon}
				<span class="mr-2" style="color: {view.color}">{@html view.icon}</span>
			{/if}
			<span>{view.label}</span>
		</button>
	{/each}
</div>

<style>
	.switch-indicator {
		left: 0;
		border-radius: 9999px;
		background-color: white;
		transition: all 300ms ease;
		z-index: 0;
	}

	:global(.dark) .switch-indicator {
		background-color: #374151;
	}
</style>
