<script>
	import { createEventDispatcher } from 'svelte';

	export let startDate = '2025-01-01';
	export let endDate = '2025-12-31';

	const dispatch = createEventDispatcher();

	const presets = [
		{ label: '2025', start: '2025-01-01', end: '2025-12-31' },
		{ label: '2024', start: '2024-01-01', end: '2024-12-31' },
		{ label: '2023', start: '2023-01-01', end: '2023-12-31' },
		{ label: 'Letzte 12 Monate', start: null, end: null, dynamic: true },
		{ label: 'Alles', start: '2016-01-01', end: '2026-12-31' }
	];

	function getDynamic12Months() {
		const now = new Date();
		const end = now.toISOString().slice(0, 10);
		const start = new Date(now);
		start.setFullYear(start.getFullYear() - 1);
		return { start: start.toISOString().slice(0, 10), end };
	}

	function applyPreset(preset) {
		if (preset.dynamic) {
			const d = getDynamic12Months();
			startDate = d.start;
			endDate = d.end;
		} else {
			startDate = preset.start;
			endDate = preset.end;
		}
		dispatch('change', { startDate, endDate });
	}

	function handleChange() {
		dispatch('change', { startDate, endDate });
	}

	$: activePreset = presets.find((p) => {
		if (p.dynamic) {
			const d = getDynamic12Months();
			return startDate === d.start && endDate === d.end;
		}
		return startDate === p.start && endDate === p.end;
	});
</script>

<div class="flex flex-wrap items-center gap-2">
	<div class="flex items-center gap-1.5">
		<label class="text-sm font-medium opacity-70" for="date-from">Von</label>
		<input
			id="date-from"
			type="date"
			bind:value={startDate}
			on:change={handleChange}
			min="2016-01-01"
			max={endDate}
			class="text-sm border border-current/15 rounded-lg px-2 py-1 bg-white dark:bg-gray-800"
		/>
	</div>
	<div class="flex items-center gap-1.5">
		<label class="text-sm font-medium opacity-70" for="date-to">Bis</label>
		<input
			id="date-to"
			type="date"
			bind:value={endDate}
			on:change={handleChange}
			min={startDate}
			max="2026-12-31"
			class="text-sm border border-current/15 rounded-lg px-2 py-1 bg-white dark:bg-gray-800"
		/>
	</div>
	<div class="flex flex-wrap gap-1">
		{#each presets as preset}
			<button
				class="text-xs px-2 py-1 rounded-full border transition-colors cursor-pointer
					{activePreset === preset
					? 'bg-blue-600 text-white border-blue-600'
					: 'border-current/15 hover:bg-current/5'}"
				on:click={() => applyPreset(preset)}
			>
				{preset.label}
			</button>
		{/each}
	</div>
</div>
