<!--
	Unified Checkbox — WCAG 2.1 AA compliant
	Native <input type="checkbox"> with proper label association.

	Usage:
		<Checkbox label="Per capita" bind:checked={perCapita} />
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let label: string;
	export let checked: boolean = false;
	export let disabled: boolean = false;
	export let id: string = `cb-${Math.random().toString(36).slice(2, 8)}`;

	const dispatch = createEventDispatcher();

	function handleChange() {
		dispatch('change', checked);
	}
</script>

<label
	for={id}
	class="inline-flex items-center gap-2 cursor-pointer select-none
		{disabled ? 'opacity-50 cursor-not-allowed' : ''}"
>
	<input
		{id}
		type="checkbox"
		bind:checked
		{disabled}
		on:change={handleChange}
		class="h-4 w-4 rounded border-gray-300 dark:border-gray-600
			text-blue-600 dark:text-blue-400
			bg-white dark:bg-gray-800
			focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
	/>
	<span class="text-sm text-gray-700 dark:text-gray-300">{label}</span>
</label>
