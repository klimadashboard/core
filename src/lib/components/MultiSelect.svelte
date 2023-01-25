<script>
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	export let id = '';
	export let value = [];
	export let readonly = false;
	export let placeholder = '';

	let input,
		inputValue,
		options = [],
		activeOption,
		showOptions = false,
		selected = {},
		first = true,
		slot;
	const iconClearPath =
		'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

	onMount(() => {
		slot.querySelectorAll('option').forEach((o) => {
			o.selected && !value.includes(o.value) && (value = [...value, o.value]);
			options = [...options, { value: o.value, name: o.textContent }];
		});
		value &&
			(selected = options.reduce(
				(obj, op) => (value.includes(op.value) ? { ...obj, [op.value]: op } : obj),
				{}
			));
		first = false;
	});

	$: if (!first) value = Object.values(selected).map((o) => o.value);
	$: filtered = options.filter((o) =>
		inputValue ? o.name.toLowerCase().includes(inputValue.toLowerCase()) : o
	);
	$: if ((activeOption && !filtered.includes(activeOption)) || (!activeOption && inputValue))
		activeOption = filtered[0];

	function add(token) {
		if (!readonly) selected[token.value] = token;
	}

	function remove(value) {
		if (!readonly) {
			const { [value]: val, ...rest } = selected;
			selected = rest;
		}
	}

	function optionsVisibility(show) {
		if (readonly) return;
		if (typeof show === 'boolean') {
			showOptions = show;
			show && input.focus();
		} else {
			showOptions = !showOptions;
		}
		if (!showOptions) {
			activeOption = undefined;
		}
	}

	function handleKeyup(e) {
		if (e.keyCode === 13) {
			Object.keys(selected).includes(activeOption.value)
				? remove(activeOption.value)
				: add(activeOption);
			inputValue = '';
		}
		if ([38, 40].includes(e.keyCode)) {
			// up and down arrows
			const increment = e.keyCode === 38 ? -1 : 1;
			const calcIndex = filtered.indexOf(activeOption) + increment;
			activeOption =
				calcIndex < 0
					? filtered[filtered.length - 1]
					: calcIndex === filtered.length
					? filtered[0]
					: filtered[calcIndex];
		}
	}

	function handleBlur(e) {
		optionsVisibility(false);
	}

	function handleTokenClick(e) {
		if (e.target.closest('.token-remove')) {
			e.stopPropagation();
			remove(e.target.closest('.token').dataset.id);
		} else if (e.target.closest('.remove-all')) {
			selected = [];
			inputValue = '';
		} else {
			optionsVisibility(true);
		}
	}

	function handleOptionMousedown(e) {
		const value = e.target.dataset.value;
		if (selected[value]) {
			remove(value);
		} else {
			add(options.filter((o) => o.value === value)[0]);
			input.focus();
		}
	}
</script>

<div class="multiselect bg-gray-100  rounded-full" class:readonly>
	<div class="tokens overflow-scroll" class:showOptions on:click={handleTokenClick}>
		{#each Object.values(selected).splice(1) as s}
			<div
				class="token bg-gradient-green font-semibold uppercase tracking-wide pl-2 text-white text-sm rounded-full mr-4"
				data-id={s.value}
			>
				<span class="">{s.name}</span>
				{#if !readonly}
					<div
						class="token-remove rounded-full h-6 w-6 grid ml-1 cursor-pointer bg-green-600 hover:bg-green-700"
						title="Remove {s.name}"
					>
						<svg
							class="icon-clear m-auto"
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
						>
							<path d={iconClearPath} />
						</svg>
					</div>
				{/if}
			</div>
		{/each}
		<div class="actions">
			{#if !readonly}
				<input
					{id}
					class="bg-transparent"
					autocomplete="off"
					bind:value={inputValue}
					bind:this={input}
					on:keyup={handleKeyup}
					on:blur={handleBlur}
					{placeholder}
					aria-label="Select {id}"
				/>
				<div
					class="remove-all bg-green-600 hover:bg-green-700"
					title="Remove All"
					class:hidden={!Object.keys(selected).length}
				>
					<svg
						class="icon-clear"
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
					>
						<path d={iconClearPath} />
					</svg>
				</div>
				<svg
					class="dropdown-arrow"
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 18 18"><path d="M5 8l4 4 4-4z" /></svg
				>
			{/if}
		</div>
	</div>

	<select bind:this={slot} type="multiple" class="hidden"><slot /></select>

	{#if showOptions}
		<ul
			class="options"
			transition:fly={{ duration: 200, y: 5 }}
			on:mousedown|preventDefault={handleOptionMousedown}
		>
			{#each filtered as option}
				<li
					data-value={option.value}
					class="bg-white  {selected[option.value] ? 'bg-gradient-green text-white' : ''}"
				>
					{option.name}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.multiselect {
		position: relative;
		z-index: 10;
	}

	.tokens {
		align-items: center;
		display: flex;
		position: relative;
	}

	.tokens.showOptions::after {
		width: 100%;
		left: 0;
	}
	.token {
		align-items: center;
		display: flex;
		white-space: nowrap;
	}

	.readonly .token {
		color: hsl(0, 0%, 40%);
	}
	.remove-all {
		align-items: center;
		border-radius: 50%;
		color: hsl(214, 17%, 92%);
		display: flex;
		justify-content: center;
		height: 1.25rem;
		margin-left: 0.25rem;
		min-width: 1.25rem;
	}

	.actions {
		align-items: center;
		display: flex;
		flex: 1;
		min-width: 15rem;
	}

	input {
		border: none;
		font-size: 1em;
		line-height: 1.5rem;
		margin: 0;
		outline: none;
		padding: 0;
		width: 100%;
	}

	.dropdown-arrow path {
		fill: hsl(0, 0%, 70%);
	}
	.multiselect:hover .dropdown-arrow path {
		fill: hsl(0, 0%, 50%);
	}

	.icon-clear path {
		fill: white;
	}

	.options {
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1), 0px -2px 4px rgba(0, 0, 0, 0.1);
		left: 0;
		list-style: none;
		margin-block-end: 0;
		margin-block-start: 0;
		max-height: 70vh;
		overflow: auto;
		padding-inline-start: 0;
		position: absolute;
		top: calc(100% + 1px);
		width: 100%;
	}
	li {
		cursor: pointer;
		padding: 0.5rem;
	}
	li:last-child {
		border-bottom-left-radius: 0.2rem;
		border-bottom-right-radius: 0.2rem;
	}
</style>
