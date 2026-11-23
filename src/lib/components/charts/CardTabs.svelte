<!--
	Underlined tab bar for the chart Card (Diagramm / Karte / Tabelle / Info).
	WCAG 2.1 AA: role="tablist", roving tabindex, arrow/Home/End navigation,
	buttons wired to tabpanels with ids `tabpanel-{panelPrefix}-{id}`.

	On narrow screens inactive tabs collapse to their icon (label stays for screen readers).
-->
<script lang="ts">
	import { tick } from 'svelte';

	type Tab = { id: string; label: string; icon?: string };

	let {
		tabs,
		active,
		label = '',
		panelPrefix,
		onSelect
	}: {
		tabs: Tab[];
		active: string;
		label?: string;
		panelPrefix: string | number;
		onSelect: (id: string) => void;
	} = $props();

	let listEl: HTMLElement | undefined = $state();
	let indicator = $state({ x: 0, w: 0, ready: false });

	function measure() {
		const btn = listEl?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
		if (!btn) return;
		indicator = { x: btn.offsetLeft, w: btn.offsetWidth, ready: true };
		// Keep the active tab visible when the bar scrolls horizontally
		// (manual scrollLeft, so the page itself never jumps)
		if (!listEl) return;
		const left = btn.offsetLeft;
		const right = left + btn.offsetWidth;
		if (left < listEl.scrollLeft) listEl.scrollLeft = left;
		else if (right > listEl.scrollLeft + listEl.clientWidth)
			listEl.scrollLeft = right - listEl.clientWidth;
	}

	$effect(() => {
		active;
		tabs.length;
		tick().then(measure);
	});

	$effect(() => {
		if (!listEl) return;
		const ro = new ResizeObserver(() => measure());
		ro.observe(listEl);
		return () => ro.disconnect();
	});

	function handleKeydown(e: KeyboardEvent, index: number) {
		let next = -1;
		if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
		else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = tabs.length - 1;
		if (next < 0) return;
		e.preventDefault();
		const target = tabs[next];
		onSelect(target.id);
		tick().then(() => listEl?.querySelector<HTMLElement>(`[data-tab="${target.id}"]`)?.focus());
	}
</script>

<div
	bind:this={listEl}
	role="tablist"
	aria-label={label || undefined}
	class="relative -mb-px flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
>
	{#each tabs as tab, i (tab.id)}
		{@const isActive = tab.id === active}
		<button
			type="button"
			role="tab"
			data-tab={tab.id}
			id="tab-{panelPrefix}-{tab.id}"
			aria-controls="tabpanel-{panelPrefix}-{tab.id}"
			aria-selected={isActive}
			tabindex={isActive ? 0 : -1}
			onclick={() => onSelect(tab.id)}
			onkeydown={(e) => handleKeydown(e, i)}
			class="group/tab relative flex shrink-0 items-center gap-1.5 rounded-t-md px-3 pt-2.5 pb-3 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 motion-reduce:transition-none
				{isActive
				? 'cursor-default text-gray-900 dark:text-white'
				: 'cursor-pointer text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-100'}"
		>
			{#if tab.icon}
				<span
					class="flex items-center transition-colors {isActive
						? 'text-[#1F8A70] dark:text-[#5CC9A7]'
						: ''}"
					aria-hidden="true"
				>
					{@html tab.icon}
				</span>
			{/if}
			<span class={isActive ? '' : 'sr-only sm:not-sr-only'}>{tab.label}</span>
			{#if !isActive}
				<!-- Hover hint: a faint underline where the active indicator would land -->
				<span
					aria-hidden="true"
					class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gray-300 opacity-0 transition-opacity group-hover/tab:opacity-100 dark:bg-gray-600"
				></span>
			{/if}
		</button>
	{/each}

	<!-- Sliding active indicator -->
	<span
		aria-hidden="true"
		class="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-gray-900 dark:bg-white forced-colors:bg-[Highlight]
			{indicator.ready
			? 'transition-[transform,width] duration-300 ease-out motion-reduce:transition-none'
			: 'opacity-0'}"
		style="transform: translateX({indicator.x + 8}px); width: {Math.max(0, indicator.w - 16)}px;"
	></span>
</div>
