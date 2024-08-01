<script>
	import Loader from '$lib/components/Loader.svelte';
	import { scaleApproval } from '$lib/stores/scales';

	export let selectedFeature;
	export let data;
	export let stateWideAverage;
</script>

<div class="overflow-scroll h-96 relative ml-auto">
	{#if data}
		<table>
			<thead class="text-gray-600">
				<tr>
					<th>Platz</th>
					<th>Zustimmung</th>
					<th>Landkreis</th>
				</tr>
			</thead>
			<tbody class="">
				{#each data.sort((a, b) => b['support.rd'] - a['support.rd']) as row, i}
					<tr style="border-bottom: 2px solid {scaleApproval(row['support.rd'])}">
						<td>
							<span style="color: {scaleApproval(row['support.rd'])}">&#9679;</span>
							{i + 1}
						</td>
						<td>{row['support.rd']}%</td>
						<td>{row.name}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td />
					<td>{stateWideAverage}%</td>
					<td>Bundesdurchschnitt</td>
				</tr>
			</tfoot>
		</table>
	{:else}
		<Loader />
	{/if}
</div>

<style>
	td,
	th {
		@apply py-1;
	}

	th {
		@apply sticky top-0 font-bold border-b-2 border-b-gray-700 bg-white text-left pr-2;
	}

	tfoot td {
		@apply sticky bottom-0 font-bold border-t-2 border-t-gray-700 bg-white text-gray-700;
	}
</style>
