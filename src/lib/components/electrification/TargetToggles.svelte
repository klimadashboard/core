<!--
	Toggles for the contextual benchmark targets (COP31, Climate Advisory Board), shared by
	electrificationCountryPaths and electrificationDistanceToTarget. The sector panel draws no
	target lines — an economy-wide target has the wrong denominator per sector — so it doesn't
	use this. The swatch draws each target's actual dash pattern, since reference lines are told
	apart by dash as well as colour.
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { REFERENCE_TARGETS } from '$lib/utils/electrification';

	/** Ids of the reference targets currently shown. Off by default. */
	export let selected: string[] = [];
	export let label: string = 'Compare with';

	const dispatch = createEventDispatcher<{ change: string[] }>();

	function toggle(id: string) {
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
		dispatch('change', selected);
	}
</script>

<div class="flex flex-wrap items-center gap-1.5">
	<span class="text-sm text-gray-500 dark:text-gray-400">{label}</span>
	{#each REFERENCE_TARGETS as r (r.id)}
		{@const on = selected.includes(r.id)}
		<button
			type="button"
			aria-pressed={on}
			on:click={() => toggle(r.id)}
			class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600
				bg-white dark:bg-gray-800 px-2.5 py-1 text-sm font-medium text-gray-900 dark:text-gray-100
				{on ? '' : 'opacity-40'}"
		>
			<svg width="14" height="8" aria-hidden="true" class="flex-shrink-0 overflow-visible">
				<line
					x1="0"
					y1="4"
					x2="14"
					y2="4"
					stroke={r.color}
					stroke-width="2"
					stroke-dasharray={r.dash}
				/>
			</svg>
			{r.label}
		</button>
	{/each}
</div>
