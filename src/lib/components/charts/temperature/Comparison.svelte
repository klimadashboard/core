<script>
	import Switch from '$lib/components/Switch.svelte';

	export let data;
	export let selectedStation;

	let chartWidth;
	let chartHeight;
	let activeView = 'months';

	$: dataset = data;

	$: if (activeView == 'months') {
	} else {
	}
</script>

<div class="mt-16">
	<Switch
		views={[
			{
				key: 'months',
				label: 'Monate'
			},
			{
				key: 'seasons',
				label: 'Jahreszeiten'
			}
		]}
		{activeView}
		on:itemClick={(event) => {
			activeView = event.detail;
		}}
	/>

	<h2 class="text-2xl max-w-lg mt-4">
		{#if (activeView = 'months')}
			Von den letzten 12 Monaten waren X Monate überdurchschnittlich warm.
		{:else}
			Von den letzten 4 Jahreszeiten waren X überdurchschnittlich warm.
		{/if}
	</h2>

	<div class="h-80 mt-4" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
		<svg width={'100%'} height={'100%'}>
			{#each dataset as datapoint}
				{datapoint}
			{/each}
		</svg>
	</div>
</div>
