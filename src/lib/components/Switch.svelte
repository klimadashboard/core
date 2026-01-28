<script>
	import { createEventDispatcher, onMount, tick } from 'svelte';

	export let views = [];
	export let activeView;

	const dispatch = createEventDispatcher();

	let container;
	let indicatorStyle = '';
	let canScrollLeft = false;
	let canScrollRight = false;

	function handleClick(view) {
		dispatch('itemClick', view.key ?? view);
	}

	function updateScrollIndicators() {
		if (!container) return;
		canScrollLeft = container.scrollLeft > 0;
		canScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth - 1;
	}

	async function updateIndicator() {
		await tick();
		if (!container) return;

		const btn = container.querySelector(`[data-key="${activeView}"]`);
		if (!btn) return;

		const btnRect = btn.getBoundingClientRect();
		const parentRect = container.getBoundingClientRect();
		const x = btnRect.left - parentRect.left + container.scrollLeft;
		const w = btnRect.width;

		indicatorStyle = `
			transform: translateX(${x}px);
			width: ${w}px;
		`;

		updateScrollIndicators();
	}

	$: activeView, updateIndicator();

	onMount(() => {
		updateIndicator();
		updateScrollIndicators();
	});
</script>

<div class="isolate relative inline-flex max-w-full">
	<!-- Left overflow gradient -->
	{#if canScrollLeft}
		<div
			class="absolute top-0 bottom-0 left-0 w-6 pointer-events-none z-20 rounded-l-full
				bg-gradient-to-r from-gray-100 to-transparent dark:from-gray-800"
		></div>
	{/if}

	<div
		bind:this={container}
		on:scroll={updateScrollIndicators}
		class="relative inline-flex rounded-full overflow-x-auto max-w-full scrollbar-none
			bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700"
	>
		<!-- Sliding indicator -->
		<div
			class="absolute inset-y-1 left-0 rounded-full z-0 bg-white dark:bg-gray-900 transition-[transform,width] duration-300 ease-out"
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

	<!-- Right overflow gradient -->
	{#if canScrollRight}
		<div
			class="absolute top-0 bottom-0 right-0 w-6 pointer-events-none z-20 rounded-r-full
				bg-gradient-to-l from-gray-100 to-transparent dark:from-gray-800"
		></div>
	{/if}
</div>

<style>
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
</style>
