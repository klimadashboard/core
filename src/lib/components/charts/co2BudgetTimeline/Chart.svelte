<script>
	import { fade } from 'svelte/transition';

	export let data;

	let types = [
		{
			key: 'overused',
			classes: 'bg-energy'
		},
		{
			key: 'historical',
			classes: 'bg-industry'
		},
		{
			key: 'projection',
			classes: 'bg-none border-industry border-2'
		}
	];
</script>

<div class="relative mt-auto p-4">
	<div class="flex h-80 items-end space-x-2.5 w-max">
		{#each data as year, i}
			<div class="relative w-3" transition:fade={{ delay: i * 10 }}>
				{#if i % 10 == 0 || year.year == 2023}
					<p class="text-xs text-gray-600 absolute -bottom-4 left-1 -translate-x-1/2">
						{year.year}
					</p>
				{/if}

				<div class="flex flex-col-reverse">
					{#each year.data as a, j}
						<div class="w-3 h-3 {types.find((d) => d.key == a.type).classes} mb-0.5 rounded-xl" />
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
<div>
	<p>2016</p>
	<p>Pariser Klimaabkommen</p>
</div>
