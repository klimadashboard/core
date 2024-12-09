<script>
	import Tree from './Tree.svelte';

	export let data;
	export let selectedStation;

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
			Seit {startYear} gab es {countSinceStartYear} weiße Weihnachten in {selectedStation.name}.
		</p>
	</div>
</div>
<div
	class="mt-4 grid grid-cols-10 shadow-lg border bg-gray-50 p-4 pt-12 rounded-lg relative max-w-2xl mx-auto"
>
	<p class="absolute top-2 left-1/2 -translate-x-1/2 uppercase font-medium opacity-70">
		Weiße Weihnachten in {selectedStation.name}
	</p>
	{#each data as d}
		<div class="flex items-center flex-col">
			<Tree {d} />
			<p class="text-sm opacity-70 pb-2 border-t border-black">{d.year}</p>
		</div>
	{/each}
</div>
