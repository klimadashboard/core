<script>
	import { formatLabel } from '$lib/utils/format';
	export let data;
</script>

<div class="overflow-scroll mt-4 w-full h-full">
	<table class="min-w-full">
		<thead class="font-bold">
			<tr>
				<td>{data[0].x_axis_name}</td>
				{#each data[0].layers as l}
					<td>{l.label}</td>
				{/each}
			</tr>
		</thead>
		{#each data as d}
			<tr class="odd:bg-gray-100 dark:odd:bg-gray-800">
				<td>
					{formatLabel(d.x)}
				</td>
				{#each d.layers as l}
					<td>{formatLabel(l.y)}</td>
				{/each}
			</tr>
		{/each}
	</table>
</div>

<style>
	@reference "tailwindcss/theme";
	td {
		@apply px-2 border-l border-gray-100;
	}

	td:first-of-type {
		@apply border-none;
	}
</style>
