<!--
	Unified RadioGroup — WCAG 2.1 AA compliant
	Uses native radio inputs with role="radiogroup" and proper labelling.

	Usage:
		<RadioGroup
			label="Scenario"
			bind:value={scenario}
			options={[{ value: 'a', label: 'EAG' }, { value: 'b', label: 'NEKP' }]}
		/>
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let label: string;
	export let value: any = '';
	export let options: Array<{ value: any; label: string }> = [];
	export let hideLabel: boolean = false;
	export let disabled: boolean = false;
	export let name: string = `rg-${Math.random().toString(36).slice(2, 8)}`;
	export let inline: boolean = true;

	const dispatch = createEventDispatcher();

	function handleChange(optValue: any) {
		value = optValue;
		dispatch('change', value);
	}
</script>

<fieldset
	role="radiogroup"
	aria-label={label}
	class="flex flex-col gap-1"
	{disabled}
>
	<legend
		class="text-sm font-medium text-gray-700 dark:text-gray-300"
		class:sr-only={hideLabel}
	>
		{label}
	</legend>

	<div class="flex gap-1 {inline ? 'flex-row flex-wrap' : 'flex-col'}">
		{#each options as opt}
			{@const checked = value === opt.value}
			{@const id = `${name}-${opt.value}`}
			<label
				for={id}
				class="inline-flex items-center rounded-full border px-3 py-1 text-sm cursor-pointer transition-colors
					{disabled ? 'opacity-50 cursor-not-allowed' : ''}
					{checked
						? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
						: 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}"
			>
				<input
					{id}
					type="radio"
					{name}
					value={opt.value}
					{checked}
					{disabled}
					on:change={() => handleChange(opt.value)}
					class="sr-only"
				/>
				{opt.label}
			</label>
		{/each}
	</div>
</fieldset>
