<!-- $lib/charts/primitives/Table.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/utils/t';
	import type { TableColumn } from '../types';

	export let columns: TableColumn[] = [];
	export let rows: Record<string, any>[] = [];
	export let maxHeight: string = '400px';
	export let caption: string = '';

	let sortKey: string | null = null;
	let sortDir: 'asc' | 'desc' = 'asc';

	function sort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	function handleHeaderKeydown(e: KeyboardEvent, key: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			sort(key);
		}
	}

	$: sortedRows = sortKey
		? [...rows].sort((a, b) => {
				const av = a[sortKey!],
					bv = b[sortKey!];
				const cmp = av < bv ? -1 : av > bv ? 1 : 0;
				return sortDir === 'asc' ? cmp : -cmp;
			})
		: rows;

	function formatCell(col: TableColumn, row: Record<string, any>): string {
		const val = row[col.key];
		if (val == null) return '–';
		return col.format ? col.format(val) : String(val);
	}
</script>

<div
	class="overflow-auto rounded border border-gray-200 dark:border-gray-700"
	style="max-height: {maxHeight};"
>
	<table class="w-full text-sm">
		{#if caption}
			<caption class="sr-only">{caption}</caption>
		{/if}
		<thead class="sticky top-0 bg-gray-50 dark:bg-gray-800">
			<tr>
				{#each columns as col}
					<th
						scope="col"
						class="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
						class:text-right={col.align === 'right'}
						on:click={() => sort(col.key)}
						on:keydown={(e) => handleHeaderKeydown(e, col.key)}
						tabindex="0"
						aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
					>
						{col.label}
						{#if sortKey === col.key}
							<span class="ml-1" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedRows as row, i}
				<tr class:bg-gray-50={i % 2 === 1} class:dark:bg-gray-800={i % 2 === 1}>
					{#each columns as col}
						<td
							class="px-3 py-2 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800"
							class:text-right={col.align === 'right'}
						>
							{formatCell(col, row)}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if rows.length === 0}
	<p class="text-center py-8 text-gray-500">{t(page.data.translations, 'status.noData')}</p>
{/if}
