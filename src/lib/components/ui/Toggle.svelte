<!--
	Unified Toggle (on/off switch) — WCAG 2.1 AA compliant
	Uses <button role="switch"> with proper aria-checked.

	Usage:
		<Toggle label="Per capita" bind:checked={perCapita} />
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let label: string;
	export let checked: boolean = false;
	export let disabled: boolean = false;
	export let id: string = `toggle-${Math.random().toString(36).slice(2, 8)}`;

	const dispatch = createEventDispatcher();

	function handleClick() {
		if (disabled) return;
		checked = !checked;
		dispatch('change', checked);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleClick();
		}
	}
</script>

<div class="inline-flex items-center gap-2 {disabled ? 'opacity-50' : ''}">
	<button
		{id}
		type="button"
		role="switch"
		aria-checked={checked}
		aria-label={label}
		{disabled}
		on:click={handleClick}
		on:keydown={handleKeydown}
		class="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
			transition-colors duration-200 ease-in-out cursor-pointer
			focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
			disabled:cursor-not-allowed
			{checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}"
	>
		<span
			aria-hidden="true"
			class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform
				transition-transform duration-200 ease-in-out
				{checked ? 'translate-x-4' : 'translate-x-0'}"
		/>
	</button>
	<label
		for={id}
		class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
		class:cursor-not-allowed={disabled}
		on:click={handleClick}
	>
		{label}
	</label>
</div>
