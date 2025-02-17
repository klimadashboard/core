<script>
	import dayjs from 'dayjs';
	export let type;
	export let current;
	export let comparison;
	export let compareLastYear;
	export let compareFirstYear;
	export let selectedYear;
	export let currentDate;

	let angle = 0;

	$: {
		if (current > 0 && comparison > 0) {
			angle = 45 * Math.log2(current / comparison) * -1;
			angle = Math.max(-45, Math.min(45, angle)); // Limit angle to [-45, 45] degrees
		} else if (current > 0 && comparison == 0) {
			angle = -45;
		} else if (current == 0 && comparison > 0) {
			angle = 45;
		} else {
			angle = 0; // Default angle
		}
	}
</script>

<div
	class="rounded-sm overflow-hidden bg-gray-100 flex flex-col justify-between"
	style="border: 2px solid {type.color}"
>
	<div
		class="text-white px-3 py-2 leading-none flex items-center gap-1 flex-wrap w-full"
		style="background: {type.color}"
	>
		<div class="text-lg leading-none">
			<h3 class="font-bold">{type.label}</h3>
			<p class="">{type.description}</p>
		</div>
		<div class="ml-auto">
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
				class="icon icon-tabler icons-tabler-outline icon-tabler-circle-arrow-right"
				style="transform: rotate({angle}deg);"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18" />
				<path d="M16 12l-4 -4" />
				<path d="M16 12h-8" />
				<path d="M12 16l4 -4" />
			</svg>
		</div>
	</div>
	<div class="p-2 grid grid-cols-2 gap-2" style="color: {type.color}">
		<div class="flex items-end space-x-2">
			<p class="text-6xl font-extralight tracking-tighter leading-[0.85em]">
				{comparison}
			</p>
			<p class="leading-none font-semibold hyphens-auto text-balance min-w-0">
				{type.label}
				{#if currentDate} bis {dayjs(currentDate).format('D.M.')}{/if} im Schnitt {compareFirstYear}-{compareLastYear}
			</p>
		</div>
		<div class="flex items-end space-x-2">
			<p class="text-6xl font-extralight tracking-tighter leading-[0.85em]">
				{current}
			</p>
			<p class="leading-none font-semibold hyphens-auto text-balance min-w-0">
				{type.label}
				{#if currentDate}
					in diesem Jahr bis {dayjs(currentDate).format('D.M.YYYY')}{:else}
					im Jahr {selectedYear}{/if}
			</p>
		</div>
	</div>
</div>
