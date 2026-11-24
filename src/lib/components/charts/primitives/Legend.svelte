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
	import { themedColorVars } from '$lib/utils/themedColor';

	/** `iconComponent` (e.g. a Tabler icon) replaces the colour square, tinted with `color` */
	export let items: Array<{
		key: string;
		label: string;
		color: string;
		dashed?: boolean;
		iconComponent?: any;
	}> = [];
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

{#snippet marker(item: (typeof items)[number])}
	{#if item.dashed}
		<svg width="16" height="3" aria-hidden="true">
			<line x1="0" y1="1.5" x2="16" y2="1.5" stroke={item.color} stroke-width="2" stroke-dasharray="4 2" />
		</svg>
	{:else if item.iconComponent}
		<span
			class="flex items-center flex-shrink-0 text-[color:var(--themed-color)] dark:text-[color:var(--themed-color-dark)]"
			style={themedColorVars(item.color)}
			aria-hidden="true"
		>
			<svelte:component this={item.iconComponent} size={16} />
		</span>
	{:else}
		<span
			class="w-3 h-3 rounded-sm flex-shrink-0"
			style="background-color: {item.color};"
			aria-hidden="true"
		></span>
	{/if}
	<span class="text-gray-700 dark:text-gray-300">{item.label}</span>
{/snippet}

<div class="flex flex-wrap gap-x-4 gap-y-1" role={interactive ? 'group' : undefined} aria-label={interactive ? 'Toggle chart series' : undefined}>
	{#each items as item (item.key)}
		{@const isHidden = hidden.has(item.key)}
		{#if interactive}
			<div
				class="inline-flex items-center gap-1.5 text-sm cursor-pointer select-none
					{isHidden ? 'opacity-40' : ''}"
				role="checkbox"
				aria-checked={!isHidden}
				aria-label={item.label}
				tabindex="0"
				on:click={() => toggle(item.key)}
				on:keydown={(e) => handleKeydown(e, item.key)}
			>
				{@render marker(item)}
			</div>
		{:else}
			<div class="inline-flex items-center gap-1.5 text-sm {isHidden ? 'opacity-40' : ''}">
				{@render marker(item)}
			</div>
		{/if}
	{/each}
</div>
