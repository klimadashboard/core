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
					new File([blob], 'whitechristmas.png', {
						type: blob.type,
						lastModified: new Date().getTime()
					})
				];

				const shareData = { files: filesArray };

				try {
					await navigator.share(shareData);
				} catch (err) {
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'whitechristmas.png';
					a.click();
					URL.revokeObjectURL(url);
				}
			});
	};
</script>

<div class="flex flex-col items-center gap-4">
	<div class=" ">
		<label for="" class="text-sm text-gray-700 mb-1 font-medium">Wähle dein Geburtsdatum</label>
		<input type="number" bind:value={startYear} class="k_input max-w-20" />
	</div>
	<div class="">
		<p class="text-2xl text-center text-balance">
			Seit {startYear} gab es {countSinceStartYear} weiße Weihnachten an der Wetterstation {selectedStation.name}.
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

<div class="mt-4 relative max-w-2xl mx-auto shadow">
	<div bind:this={item} class="grid grid-cols-10 bg-[#F0F1F1] p-2 sm:p-4 pt-12 sm:pt-12">
		<div class="flex justify-between absolute top-2 left-2 right-2 items-center text-[#82838B]">
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
				class="w-6 h-6 opacity-50"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 4l2 1l2 -1" /><path
					d="M12 2v6.5l3 1.72"
				/><path d="M17.928 6.268l.134 2.232l1.866 1.232" /><path
					d="M20.66 7l-5.629 3.25l.01 3.458"
				/><path d="M19.928 14.268l-1.866 1.232l-.134 2.232" /><path
					d="M20.66 17l-5.629 -3.25l-2.99 1.738"
				/><path d="M14 20l-2 -1l-2 1" /><path d="M12 22v-6.5l-3 -1.72" /><path
					d="M6.072 17.732l-.134 -2.232l-1.866 -1.232"
				/><path d="M3.34 17l5.629 -3.25l-.01 -3.458" /><path
					d="M4.072 9.732l1.866 -1.232l.134 -2.232"
				/><path d="M3.34 7l5.629 3.25l2.99 -1.738" /></svg
			>
			<p class="text-xs sm:text-base font-christmas text-center w-full">
				Weiße Weihnachten in {selectedStation.name}
			</p>
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
				class="h-6 w-6 opacity-50"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 4l2 1l2 -1" /><path
					d="M12 2v6.5l3 1.72"
				/><path d="M17.928 6.268l.134 2.232l1.866 1.232" /><path
					d="M20.66 7l-5.629 3.25l.01 3.458"
				/><path d="M19.928 14.268l-1.866 1.232l-.134 2.232" /><path
					d="M20.66 17l-5.629 -3.25l-2.99 1.738"
				/><path d="M14 20l-2 -1l-2 1" /><path d="M12 22v-6.5l-3 -1.72" /><path
					d="M6.072 17.732l-.134 -2.232l-1.866 -1.232"
				/><path d="M3.34 17l5.629 -3.25l-.01 -3.458" /><path
					d="M4.072 9.732l1.866 -1.232l.134 -2.232"
				/><path d="M3.34 7l5.629 3.25l2.99 -1.738" /></svg
			>
		</div>
		{#each data as d}
			<div class="flex items-center flex-col">
				<Tree {d} />
				<p class="text-xs xs:text-sm pb-2 border-t border-black -translate-y-[1px]">{d.year}</p>
			</div>
		{/each}
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Itim&display=swap');

	.font-christmas {
		font-family: 'Itim', 'Barlow', sans-serif;
		font-weight: 400;
		font-style: normal;
	}
</style>
