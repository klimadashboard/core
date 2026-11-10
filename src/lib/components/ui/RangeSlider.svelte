<!--
	Unified RangeSlider — WCAG 2.1 AA compliant
	Native <input type="range"> with visible value display and ARIA attributes.

	Usage:
		<RangeSlider label="Year" bind:value={year} min={1990} max={2024} />
		<RangeSlider label="Year" bind:value={year} min={1975} max={2020} step={5} format={(v) => `${v}`} />
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let label: string;
	export let value: number = 0;
	export let min: number = 0;
	export let max: number = 100;
	export let step: number = 1;
	export let hideLabel: boolean = false;
	export let disabled: boolean = false;
	export let format: (v: number) => string = String;
	export let id: string = `slider-${Math.random().toString(36).slice(2, 8)}`;

	const dispatch = createEventDispatcher();
</script>

<div class="flex flex-col gap-1">
	<div class="flex items-center justify-between">
		<label
			for={id}
			class="text-sm font-medium text-gray-700 dark:text-gray-300"
			class:sr-only={hideLabel}
		>
			{label}
		</label>
		<output
			for={id}
			class="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100"
		>
			{format(value)}
		</output>
	</div>

	<input
		{id}
		type="range"
		bind:value
		{min}
		{max}
		{step}
		{disabled}
		on:change={() => dispatch('input', value)}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value}
		aria-valuetext={format(value)}
		class="w-full h-2 rounded-full appearance-none cursor-pointer
			bg-gray-200 dark:bg-gray-700
			accent-blue-600 dark:accent-blue-400
			disabled:opacity-50 disabled:cursor-not-allowed
			focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
	/>

	<div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
		<span>{format(min)}</span>
		<span>{format(max)}</span>
	</div>
</div>
