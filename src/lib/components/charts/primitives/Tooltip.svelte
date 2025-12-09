<!-- $lib/components/charts/primitives/Tooltip.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';

	/** Is tooltip visible */
	export let visible: boolean = false;

	/** X position (client/viewport coordinates) */
	export let x: number = 0;

	/** Y position (client/viewport coordinates) */
	export let y: number = 0;

	/** Title */
	export let title: string = '';

	/** Items to display */
	export let items: Array<{ label: string; value: string; color?: string }> = [];

	/** Container element (optional - used for reference but tooltip uses viewport bounds) */
	export let container: HTMLElement | null = null;

	let tooltipEl: HTMLElement;
	let tooltipWidth = 0;
	let tooltipHeight = 0;

	// Measure tooltip size
	$: if (tooltipEl) {
		const rect = tooltipEl.getBoundingClientRect();
		tooltipWidth = rect.width;
		tooltipHeight = rect.height;
	}

	// Position with viewport bounds checking
	$: style = (() => {
		const offset = 12;
		const padding = 8;

		const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
		const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

		let left = x + offset;
		let top = y + offset;

		// Flip left if overflowing right edge of viewport
		if (left + tooltipWidth + padding > viewportWidth) {
			left = x - tooltipWidth - offset;
		}

		// Flip up if overflowing bottom edge of viewport
		if (top + tooltipHeight + padding > viewportHeight) {
			top = y - tooltipHeight - offset;
		}

		// Keep within viewport bounds
		left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
		top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

		return `left: ${left}px; top: ${top}px;`;
	})();
</script>

{#if visible && items.length > 0}
	<div
		bind:this={tooltipEl}
		class="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 pointer-events-none"
		{style}
		transition:fade={{ duration: 100 }}
	>
		{#if title}
			<div
				class="font-semibold text-sm text-gray-900 dark:text-white mb-1 pb-1 border-b border-gray-100 dark:border-gray-700"
			>
				{title}
			</div>
		{/if}

		<div class="space-y-0.5">
			{#each items as item}
				<div class="flex items-center gap-2 text-sm">
					{#if item.color}
						<span
							class="w-2.5 h-2.5 rounded-sm flex-shrink-0"
							style="background-color: {item.color};"
						></span>
					{/if}
					<span class="text-gray-500 dark:text-gray-400">{item.label}:</span>
					<span class="font-medium text-gray-900 dark:text-white ml-auto">{item.value}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
