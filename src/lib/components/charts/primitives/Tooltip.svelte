<!-- $lib/components/charts/primitives/Tooltip.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';

	/** Is tooltip visible */
	export let visible: boolean = false;

	/** X position (client/viewport coordinates from e.clientX) */
	export let x: number = 0;

	/** Y position (client/viewport coordinates from e.clientY) */
	export let y: number = 0;

	/** Title */
	export let title: string = '';

	/** Items to display */
	export let items: Array<{ label: string; value: string; color?: string }> = [];

	let tooltipEl: HTMLElement;

	// Svelte action to portal element to document.body
	function portal(node: HTMLElement) {
		if (!browser) return;

		// Move to body to avoid CSS transform/filter issues with position:fixed
		document.body.appendChild(node);

		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}

	// Position calculation
	function getStyle(x: number, y: number, el: HTMLElement | undefined): string {
		if (!browser) return `left: ${x}px; top: ${y}px;`;

		const offset = 12;
		const padding = 8;

		const vw = window.innerWidth;
		const vh = window.innerHeight;

		// Get tooltip dimensions (fallback if not yet measured)
		const tw = el?.offsetWidth || 150;
		const th = el?.offsetHeight || 80;

		let left = x + offset;
		let top = y + offset;

		// Flip horizontally if would overflow right
		if (left + tw + padding > vw) {
			left = x - tw - offset;
		}

		// Flip vertically if would overflow bottom
		if (top + th + padding > vh) {
			top = y - th - offset;
		}

		// Clamp to viewport
		left = Math.max(padding, Math.min(left, vw - tw - padding));
		top = Math.max(padding, Math.min(top, vh - th - padding));

		return `left: ${left}px; top: ${top}px;`;
	}

	$: style = getStyle(x, y, tooltipEl);
</script>

{#if visible && items.length > 0}
	<div
		use:portal
		bind:this={tooltipEl}
		class="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 pointer-events-none whitespace-nowrap"
		{style}
		transition:fade={{ duration: 80 }}
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
