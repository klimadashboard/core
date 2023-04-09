<script>
	export let categories;
	export let highlightedYearIndex;
	export let ksgSelection;
	export let crfSelection;
</script>

<div class="w-full p-2 flex flex-wrap gap-2">
	{#each categories as category, c}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="font-semibold tracking-wide px-3 py-1 text-white text-xs rounded-full flex flex-col cursor-pointer"
			style="background-color: {category.colorCode}; opacity: {crfSelection != null &&
			crfSelection != c
				? 0.5
				: 1}"
			on:click={(e) => {
				if (ksgSelection != null) crfSelection = c;
				else ksgSelection = c;
			}}
		>
			<span class="flex gap-x-2">
				{#if category.icon}<i>{@html category.icon}</i>{/if}
				<span class="uppercase">{category.label}</span>
			</span>
			{#if highlightedYearIndex != null && (crfSelection != null ? crfSelection == c : true)}
				<small class="">{category.absolute[highlightedYearIndex].toFixed(2)} Mt</small>
			{/if}
		</div>
	{/each}

	<!-- Total -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="font-semibold tracking-wide px-3 py-1 text-white text-xs rounded-full flex flex-col cursor-pointer"
		style="background-color: {ksgSelection != null
			? categories[0].colorCode
			: 'black'}; opacity: {crfSelection != null ? 0.5 : 1}"
		on:click={(e) => {
			if (crfSelection != null) crfSelection = null;
			else if (ksgSelection != null) ksgSelection = null;
		}}
	>
		<span class="flex gap-x-2">
			<span class="uppercase">Total</span>
		</span>
		{#if highlightedYearIndex != null && (crfSelection != null ? crfSelection == c : true)}
			<small class=""
				>{categories.reduce((sum, cat) => sum + cat.absolute[highlightedYearIndex], 0).toFixed(2)} Mt</small
			>
		{/if}
	</div>
</div>
