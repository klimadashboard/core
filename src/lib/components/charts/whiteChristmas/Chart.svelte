<script>
	import Tree from './Tree.svelte';

	export let data;

	let startYear = data[0].year;
	$: countSinceStartYear = data.filter(
		(d) => d.year >= startYear && (d.sh24 >= 1 || d.sh25 >= 1 || d.sh26 >= 1)
	).length;
</script>

<div class="flex flex-col items-center gap-4">
	<div class="">
		<label for="">Wähle dein Geburtsdatum</label>
		<input type="number" bind:value={startYear} class="k_input" />
	</div>
	<div class="">
		<p class="text-2xl">
			Seit {startYear} gab es {countSinceStartYear} weiße Weihnachten in {'München'}.
		</p>
	</div>
	<div class="grid grid-cols-10 gap-4 bg-gray-100">
		{#each data as d}
			<div class="flex items-center flex-col">
				{#if d.hasData}
					<Tree {d} />
				{:else}
					<p>No data available</p>
				{/if}
				<p>{d.year}</p>
			</div>
		{/each}
	</div>
</div>
