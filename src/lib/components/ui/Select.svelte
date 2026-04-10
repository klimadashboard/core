<!--
	Unified Select dropdown — WCAG 2.1 AA compliant
	Uses native <select> for full keyboard + screen reader support.

	Usage:
		<Select label="Year" bind:value={year} options={yearOptions} />
		<Select label="Region" bind:value={region} options={regionOptions} hideLabel />
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let label: string;
	export let value: any = '';
	export let options: Array<{ value: any; label: string; group?: string }> = [];
	export let hideLabel: boolean = false;
	export let disabled: boolean = false;
	export let id: string = `select-${Math.random().toString(36).slice(2, 8)}`;
	export let small: boolean = false;

	const dispatch = createEventDispatcher();

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		value = target.value;
		dispatch('change', value);
	}

	$: grouped = options.some((o) => o.group);
	$: groups = grouped
		? [...new Set(options.map((o) => o.group))].filter(Boolean)
		: [];
</script>

<div class="flex flex-col gap-1">
	<label
		for={id}
		class="text-sm font-medium text-gray-700 dark:text-gray-300"
		class:sr-only={hideLabel}
	>
		{label}
	</label>

	<div class="relative">
		<select
			{id}
			{value}
			{disabled}
			on:change={handleChange}
			class="block w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600
				bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
				focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
				disabled:opacity-50 disabled:cursor-not-allowed
				{small ? 'px-2 py-1 pr-7 text-sm' : 'px-3 py-2 pr-8 text-sm'}"
		>
			{#if grouped}
				{#each groups as group}
					<optgroup label={group}>
						{#each options.filter((o) => o.group === group) as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</optgroup>
				{/each}
				{#each options.filter((o) => !o.group) as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			{:else}
				{#each options as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			{/if}
		</select>

		<svg
			class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			aria-hidden="true"
		>
			<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</div>
</div>
