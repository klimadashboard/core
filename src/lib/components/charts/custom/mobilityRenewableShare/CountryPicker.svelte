<!--
	Country picker with search + removable chips.
	The chips double as the chart legend: each shows the line colour and dash pattern of its series.
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
	import { tick } from 'svelte';

	type Option = { id: string; name: string };
	type LineStyle = { color: string; dash: string | null };

	export let options: Option[] = [];
	export let selected: string[] = [];
	export let home: Option & { color: string };
	export let styleFor: (id: string) => LineStyle;
	export let max = 6;

	let open = false;
	let query = '';
	let activeIndex = 0;
	let searchInput: HTMLInputElement;
	const listId = `country-list-${Math.random().toString(36).slice(2, 8)}`;

	$: nameOf = (id: string) => options.find((o) => o.id === id)?.name ?? id;
	$: filtered = options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()));
	$: if (activeIndex >= filtered.length) activeIndex = Math.max(0, filtered.length - 1);
	$: full = selected.length >= max;

	function toggle(id: string) {
		if (selected.includes(id)) {
			selected = selected.filter((s) => s !== id);
		} else if (!full) {
			selected = [...selected, id];
		}
	}

	async function openPicker() {
		open = true;
		query = '';
		activeIndex = 0;
		await tick();
		searchInput?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = (activeIndex + 1) % Math.max(filtered.length, 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = (activeIndex - 1 + filtered.length) % Math.max(filtered.length, 1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const opt = filtered[activeIndex];
			if (opt) toggle(opt.id);
		} else if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<!-- Home country: always shown, not removable -->
	<span
		class="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm font-semibold text-gray-800 dark:text-gray-100"
	>
		<svg width="20" height="8" aria-hidden="true">
			<line x1="2" y1="4" x2="18" y2="4" stroke={home.color} stroke-width="3.5" stroke-linecap="round" />
		</svg>
		{home.name}
	</span>

	{#each selected as id (id)}
		{@const s = styleFor(id)}
		<span
			class="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 pl-3 pr-1 py-1 text-sm text-gray-700 dark:text-gray-200"
		>
			<svg width="20" height="8" aria-hidden="true">
				<line
					x1="2"
					y1="4"
					x2="18"
					y2="4"
					stroke={s.color}
					stroke-width="2.5"
					stroke-dasharray={s.dash}
					stroke-linecap="round"
				/>
			</svg>
			{nameOf(id)}
			<button
				type="button"
				class="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
				aria-label="{nameOf(id)} entfernen"
				on:click={() => toggle(id)}
			>
				<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
					<path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
				</svg>
			</button>
		</span>
	{/each}

	<div class="relative" use:clickOutside={() => (open = false)}>
		<button
			type="button"
			class="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-400 dark:border-gray-500 px-3 py-1 text-sm text-gray-700 dark:text-gray-200 hover:border-gray-600 hover:bg-gray-50 dark:hover:border-gray-300 dark:hover:bg-gray-800"
			aria-haspopup="listbox"
			aria-expanded={open}
			on:click={() => (open ? (open = false) : openPicker())}
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
				<path stroke-linecap="round" d="M12 5v14M5 12h14" />
			</svg>
			{selected.length ? 'Länder' : 'Mit anderen Ländern vergleichen'}
		</button>

		{#if open}
			<div
				class="absolute left-0 z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
			>
				<div class="border-b border-gray-200 p-2 dark:border-gray-700">
					<input
						bind:this={searchInput}
						bind:value={query}
						on:keydown={onKeydown}
						type="search"
						placeholder="Land suchen …"
						aria-label="Land suchen"
						aria-controls={listId}
						aria-activedescendant={filtered[activeIndex] ? `${listId}-${filtered[activeIndex].id}` : undefined}
						autocomplete="off"
						class="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
					/>
					<div class="mt-1.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
						<span>{selected.length} von max. {max} Ländern</span>
						{#if selected.length}
							<button type="button" class="underline hover:text-gray-900 dark:hover:text-white" on:click={() => (selected = [])}>
								Alle entfernen
							</button>
						{/if}
					</div>
				</div>

				<ul id={listId} role="listbox" aria-multiselectable="true" aria-label="Länder" class="max-h-64 overflow-y-auto py-1">
					{#each filtered as opt, i (opt.id)}
						{@const isSelected = selected.includes(opt.id)}
						{@const disabled = !isSelected && full}
						<li
							id="{listId}-{opt.id}"
							role="option"
							aria-selected={isSelected}
							aria-disabled={disabled}
							class="flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm
								{i === activeIndex ? 'bg-gray-100 dark:bg-gray-800' : ''}
								{disabled ? 'cursor-not-allowed opacity-40' : ''}
								{isSelected ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}"
							on:mousedown|preventDefault={() => toggle(opt.id)}
							on:mousemove={() => (activeIndex = i)}
						>
							<span>{opt.name}</span>
							{#if isSelected}
								{@const s = styleFor(opt.id)}
								<svg width="20" height="8" aria-hidden="true">
									<line x1="2" y1="4" x2="18" y2="4" stroke={s.color} stroke-width="2.5" stroke-dasharray={s.dash} stroke-linecap="round" />
								</svg>
							{/if}
						</li>
					{:else}
						<li class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Kein Land gefunden</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
