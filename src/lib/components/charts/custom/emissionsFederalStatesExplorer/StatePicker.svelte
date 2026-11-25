<!--
	Dropdown with checkboxes to show / hide federal states.
	Used on wide screens, where the lines carry end labels and the legend is not shown.
	Binds the same `hidden` set as the interactive Legend.
-->
<script context="module" lang="ts">
	function clickOutside(node: HTMLElement, handler: () => void) {
		const onClick = (event: MouseEvent) => {
			if (!node.contains(event.target as Node)) handler();
		};
		document.addEventListener('click', onClick, true);
		return {
			destroy() {
				document.removeEventListener('click', onClick, true);
			}
		};
	}
</script>

<script lang="ts">
	type Item = { key: string; label: string; color: string; dash: string | null };

	export let items: Item[] = [];
	export let hidden: Set<string> = new Set();
	/** button text before the count, e.g. "Bundesländer" or "Antriebsarten" (also used by the registration explorers) */
	export let title: string = 'Bundesländer';

	let open = false;
	const listId = `state-picker-${Math.random().toString(36).slice(2, 8)}`;

	$: shown = items.filter((i) => !hidden.has(i.key)).length;

	function toggle(key: string) {
		const next = new Set(hidden);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		hidden = next;
	}
</script>

<div class="relative" use:clickOutside={() => (open = false)}>
	<button
		type="button"
		aria-haspopup="true"
		aria-expanded={open}
		aria-controls={listId}
		on:click={() => (open = !open)}
		on:keydown={(e) => e.key === 'Escape' && (open = false)}
		class="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-gray-500 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-400 dark:hover:bg-gray-800"
	>
		{title}: {shown} von {items.length}
		<svg class="h-4 w-4 transition-transform {open ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
		</svg>
	</button>

	{#if open}
		<div
			id={listId}
			class="absolute left-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900"
			on:keydown={(e) => e.key === 'Escape' && (open = false)}
		>
			<fieldset>
				<legend class="sr-only">{title} anzeigen</legend>
				<div class="mb-1 flex justify-between px-1 text-xs text-gray-500 dark:text-gray-400">
					<button type="button" class="underline hover:text-gray-900 dark:hover:text-white" on:click={() => (hidden = new Set())}>
						Alle
					</button>
					<button
						type="button"
						class="underline hover:text-gray-900 dark:hover:text-white"
						on:click={() => (hidden = new Set(items.map((i) => i.key)))}
					>
						Keine
					</button>
				</div>
				{#each items as item (item.key)}
					<label
						class="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
					>
						<input
							type="checkbox"
							checked={!hidden.has(item.key)}
							on:change={() => toggle(item.key)}
							class="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
						/>
						<svg width="18" height="8" aria-hidden="true">
							<line x1="1" y1="4" x2="17" y2="4" stroke={item.color} stroke-width="2.5" stroke-dasharray={item.dash} stroke-linecap="round" />
						</svg>
						{item.label}
					</label>
				{/each}
			</fieldset>
		</div>
	{/if}
</div>
