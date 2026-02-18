<script>
	import { Table } from '$lib/components/charts/primitives';
	export let snapshot;
</script>

<h2 class="md:text-lg font-bold text-gray-900 dark:text-white leading-tight text-balance mb-3">
	{snapshot.title}
</h2>
{#if snapshot.heading}
	<p class="text-xl md:text-2xl mb-3 text-balance">{@html snapshot.heading}</p>
{/if}
{#if snapshot.table?.rows?.length}
	<div class="mt-3">
		<Table
			columns={snapshot.table.columns}
			rows={snapshot.table.rows}
			maxHeight="300px"
			caption={snapshot.title}
		/>
	</div>
{/if}
{#if snapshot.text}
	<div class="text-sm text-gray-600 dark:text-gray-400 mt-3 max-w-xl">{@html snapshot.text}</div>
{/if}
{#if snapshot.source}
	<p class="text-xs text-gray-500 mt-4">{@html snapshot.source}</p>
{/if}
