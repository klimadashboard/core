<script>
	import { fade, fly } from 'svelte/transition';

	export let data;
	export let index;
	export let offset;
	export let progress;
	export let chartWidth;
	export let chartHeight;

	let x;
	let y;

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

	$: totalBudget = 1000;
	$: startYear = 1990;

	const pointForRatio = (p1, p2, ratio) => [
		(p2.x - p1.x) * ratio + p1.x,
		(p2.y - p1.y) * ratio + p1.y
	];

	$: randomPositions = Array.from(Array(totalBudget), (_, x) => {
		return {
			x: Math.random() * chartWidth,
			y: Math.random() * chartHeight
		};
	});

	$: circles = Array.from(Array(totalBudget), (_, x) => {
		const p1 = randomPositions[x];
		const p2 = { x: 0, y: 0 };
		let position = pointForRatio(p1, p2, Math.min(1, progress));
		if (index < 3) {
			x = position[0];
			y = position[1];
		} else {
			x = 0;
			y = 0;
		}
		return {
			x: x,
			y: y
		};
	});

	// $: console.log(circles);
	// $: console.log(offset);
</script>

<div class="w-full h-full">
	<svg width={'100%'} height={'100%'}>
		{#each circles as circle}
			<circle r={5} cx={circle.x} cy={circle.y} class="fill-black" transition:fly />
		{/each}
	</svg>
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
						<div
							class="w-3 h-3 {types.find((d) => d.key == a.type).classes} mb-0.5 rounded-xl"
							transition:fade={{ delay: j * 10 }}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
