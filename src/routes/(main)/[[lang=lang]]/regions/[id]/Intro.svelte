<script>
	import Panel from '$lib/components/blocks/Panel.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { onMount } from 'svelte';

	export let data;

	let place = '';
	let panels = [];
	let intro = '';
	let loading = true;

	onMount(async () => {
		place = data.page.name;

		const regionId = data.page.id;

		const res = await fetch(
			`https://base.klimadashboard.org/get-region-summary?region=${regionId}`
		);
		const result = await res.json();

		panels = result.panels;
		intro = result.intro;
		loading = false;
	});
</script>

{#if !loading}
	<div class="container my-8">
		<div>
			<p class="font-bold my-auto text-xl max-w-xl">{intro}</p>
		</div>
		<h2 class="border-b mt-6 mb-2 font-bold">Auf einen Blick</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-1">
			{#each panels.slice(0, 4) as panel}
				<div class="rounded-2xl overflow-hidden">
					<Panel block={panel} />
				</div>
			{/each}
		</div>
	</div>
{:else}
	<Loader />
{/if}
