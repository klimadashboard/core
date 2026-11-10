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
	/** Compact pills (e.g. next to chips in a toolbar row) */
	export let small: boolean = false;

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

	<!-- Same look as the segmented Switch ($lib/components/Switch.svelte) used in the charts -->
	<div
		class="inline-flex max-w-full gap-0.5 rounded-full border border-gray-200 bg-gray-100 {small ? 'p-0.5' : 'p-1'} dark:border-gray-700 dark:bg-gray-800
			{inline ? 'flex-row flex-wrap' : 'flex-col'} self-start"
	>
		{#each options as opt}
			{@const checked = value === opt.value}
			{@const id = `${name}-${opt.value}`}
			<label
				for={id}
				class="inline-flex items-center whitespace-nowrap rounded-full font-medium transition-colors duration-200
					{small ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-sm'}
					focus-within:ring-2 focus-within:ring-blue-500
					{disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
					{checked
					? 'bg-white text-black dark:bg-gray-900 dark:text-white'
					: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}"
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
