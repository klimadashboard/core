<script>
	import Tree from './Tree.svelte';
	import domtoimage from 'dom-to-image';

	export let data;
	export let selectedStation;
	let item;

	let startYear = data[0].year;
	$: countSinceStartYear = data.filter(
		(d) => d.year >= startYear && (d.sh24 >= 1 || d.sh25 >= 1 || d.sh26 >= 1)
	).length;

	const exportImage = async () => {
		domtoimage
			.toBlob(item, {
				filter: (e) => {
					return Object.keys(e.dataset || {}).includes('shareIgnore') ? false : true;
				},
				width: item.clientWidth * 4,
				height: item.clientHeight * 4,
				style: {
					transform: 'scale(4)',
					transformOrigin: 'top left'
				}
			})
			.then(async function (blob) {
				const filesArray = [
					new File([blob], 'share.png', {
						type: blob.type,
						lastModified: new Date().getTime()
					})
				];
				const shareData = {
					files: filesArray
				};

				try {
					await navigator.share(shareData);
				} catch (err) {
					// console.log(`Cannot share data: ${err}, downloading instead.`);
				}
			});
	};
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

<button on:mousedown={() => exportImage()} class="mx-auto my-4 flex items-center gap-2">
	<span>Bild teilen</span>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="icon icon-tabler icons-tabler-outline icon-tabler-photo-down"
		><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 8h.01" /><path
			d="M12.5 21h-6.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6.5"
		/><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l4 4" /><path
			d="M14 14l1 -1c.653 -.629 1.413 -.815 2.13 -.559"
		/><path d="M19 16v6" /><path d="M22 19l-3 3l-3 -3" /></svg
	></button
>

<div
	bind:this={item}
	class="mt-4 grid grid-cols-10 shadow-lg border bg-gray-100 p-4 pt-12 rounded-lg relative max-w-2xl mx-auto"
>
	<p
		class="absolute top-2 left-1/2 -translate-x-1/2 uppercase font-medium opacity-70 w-full text-center"
	>
		Weiße Weihnachten in {selectedStation.name}
	</p>
	{#each data as d}
		<div class="flex items-center flex-col">
			<Tree {d} />
			<p class="text-sm opacity-70 pb-2 border-t border-black">{d.year}</p>
		</div>
	{/each}
</div>
