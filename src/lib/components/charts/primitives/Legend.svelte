<!--
	Chart Legend — WCAG 2.1 AA compliant
	Renders a horizontal/wrapping legend for chart series. Supports interactive toggling.

	Usage (static):
		<Legend items={[{ key: 'pv', label: 'Solar', color: '#f59e0b' }]} />

	Usage (interactive, toggles visibility):
		<Legend items={items} bind:hidden={hiddenSeries} interactive />
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let items: Array<{ key: string; label: string; color: string; dashed?: boolean }> = [];
	export let hidden: Set<string> = new Set();
	export let interactive: boolean = false;

	const dispatch = createEventDispatcher();

	function toggle(key: string) {
		if (!interactive) return;
		const next = new Set(hidden);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		hidden = next;
		dispatch('toggle', { key, hidden });
	}

	function handleKeydown(e: KeyboardEvent, key: string) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			toggle(key);
		}
	}
</script>

<div class="flex flex-wrap gap-x-4 gap-y-1" role={interactive ? 'group' : undefined} aria-label={interactive ? 'Toggle chart series' : undefined}>
	{#each items as item (item.key)}
		{@const isHidden = hidden.has(item.key)}
		<div
			class="inline-flex items-center gap-1.5 text-sm
				{interactive ? 'cursor-pointer select-none' : ''}
				{isHidden ? 'opacity-40' : ''}"
			role={interactive ? 'checkbox' : undefined}
			aria-checked={interactive ? !isHidden : undefined}
			aria-label={interactive ? item.label : undefined}
			tabindex={interactive ? 0 : undefined}
			on:click={() => toggle(item.key)}
			on:keydown={(e) => handleKeydown(e, item.key)}
		>
			{#if item.dashed}
				<svg width="16" height="3" aria-hidden="true">
					<line x1="0" y1="1.5" x2="16" y2="1.5" stroke={item.color} stroke-width="2" stroke-dasharray="4 2" />
				</svg>
			{:else}
				<span
					class="w-3 h-3 rounded-sm flex-shrink-0"
					style="background-color: {item.color};"
					aria-hidden="true"
				></span>
			{/if}
			<span class="text-gray-700 dark:text-gray-300">{item.label}</span>
		</div>
	{/each}
</div>
