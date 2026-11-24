<!--
	Segmented control / tab-style switcher — WCAG 2.1 AA compliant
	Uses role="tablist" with arrow-key navigation.

	Item fields: key, label, optional iconComponent / icon (always shown, tinted by color),
	activeIcon (component shown only while the item is selected), disabled.

	Usage:
		<Switch
			views={[{ key: 'chart', label: 'Chart' }, { key: 'map', label: 'Map' }]}
			bind:activeView={view}
			on:itemClick={(e) => handleSwitch(e.detail)}
		/>
-->
<script>
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { themedColorVars } from '$lib/utils/themedColor';

	export let views = [];
	export let activeView;
	export let label = '';
	/** Optional: wire buttons to tabpanels with ids `tabpanel-{panelPrefix}-{key}` */
	export let panelPrefix = '';
	/**
	 * Below `lg`, inactive items with an `iconComponent` show only their icon (label stays for
	 * screen readers and as tooltip); the active item keeps its label next to the icon and
	 * only truncates it when the row would not fit otherwise.
	 */
	export let compact = false;

	const dispatch = createEventDispatcher();

	/** @type {HTMLDivElement | undefined} */
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
				/** @type {HTMLElement | null | undefined} */
				const btn = container?.querySelector(`[data-key="${targetView.key}"]`);
				btn?.focus();
			});
		}
	}

	// Vertical mouse wheel scrolls an overflowing list sideways (desktop without trackpad)
	/** @param {WheelEvent} e */
	function handleWheel(e) {
		if (!container || container.scrollWidth <= container.clientWidth) return;
		if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
		e.preventDefault();
		container.scrollLeft += e.deltaY;
	}

	/** @param {1 | -1} direction */
	function scrollByPage(direction) {
		container?.scrollBy({ left: direction * container.clientWidth * 0.6, behavior: 'smooth' });
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

		// Keep the active item visible when the list scrolls horizontally
		const left = x;
		const right = x + w;
		const { scrollLeft, clientWidth } = container;
		if (left < scrollLeft) {
			container.scrollTo({ left: left - 24, behavior: 'smooth' });
		} else if (right > scrollLeft + clientWidth) {
			container.scrollTo({ left: right - clientWidth + 24, behavior: 'smooth' });
		}

		updateScrollIndicators();
	}

	// Re-measure when the selection or the items change (e.g. another region with more sectors)
	$: activeView, views, updateIndicator();

	onMount(() => {
		updateIndicator();
		updateScrollIndicators();
		// The list changes width when labels show/hide; re-check whether it still overflows
		const observer = new ResizeObserver(() => updateScrollIndicators());
		if (container) observer.observe(container);
		return () => observer.disconnect();
	});
</script>

<svelte:window on:resize={updateIndicator} />

<div class="switch isolate relative inline-flex max-w-full">
	{#if canScrollLeft}
		<button
			type="button"
			tabindex="-1"
			aria-label="Nach links scrollen"
			on:click={() => scrollByPage(-1)}
			class="absolute top-0 bottom-0 left-0 z-20 flex items-center pl-1.5 pr-4 rounded-l-full
				bg-gradient-to-r from-gray-100 from-50% to-transparent dark:from-gray-800
				text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg>
		</button>
	{/if}

	<div
		bind:this={container}
		on:scroll={updateScrollIndicators}
		on:wheel|nonpassive={handleWheel}
		role="tablist"
		aria-label={label || undefined}
		class="relative inline-flex rounded-full overflow-x-auto max-w-full scrollbar-none
			bg-gray-100 dark:bg-gray-800 p-0.5 border border-gray-200 dark:border-gray-700"
	>
		<!-- Sliding indicator -->
		<div
			class="absolute inset-y-0.5 left-0 rounded-full z-0 bg-white dark:bg-gray-900 transition-[transform,width] duration-300 ease-out"
			style={indicatorStyle}
			on:transitionend={updateScrollIndicators}
			aria-hidden="true"
		></div>

		{#each views as view, i (view.key)}
			{@const isActive = view.key === activeView}
			{@const iconOnly = compact && !isActive && !!view.iconComponent}
			{@const truncateLabel = compact && isActive && !!view.iconComponent}
			<button
				data-key={view.key}
				title={iconOnly || truncateLabel ? view.label : undefined}
				id={panelPrefix ? `tab-${panelPrefix}-${view.key}` : undefined}
				aria-controls={panelPrefix ? `tabpanel-${panelPrefix}-${view.key}` : undefined}
				on:click={() => handleClick(view)}
				on:keydown={(e) => handleKeydown(e, i)}
				disabled={view.disabled}
				role="tab"
				aria-selected={isActive}
				tabindex={isActive ? 0 : -1}
				class="relative z-10 flex items-center gap-1 rounded-full {iconOnly
					? 'px-1.5 lg:px-2.5'
					: 'px-2.5'} py-1 text-sm font-medium
					whitespace-nowrap overflow-hidden
					{truncateLabel ? 'min-w-0 shrink lg:shrink-0' : 'flex-shrink-0'}
					transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed
					focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
					{isActive
					? 'text-black dark:text-white'
					: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
			>
				{#if view.activeIcon && isActive}
				<!-- Icon that only marks the selected item (e.g. a map pin on the chosen region);
				     grey icon and semibold label like the pin in RegionDrilldown -->
				<span class="flex items-center text-gray-500 dark:text-gray-400" aria-hidden="true">
					<svelte:component this={view.activeIcon} size={16} />
				</span>
			{/if}
				{#if view.iconComponent}
				<span
					class="flex items-center {view.color
						? 'text-[color:var(--themed-color)] dark:text-[color:var(--themed-color-dark)]'
						: ''}"
					style={themedColorVars(view.color)}
					aria-hidden="true"
				>
					<svelte:component this={view.iconComponent} size={16} />
				</span>
			{:else if view.icon}
				<span
					class="flex items-center {view.color
						? 'text-[color:var(--themed-color)] dark:text-[color:var(--themed-color-dark)]'
						: ''}"
					style={themedColorVars(view.color)}
					aria-hidden="true"
				>
					{@html view.icon}
				</span>
			{/if}
				<span
					class="{iconOnly
						? 'sr-only lg:not-sr-only'
						: truncateLabel
							? 'min-w-0 truncate'
							: ''} {view.activeIcon && isActive ? 'font-semibold' : ''}">{view.label}</span
				>
			</button>
		{/each}
	</div>

	{#if canScrollRight}
		<button
			type="button"
			tabindex="-1"
			aria-label="Nach rechts scrollen"
			on:click={() => scrollByPage(1)}
			class="absolute top-0 bottom-0 right-0 z-20 flex items-center pr-1.5 pl-4 rounded-r-full
				bg-gradient-to-l from-gray-100 from-50% to-transparent dark:from-gray-800
				text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg>
		</button>
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
