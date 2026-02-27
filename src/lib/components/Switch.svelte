<!--
	Segmented control / tab-style switcher — WCAG 2.1 AA compliant
	Uses role="tablist" with arrow-key navigation.

	Usage:
		<Switch
			views={[{ key: 'chart', label: 'Chart' }, { key: 'map', label: 'Map' }]}
			bind:activeView={view}
			on:itemClick={(e) => handleSwitch(e.detail)}
		/>
-->
<script>
	import { createEventDispatcher, onMount, tick } from 'svelte';

	export let views = [];
	export let activeView;
	export let label = '';

	const dispatch = createEventDispatcher();

	let container;
	let indicatorStyle = '';
	let canScrollLeft = false;
	let canScrollRight = false;

	function handleClick(view) {
		dispatch('itemClick', view.key ?? view);
	}

	function handleKeydown(e, index) {
		let next = -1;
		const enabledViews = views.filter((v) => !v.disabled);
		const enabledIndex = enabledViews.findIndex((v) => v.key === views[index].key);

		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			next = (enabledIndex + 1) % enabledViews.length;
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			next = (enabledIndex - 1 + enabledViews.length) % enabledViews.length;
		} else if (e.key === 'Home') {
			e.preventDefault();
			next = 0;
		} else if (e.key === 'End') {
			e.preventDefault();
			next = enabledViews.length - 1;
		}

		if (next >= 0) {
			const targetView = enabledViews[next];
			handleClick(targetView);
			// Focus the button after DOM update
			tick().then(() => {
				const btn = container?.querySelector(`[data-key="${targetView.key}"]`);
				btn?.focus();
			});
		}
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

<div class="switch isolate relative inline-flex max-w-full">
	{#if canScrollLeft}
		<div
			class="absolute top-0 bottom-0 left-0 w-6 pointer-events-none z-20 rounded-l-full
				bg-gradient-to-r from-gray-100 to-transparent dark:from-gray-800"
		></div>
	{/if}

	<div
		bind:this={container}
		on:scroll={updateScrollIndicators}
		role="tablist"
		aria-label={label || undefined}
		class="relative inline-flex rounded-full overflow-x-auto max-w-full scrollbar-none
			bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700"
	>
		<!-- Sliding indicator -->
		<div
			class="absolute inset-y-1 left-0 rounded-full z-0 bg-white dark:bg-gray-900 transition-[transform,width] duration-300 ease-out"
			style={indicatorStyle}
			aria-hidden="true"
		></div>

		{#each views as view, i (view.key)}
			{@const isActive = view.key === activeView}
			<button
				data-key={view.key}
				on:click={() => handleClick(view)}
				on:keydown={(e) => handleKeydown(e, i)}
				disabled={view.disabled}
				role="tab"
				aria-selected={isActive}
				tabindex={isActive ? 0 : -1}
				class="relative z-10 flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium
					transition-colors duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed
					focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
					{isActive
					? 'text-black dark:text-white'
					: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
			>
				{#if view.icon}
					<span class="flex items-center" style={view.color ? `color: ${view.color}` : ''} aria-hidden="true">
						{@html view.icon}
					</span>
				{/if}
				<span>{view.label}</span>
			</button>
		{/each}
	</div>

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
